import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hubnetAPI } from '@/lib/hubnet-api'
import { smsService } from '@/lib/arkesel-sms'

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json()
    console.log('Payment callback received:', callbackData)
    
    const supabase = await createClient()
    
    // Extract payment info from callback
    const { 
      reference, 
      status, 
      id: ogatewayPaymentId,
      amount,
      currency 
    } = callbackData
    
    if (!reference) {
      return NextResponse.json({ 
        success: false, 
        message: 'No reference found in callback' 
      }, { status: 400 })
    }
    
    // Find the order by reference or ogateway_payment_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          name,
          phone,
          email
        )
      `)
      .or(`reference.eq.${reference},ogateway_payment_id.eq.${ogatewayPaymentId}`)
      .single()
    
    if (orderError || !order) {
      console.error('Order not found for callback:', { reference, ogatewayPaymentId })
      return NextResponse.json({ 
        success: false, 
        message: 'Order not found' 
      }, { status: 404 })
    }
    
    // Update payment status based on callback
    let paymentStatus = 'failed'
    let deliveryStatus = order.delivery_status
    
    if (status === 'successful' || status === 'completed') {
      paymentStatus = 'confirmed'
      deliveryStatus = 'processing'
    } else if (status === 'pending') {
      paymentStatus = 'pending'
    }
    
    // Update order in database
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        delivery_status: deliveryStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
    
    if (updateError) {
      console.error('Failed to update order:', updateError)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to update order status' 
      }, { status: 500 })
    }
    
    // If payment successful, process data delivery
    if (paymentStatus === 'confirmed') {
      try {
        const deliveryResult = await processDataDelivery(order)
        console.log('Data delivery result:', deliveryResult)
      } catch (error) {
        console.error('Data delivery failed:', error)
        // Update delivery status to failed
        await supabase
          .from('orders')
          .update({
            delivery_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Callback processed successfully',
      orderStatus: { paymentStatus, deliveryStatus }
    })
  } catch (error) {
    console.error('Callback processing error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Callback processing failed' 
    }, { status: 500 })
  }
}

async function processDataDelivery(order: any) {
  const supabase = await createClient()
  
  console.log(`Processing data delivery for order: ${order.order_id}`)
  
  const packageSizeGB = Number.parseFloat(order.package_size.replace('GB', ''))
  
  // Use Hubnet API to deliver data
  const hubnetResult = await hubnetAPI.purchaseFromPackage(
    order.network,
    order.phone,
    packageSizeGB,
    order.order_id,
    order.phone
  )
  
  if (hubnetResult.status && hubnetResult.code === '0000') {
    // Update order with delivery success
    await supabase
      .from('orders')
      .update({
        delivery_status: 'delivered',
        hubnet_transaction_id: hubnetResult.transaction_id,
        hubnet_payment_id: hubnetResult.payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
    
    // Send SMS confirmation
    await smsService.sendDeliveryConfirmation(
      order.phone, 
      order.tracking_id, 
      order.package_size, 
      order.network
    )
    
    return {
      success: true,
      message: 'Data delivered successfully',
      transactionId: hubnetResult.transaction_id
    }
  } else {
    // Update order with delivery failure
    await supabase
      .from('orders')
      .update({
        delivery_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
    
    // Send failure SMS
    await smsService.sendDeliveryFailure(
      order.phone, 
      order.tracking_id, 
      order.package_size, 
      order.network
    )
    
    throw new Error(`Hubnet delivery failed: ${hubnetResult.data?.message || hubnetResult.reason}`)
  }
}