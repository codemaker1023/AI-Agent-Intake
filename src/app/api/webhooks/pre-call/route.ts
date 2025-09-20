import { NextRequest, NextResponse } from 'next/server'
import { validateWebhookRequest } from '@/lib/webhook'
import { validateRequest } from '@/lib/validation'
import { withRateLimit } from '@/lib/rate-limit'
import { withMonitoring } from '@/lib/monitoring'
import { lookupPatient } from '@/lib/patient'
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

  const { from, to, call_id, bot_id } = webhookValidation.body

  try {
    const { patientData, contextMessage } = await lookupPatient(from)

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

export const POST = withMonitoring(withRateLimit(handler), 'pre-call-webhook')