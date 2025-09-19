import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const envCheck = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      url_value: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      key_value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + '...'
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