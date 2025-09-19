import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/bots - List all bots
export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        error: 'Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
      }, { status: 500 })
    }

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
export async function POST(request: NextRequest) {
  try {
    console.log('Environment check:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
    })

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        error: 'Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
        env_status: {
          url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          key_set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }, { status: 500 })
    }

    const body = await request.json()
    const { uid, name, prompt, domain } = body

    if (!uid || !name || !prompt) {
      return NextResponse.json({ error: 'UID, name, and prompt are required' }, { status: 400 })
    }

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