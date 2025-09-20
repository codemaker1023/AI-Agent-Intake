import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateWebhookRequest } from '@/lib/webhook'
import { validateRequest } from '@/lib/validation'
import { withRateLimit } from '@/lib/rate-limit'
import { withMonitoring } from '@/lib/monitoring'
import { extractPatientIdFromCall } from '@/lib/patient'
import { getEnv } from '@/lib/env'

async function handler(request: NextRequest) {
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
    return NextResponse.json({
      error: errorMessage
    }, { status: webhookValidation.errors ? 400 : 401 })
  }

  const {
    call_id,
    bot_id,
    transcript,
    summary,
    duration,
    status,
    metadata,
    function_calls,
    patient_id
  } = webhookValidation.body

  try {
    console.log('Looking for bot with ID:', bot_id)
    let { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id, name')
      .eq('uid', bot_id)
      .single()

    if (botError && bot_id) {
      console.log('Bot not found by uid, trying alternative search...')
      const { data: bots } = await supabase
        .from('bots')
        .select('id, name, uid')
        .ilike('name', `%${bot_id}%`)

      if (bots && bots.length > 0) {
        bot = bots[0]
        console.log('Found bot by name search:', bot.name)
      }
    }

    if (botError && !bot) {
      console.error('Bot not found for ID:', bot_id)
      console.log('Available bots in database:')
      const { data: allBots } = await supabase
        .from('bots')
        .select('id, name, uid')
      console.log(allBots)
    } else {
      console.log('Found bot:', bot?.name)
    }

    let patientId = null
    const patientMedicalId = patient_id || await extractPatientIdFromCall(function_calls, transcript)

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

        // Update patient's last call summary
        await supabase
          .from('patients')
          .update({
            last_call_summary: summary || transcript?.substring(0, 500),
            last_call_date: new Date().toISOString()
          })
          .eq('id', patientId)
      } else {
        console.log('Patient not found for medical ID:', patientMedicalId)
      }
    }

    const { error: logError } = await supabase
      .from('call_logs')
      .insert({
        bot_id: bot?.id,
        patient_id: patientId,
        call_sid: call_id,
        transcript: transcript,
        summary: summary,
        duration: duration,
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