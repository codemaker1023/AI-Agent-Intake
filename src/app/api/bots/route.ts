import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { withMonitoring } from '@/lib/monitoring'
import { validateRequest } from '@/lib/validation'
import { getEnv } from '@/lib/env'

// GET /api/bots - List all bots
async function getHandler(request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  const env = getEnv()
  if (!env) {
    return NextResponse.json({
      error: 'Environment not configured'
    }, { status: 500 })
  }

  try {
    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bots:', error)
      return NextResponse.json({ error: 'Failed to fetch bots. Please check your Supabase configuration and ensure tables are created.' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET bots error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/bots - Create a new bot
async function postHandler(request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  const env = getEnv()
  if (!env) {
    return NextResponse.json({
      error: 'Environment not configured'
    }, { status: 500 })
  }

  const body = await request.json()
  console.log('Received body:', body)
  const { uid, name, prompt, domain } = body

  if (!uid || !name || !prompt) {
    return NextResponse.json({ error: 'UID, name, and prompt are required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('bots')
      .insert({
        uid,
        name,
        prompt,
        domain: domain || 'medical'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating bot:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({
        error: 'Failed to create bot. Please check your Supabase configuration and ensure tables are created.',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST bots error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = getHandler
export const POST = postHandler