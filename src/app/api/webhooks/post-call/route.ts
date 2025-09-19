import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Post-call webhook received:', JSON.stringify(body, null, 2))
    console.log('Available fields:', Object.keys(body))

    // Extract relevant data from the webhook payload
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
    } = body

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
    let patientMedicalId = null
    if (patient_id) {
      patientMedicalId = patient_id
    }

    if (!patientMedicalId && function_calls && Array.isArray(function_calls)) {
      const patientFunctionCall = function_calls.find((call: any) =>
        call.function === 'fetch_patient' ||
        call.name === 'fetch_patient' ||
        (call.arguments && call.arguments.medical_id)
      )

      if (patientFunctionCall) {
        if (patientFunctionCall.arguments?.medical_id) {
          patientMedicalId = patientFunctionCall.arguments.medical_id
        } else if (patientFunctionCall.arguments?.id) {
          patientMedicalId = patientFunctionCall.arguments.id
        }
      }
    }

    if (!patientMedicalId && transcript) {
      const medicalIdMatch = transcript.match(/MED\d{3}/i)
      if (medicalIdMatch) {
        patientMedicalId = medicalIdMatch[0].toUpperCase()
      }
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