import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Pre-call webhook received:', body)

    const { from, to, call_id, bot_id } = body

    let patientData = null
    let contextMessage = 'No patient data available. Please have the caller provide their medical ID during the conversation.'

    if (from) {
      // Try to find patient by phone number
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('phone', from)
        .single()

      if (!error && data) {
        patientData = data
        contextMessage = `Patient Information: Name: ${data.name}, Medical ID: ${data.medical_id}, Allergies: ${data.allergies || 'None reported'}, Current Medications: ${data.current_medications || 'None'}, Medical History: ${data.medical_history || 'No significant history'}, Last Call Summary: ${data.last_call_summary || 'No previous calls'}`
      }
    }

    if (!patientData) {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .limit(1)
        .single()

      if (!error && data) {
        patientData = data
        contextMessage = `Example Patient Data (for demo): Name: ${data.name}, Medical ID: ${data.medical_id}. In a real scenario, verify patient identity during the call.`
      }
    }

    // Return data that will be injected into the call context
    return NextResponse.json({
      patient_data: patientData,
      context: contextMessage,
      call_details: {
        from: from,
        to: to,
        call_id: call_id,
        bot_id: bot_id
      }
    })
  } catch (error) {
    console.error('Pre-call webhook error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      context: 'System error occurred. Please proceed with the call and gather patient information manually.'
    }, { status: 500 })
  }
}