import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const endpoint = searchParams.get('endpoint')
    const network = searchParams.get('network')
    const success = searchParams.get('success')

    const supabase = await createClient()
    
    let query = supabase
      .from('api_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (endpoint) {
      query = query.like('endpoint', `%${endpoint}%`)
    }
    if (network) {
      query = query.eq('network', network.toLowerCase())
    }
    if (success !== null && success !== undefined) {
      query = query.eq('success', success === 'true')
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('Error fetching API logs:', error)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch API logs'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: logs || []
    })
  } catch (error) {
    console.error('API logs error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch API logs'
    }, { status: 500 })
  }
}