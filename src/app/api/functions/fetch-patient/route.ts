import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Function call received:', body)

    const { medical_id } = body

    if (!medical_id) {
      return NextResponse.json({
        error: 'Medical ID is required'
      }, { status: 400 })
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .select(`
        *,
        medications (*),
        appointments (*)
      `)
      .eq('medical_id', medical_id)
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