import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { withMonitoring } from '@/lib/monitoring'
import { getEnv } from '@/lib/env'

// GET /api/call-logs - List all call logs
async function handler(request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  const env = getEnv()
  if (!env) {
    return NextResponse.json({
      error: 'Environment not configured'
    }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('bot_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Cap at 100

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

export const GET = handler