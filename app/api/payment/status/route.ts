import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json({
        success: false,
        message: 'Order reference is required'
      }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Check order status in database
    const { data: order, error } = await supabase
      .from('orders')
      .select('payment_status, delivery_status')
      .eq('reference', reference)
      .single()

    if (error) {
      console.error('Error fetching order status:', error)
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 })
    }

    // Map database status to frontend status
    let status = 'pending'
    if (order.payment_status === 'confirmed') {
      status = 'confirmed'
    } else if (order.payment_status === 'failed') {
      status = 'failed'
    }

    return NextResponse.json({
      success: true,
      status,
      paymentStatus: order.payment_status,
      deliveryStatus: order.delivery_status
    })
  } catch (error) {
    console.error('Payment status API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to check payment status'
    }, { status: 500 })
  }
}