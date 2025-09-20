import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, ApiHandler } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { withMonitoring } from '@/lib/monitoring'

// GET /api/bots/[id] - Get a specific bot
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (error) {
      console.error('Error fetching bot:', error)
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET bot error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/bots/[id] - Update a bot
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const body = await request.json()
    const { uid, name, prompt, domain, is_active } = body

    const { data, error } = await supabase
      .from('bots')
      .update({
        uid,
        name,
        prompt,
        domain,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating bot:', error)
      return NextResponse.json({ error: 'Failed to update bot' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('PUT bot error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/bots/[id] - Delete a bot
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const { error } = await supabase
      .from('bots')
      .delete()
      .eq('id', resolvedParams.id)

    if (error) {
      console.error('Error deleting bot:', error)
      return NextResponse.json({ error: 'Failed to delete bot' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Bot deleted successfully' })
  } catch (error) {
    console.error('DELETE bot error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = getHandler
export const PUT = putHandler
export const DELETE = deleteHandler