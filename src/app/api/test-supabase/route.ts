import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withRateLimit } from '@/lib/rate-limit'
import { withMonitoring } from '@/lib/monitoring'
import { getEnv } from '@/lib/env'

async function handler(request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  try {
    const env = getEnv()
    const envCheck = {
      url: env ? 'SET' : 'NOT SET',
      key: env ? 'SET' : 'NOT SET',
      url_value: env?.supabaseUrl ? env.supabaseUrl.substring(0, 30) + '...' : 'NOT SET',
      key_value: env?.supabaseKey ? env.supabaseKey.substring(0, 10) + '...' : 'NOT SET'
    }

    if (!env) {
      return NextResponse.json({
        status: 'error',
        environment: envCheck,
        message: 'Environment not configured'
      }, { status: 500 })
    }

    const { data, error } = await supabase
      .from('bots')
      .select('count', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json({
        status: 'error',
        environment: envCheck,
        supabase_error: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'success',
      environment: envCheck,
      connection: 'OK',
      table_count: data
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export const GET = withMonitoring(withRateLimit(handler), 'test-supabase')