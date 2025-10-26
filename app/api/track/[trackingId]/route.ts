import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { trackingId: string } }) {
  try {
    const { trackingId } = params

    if (!trackingId) {
      return NextResponse.json({
        success: false,
        message: 'Tracking ID is required'
      }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Find order by tracking ID
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          name,
          email
        )
      `)
      .eq('tracking_id', trackingId)
      .single()

    if (error || !order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found with this tracking ID'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Track order error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to track order'
    }, { status: 500 })
  }
}