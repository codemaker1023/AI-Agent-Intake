import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/call-logs - List all call logs
export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        error: 'Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
      }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('bot_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('call_logs')
      .select(`
        *,
        bots (
          name,
          uid
        ),
        patients (
          name,
          medical_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (botId) {
      query = query.eq('bot_id', botId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching call logs:', error)
      return NextResponse.json({ error: 'Failed to fetch call logs. Please check your Supabase configuration and ensure tables are created.' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET call logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}