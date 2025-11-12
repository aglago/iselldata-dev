import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { checkLowBalanceAlert } from '@/lib/balance-alert'

export const dynamic = 'force-dynamic'

// Webhook endpoint for payment confirmations from payment providers
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get("x-paystack-signature")
    
    // Verify Paystack webhook signature
    if (process.env.PAYSTACK_SECRET_KEY) {
      const crypto = require('crypto')
      const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(body).digest('hex')
      if (hash !== signature) {
        console.error('Invalid Paystack webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload = JSON.parse(body)
    console.log('Paystack webhook received:', payload)
    
    // Only process charge.success events
    if (payload.event !== 'charge.success') {
      console.log('Ignoring non-success webhook event:', payload.event)
      return NextResponse.json({ success: true, message: 'Event ignored' })
    }

    // Process payment confirmation for Paystack
    const result = await processPaystackWebhook(payload)

    if (result.success) {
      console.log("Payment confirmed for order:", result.orderId)
      return NextResponse.json({ 
        success: true, 
        message: 'Payment webhook processed successfully',
        orderStatus: result.status
      }, { status: 200 })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Payment processing failed' 
      }, { status: 200 }) // Return 200 to prevent Paystack retries even on processing failures
    }
  } catch (error) {
    console.error("Payment webhook processing error:", error)
    return NextResponse.json({ error: "Payment webhook processing failed" }, { status: 500 })
  }
}

function verifyWebhookSignature(signature: string | null, provider: string): boolean {
  // Implement signature verification based on payment provider
  // For MTN MoMo, Vodafone Cash, etc.

  if (!signature) return false

  // Example verification logic (implement based on your provider's requirements)
  const expectedSignature = process.env[`${provider.toUpperCase()}_WEBHOOK_SECRET`]
  return signature === expectedSignature
}

async function processPaystackWebhook(payload: any) {
  try {
    const { createClient } = require('@/lib/supabase/server')
    const { hubnetAPI } = require('@/lib/hubnet-api')
    const { smsService } = require('@/lib/arkesel-sms')
    
    // Extract payment info from Paystack webhook
    const paymentData = payload.data
    const { 
      reference, 
      status, 
      id: paystackPaymentId,
      amount,
      currency 
    } = paymentData
    
    if (!reference) {
      return { success: false, message: 'No reference found in webhook' }
    }
    
    const supabase = await createClient()
    
    // Find the order by reference
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
      console.error('Order not found for Paystack webhook:', { reference, paystackPaymentId })
      return { success: false, message: 'Order not found' }
    }
    
    // Update payment status based on Paystack webhook
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
      return { success: false, message: 'Failed to update order status' }
    }
    
    // If payment successful, process data delivery
    if (paymentStatus === 'confirmed') {
      // Multiple duplicate checks for extra safety
      if (order.hubnet_transaction_id) {
        console.log(`Order ${reference} already processed with Hubnet transaction: ${order.hubnet_transaction_id}`)
        return { success: true, orderId: reference, status: 'already_processed' }
      }
      
      if (['processing', 'accepted', 'delivered'].includes(order.delivery_status)) {
        console.log(`Order ${reference} already in delivery status: ${order.delivery_status}`)
        return { success: true, orderId: reference, status: 'already_in_progress' }
      }
      
      try {
        const deliveryResult = await processDataDelivery(order)
        console.log('Data delivery result:', deliveryResult)
        return { success: true, orderId: reference, status: deliveryResult }
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
        return { success: false, message: 'Data delivery failed' }
      }
    }
    
    return { success: true, orderId: reference, status: { paymentStatus, deliveryStatus } }
  } catch (error) {
    console.error("Paystack webhook processing error:", error)
    return { success: false, message: 'Webhook processing failed' }
  }
}

async function processDataDelivery(order: any) {
  const { createClient } = require('@/lib/supabase/server')
  const { hubnetAPI } = require('@/lib/hubnet-api')
  const { smsService } = require('@/lib/arkesel-sms')
  
  const supabase = await createClient()
  
  console.log(`Processing data delivery for order: ${order.order_id}`)
  
  const packageSizeGB = Number.parseFloat(order.package_size.replace('GB', ''))
  
  // Use Hubnet API to deliver data
  const hubnetResult = await hubnetAPI.purchaseFromPackage(
    order.network,
    order.phone,
    packageSizeGB,
    order.order_id,
    '0249905548'
  )
  
  // Check for success - either direct status/code or nested in data
  const isSuccess = (hubnetResult.status && hubnetResult.code === '0000') || 
                    (hubnetResult.data?.status && hubnetResult.data?.code === '0000') ||
                    (hubnetResult.status === 'success' && hubnetResult.data?.status)
  
  if (isSuccess) {
    // Update order with delivery accepted (not delivered yet - awaiting webhook)
    await supabase
      .from('orders')
      .update({
        delivery_status: 'accepted',
        hubnet_transaction_id: hubnetResult.transaction_id,
        hubnet_payment_id: hubnetResult.payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
    
    // Check for low balance and alert admin if needed
    await checkLowBalanceAlert(hubnetResult)
    
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

