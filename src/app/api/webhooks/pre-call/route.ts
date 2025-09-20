import { NextRequest, NextResponse } from 'next/server'
import { validateWebhookRequest } from '@/lib/webhook'
import { withRateLimit } from '@/lib/rate-limit'
import { withMonitoring } from '@/lib/monitoring'
import { lookupPatient } from '@/lib/patient'
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

  // Openmic pre-call payload structure
  const body = webhookValidation.body
  console.log('Raw pre-call payload:', JSON.stringify(body, null, 2))
  const call = body.call || body // Handle if call is not wrapped
  const { bot_id, from_number, attempt } = call

  try {
    console.log('Pre-call webhook received:', { bot_id, from_number, attempt })

    // Lookup patient by phone number
    const { patientData } = await lookupPatient(from_number)

    // Extract names from webhook payload if available
    const payloadCustomerName = call.customer_name || call.patient_name
    const payloadBotName = call.bot_name || call.assistant_name

    // Validate required fields from payload
    if (!payloadCustomerName && !patientData?.name) {
      console.log('No customer name found in payload or database')
      return NextResponse.json({
        error: 'Customer name required in webhook payload'
      }, { status: 400 })
    }

    // Format response for Openmic
    const dynamicVariables = {
      customer_name: payloadCustomerName || patientData?.name,
      bot_name: payloadBotName || '',
      medical_id: patientData?.medical_id || '',
      allergies: patientData?.allergies || 'None reported',
      current_medications: patientData?.current_medications || 'None',
      medical_history: patientData?.medical_history || 'No significant history',
      last_call_summary: patientData?.last_call_summary || 'No previous calls'
    }

    return NextResponse.json({
      call: {
        dynamic_variables: dynamicVariables
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

export const POST = withMonitoring(withRateLimit(handler), 'pre-call-webhook')