import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hubnetAPI } from '@/lib/hubnet-api'
import { smsService } from '@/lib/arkesel-sms'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')
    
    // Verify Paystack webhook signature
    if (process.env.PAYSTACK_SECRET_KEY) {
      const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(body).digest('hex')
      if (hash !== signature) {
        console.error('Invalid Paystack webhook signature')
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid signature' 
        }, { status: 401 })
      }
    }
    
    const callbackData = JSON.parse(body)
    console.log('Paystack webhook received:', callbackData)
    
    // Only process charge.success events
    if (callbackData.event !== 'charge.success') {
      console.log('Ignoring non-success webhook event:', callbackData.event)
      return NextResponse.json({ success: true, message: 'Event ignored' })
    }
    
    const supabase = await createClient()
    
    // Extract payment info from Paystack webhook
    const paymentData = callbackData.data
    const { 
      reference, 
      status, 
      id: paystackPaymentId,
      amount,
      currency 
    } = paymentData
    
    if (!reference) {
      return NextResponse.json({ 
        success: false, 
        message: 'No reference found in callback' 
      }, { status: 400 })
    }
    
    // Find the order by reference or paystack_reference
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
      .or(`reference.eq.${reference},paystack_reference.eq.${reference},order_id.eq.${reference}`)
      .single()
    
    if (orderError || !order) {
      console.error('Order not found for Paystack callback:', { reference, paystackPaymentId })
      return NextResponse.json({ 
        success: false, 
        message: 'Order not found' 
      }, { status: 404 })
    }
    
    // Update payment status based on Paystack callback
    let paymentStatus = 'failed'
    let deliveryStatus = order.delivery_status
    
    if (status === 'success') {
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
        paystack_reference: reference,
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
      // Check if order already has Hubnet transaction ID (prevent duplicate processing)
      if (order.hubnet_transaction_id) {
        console.log(`Order ${reference} already processed with Hubnet transaction: ${order.hubnet_transaction_id}`)
        return NextResponse.json({ 
          success: true, 
          message: 'Order already processed',
          orderStatus: { paymentStatus, deliveryStatus: 'already_processed' }
        })
      }
      
      // Check delivery status to prevent duplicate processing
      if (['processing', 'accepted', 'delivered'].includes(order.delivery_status)) {
        console.log(`Order ${reference} already in delivery status: ${order.delivery_status}`)
        return NextResponse.json({ 
          success: true, 
          message: 'Order already in progress',
          orderStatus: { paymentStatus, deliveryStatus: order.delivery_status }
        })
      }
      
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
  
  // Check for success - either direct status/code or nested in data
const isSuccess = (hubnetResult.status && hubnetResult.code === '0000') || 
                  (hubnetResult.data?.status && hubnetResult.data?.code === '0000') ||
                  (typeof hubnetResult.status === "string" && hubnetResult.status === "success" && hubnetResult.data?.status === true)

  
  if (isSuccess) {
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
    
    // Send order confirmation SMS with tracking URL (only when processing starts)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.includes('://') 
      ? process.env.NEXT_PUBLIC_BASE_URL 
      : `https://${process.env.NEXT_PUBLIC_BASE_URL}`
    
    await smsService.sendOrderConfirmation(
      order.phone, 
      order.tracking_id, 
      order.package_size, 
      order.network,
      baseUrl
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