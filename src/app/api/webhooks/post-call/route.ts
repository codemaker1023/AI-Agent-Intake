import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateWebhookRequest } from '@/lib/webhook'
import { withRateLimit } from '@/lib/rate-limit'
import { withMonitoring } from '@/lib/monitoring'
import { extractPatientIdFromCall } from '@/lib/patient'
import { getEnv } from '@/lib/env'

async function handler(request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  const env = getEnv()
  if (!env) {
    return NextResponse.json({
      error: 'Environment not configured'
    }, { status: 500 })
  }

  // Validate webhook signature and payload
  const webhookValidation = await validateWebhookRequest(request)
  if (!webhookValidation.isValid) {
    const errorMessage = webhookValidation.errors ?
      `Validation failed: ${webhookValidation.errors.join(', ')}` :
      'Invalid webhook signature'
    console.log('Webhook validation failed:', errorMessage)
    return NextResponse.json({
      error: errorMessage
    }, { status: webhookValidation.errors ? 400 : 401 })
  }

  const body = webhookValidation.body
  console.log('Raw post-call payload:', JSON.stringify(body, null, 2))

  const {
    sessionId,
    fromPhoneNumber,
    toPhoneNumber,
    transcript,
    summary,
    createdAt,
    endedAt,
    dynamicVariables,
    analysis,
    structured_data
  } = body

  // Map Openmic fields to our expected fields
  const call_id = sessionId
  const bot_id = analysis?.bot_id || structured_data?.bot_id || sessionId // sessionId is the bot_id
  const patient_id = analysis?.patient_id || structured_data?.patient_id
  const function_calls: Array<{ name: string; arguments: Record<string, unknown> }> = [] // Openmic doesn't send function calls
  const duration = createdAt && endedAt ? Math.floor((new Date(endedAt).getTime() - new Date(createdAt).getTime()) / 1000) : undefined
  const status = 'completed' // Assume completed for now
  const metadata = dynamicVariables

  // Convert transcript array to string for processing
  const transcriptText = Array.isArray(transcript) ? transcript.map(([speaker, message]) => `${speaker}: ${message}`).join('\n') : (transcript || summary || '')

  console.log('Post-call webhook received:', { call_id, bot_id, patient_id, function_calls: function_calls?.length, analysis, structured_data })

  try {
    let bot = null
    const effectiveBotId = analysis?.bot_id || structured_data?.bot_id || bot_id

    // Extract bot name from payload if available
    const payloadBotName = analysis?.bot_name || structured_data?.bot_name || dynamicVariables?.bot_name

    if (!effectiveBotId && !payloadBotName) {
      console.log('No bot_id or bot_name provided in payload')
      return NextResponse.json({ error: 'Bot identification required' }, { status: 400 })
    }

    console.log('Looking for bot with ID:', effectiveBotId)
    const { data: botData, error: botError } = await supabase
      .from('bots')
      .select('id, name')
      .eq('uid', effectiveBotId)
      .single()

    if (botError) {
      console.log('Bot not found by uid, trying alternative search...')
      const { data: bots } = await supabase
        .from('bots')
        .select('id, name, uid')
        .ilike('name', `%${effectiveBotId}%`)

      if (bots && bots.length > 0) {
        bot = bots[0]
        console.log('Found bot by name search:', bot.name)
      } else {
        // Try to extract bot name from summary or use payload name
        const botNameMatch = summary?.match(/agent \(([^)]+)\)/) || summary?.match(/identifying as ([^,]+)/)
        const extractedBotName = botNameMatch ? botNameMatch[1].trim() : payloadBotName
        if (!extractedBotName) {
          console.log('No bot name found in payload or summary')
          return NextResponse.json({ error: 'Bot name required' }, { status: 400 })
        }
        bot = { id: '05565d8a-9201-4d52-94c6-b40ad194f8f1', name: extractedBotName }
        console.log('Using extracted bot name:', extractedBotName)
      }
    } else {
      bot = botData
      console.log('Found bot:', bot.name)
    }

    // Extract patient information from payload
    const payloadPatientName = analysis?.patient_name || structured_data?.patient_name || dynamicVariables?.customer_name
    const payloadMedicalId = analysis?.medical_id || structured_data?.medical_id || dynamicVariables?.medical_id

    let patientId = null
    const extractedPatientId = analysis?.patient_id || structured_data?.patient_id || patient_id
    let patientMedicalId = payloadMedicalId || extractedPatientId || await extractPatientIdFromCall(function_calls, transcriptText)

    if (!patientMedicalId && !payloadPatientName) {
      console.log('No patient identification found in payload')
      return NextResponse.json({ error: 'Patient identification required' }, { status: 400 })
    }

    if (!patientMedicalId) {
      // Try to extract patient name from summary
      const patientNameMatch = summary?.match(/patient as ([^.]+)\./) || summary?.match(/assisted ([^,]+) in/)
      const extractedPatientName = patientNameMatch ? patientNameMatch[1].trim() : payloadPatientName
      if (!extractedPatientName) {
        console.log('No patient name found in payload or summary')
        return NextResponse.json({ error: 'Patient name required' }, { status: 400 })
      }
      // Generate a medical ID if not provided
      patientMedicalId = `MED${Date.now().toString().slice(-3)}`
      console.log('Generated medical ID for patient:', patientMedicalId)
    }

    // Find patient in database
    if (patientMedicalId) {
      console.log('Looking for patient with medical ID:', patientMedicalId)
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('medical_id', patientMedicalId)
        .single()

      if (patient) {
        patientId = patient.id
        console.log('Found patient:', patientId)
        console.log('Patient lookup successful:', patient)

        // Update patient's last call summary
        await supabase
          .from('patients')
          .update({
            last_call_summary: summary || transcript?.substring(0, 500),
            last_call_date: new Date().toISOString()
          })
          .eq('id', patientId)
      } else {
        console.log('Patient not found for medical ID:', patientMedicalId, '- creating new patient record')
        // Create new patient record
        const patientName = payloadPatientName || `Patient ${patientMedicalId}`
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert({
            medical_id: patientMedicalId,
            name: patientName,
            last_call_summary: summary || transcript?.substring(0, 500),
            last_call_date: new Date().toISOString()
          })
          .select('id')
          .single()

        if (!createError && newPatient) {
          patientId = newPatient.id
          console.log('Created new patient:', patientId)
        } else {
          console.error('Failed to create patient:', createError)
        }
      }
    }

    const { error: logError } = await supabase
      .from('call_logs')
      .insert({
        bot_id: bot?.id,
        patient_id: patientId,
        call_sid: call_id,
        transcript: transcriptText,
        summary: summary,
        duration: duration || 30, // Default 30 seconds if not provided
        status: status || 'completed',
        metadata: metadata,
        function_calls: function_calls
      })

    if (logError) {
      console.error('Error logging call:', logError)
      return NextResponse.json({ error: 'Failed to log call' }, { status: 500 })
    }

    console.log('Call logged successfully')

    return NextResponse.json({ success: true, message: 'Call logged successfully' })
  } catch (error) {
    console.error('Post-call webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withMonitoring(withRateLimit(handler), 'post-call-webhook')