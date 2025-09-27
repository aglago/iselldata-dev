import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { smsService } from '@/lib/arkesel-sms'

export async function POST(request: NextRequest) {
  try {
    const { orderId, phone, packageSize, network } = await request.json()
    
    if (!orderId || !phone || !packageSize || !network) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Verify order exists and get tracking ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('tracking_id, payment_status')
      .eq('order_id', orderId)
      .single()
    
    if (orderError || !order) {
      return NextResponse.json({ 
        success: false, 
        message: 'Order not found' 
      }, { status: 404 })
    }

    // Send SMS confirmation
    const smsResult = await smsService.sendDeliveryConfirmation(
      phone, 
      order.tracking_id, 
      packageSize, 
      network
    )
    
    if (smsResult.status === 'success') {
      return NextResponse.json({ 
        success: true, 
        message: 'SMS confirmation sent successfully' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send SMS confirmation' 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('SMS confirmation error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'SMS confirmation failed' 
    }, { status: 500 })
  }
}