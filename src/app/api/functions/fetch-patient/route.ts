import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateRequest } from '@/lib/validation'
import { requireAuth } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { withMonitoring } from '@/lib/monitoring'
import { isValidMedicalId } from '@/lib/validation'
import { getEnv } from '@/lib/env'

async function handler(request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  const env = getEnv()
  if (!env) {
    return NextResponse.json({
      error: 'Environment not configured'
    }, { status: 500 })
  }

  // Validate and sanitize input
  const validation = await validateRequest(request)
  if (!validation.isValid) {
    return validation.response!
  }

  const { medical_id } = validation.body as { medical_id: string }

  if (!medical_id || !isValidMedicalId(medical_id)) {
    return NextResponse.json({
      error: 'Valid medical ID is required'
    }, { status: 400 })
  }

  try {
    const { data: patient, error } = await supabase
      .from('patients')
      .select(`
        *,
        medications (*),
        appointments (*)
      `)
      .eq('medical_id', medical_id.toUpperCase())
      .single()

    if (error) {
      console.error('Error fetching patient:', error)
      return NextResponse.json({
        error: 'Patient not found',
        medical_id: medical_id
      }, { status: 404 })
    }

    // Format the response for the AI agent
    const response = {
      patient_found: true,
      patient_info: {
        name: patient.name,
        medical_id: patient.medical_id,
        date_of_birth: patient.date_of_birth,
        allergies: patient.allergies || 'None reported',
        current_medications: patient.current_medications || 'None',
        medical_history: patient.medical_history || 'No significant history',
        recent_visits: patient.recent_visits || [],
        upcoming_appointments: patient.upcoming_appointments || [],
        last_call_summary: patient.last_call_summary || 'No previous calls'
      },
      medications: patient.medications || [],
      appointments: patient.appointments || []
    }

    console.log('Function call response:', response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Function call error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = handler