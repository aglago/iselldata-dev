import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paystackAPI } from '@/lib/paystack'
import { hubnetAPI } from '@/lib/hubnet-api'
import { checkLowBalanceAlert } from '@/lib/balance-alert'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()
    
    if (!reference) {
      return NextResponse.json({
        success: false,
        message: 'Payment reference is required'
      }, { status: 400 })
    }

    console.log('Verifying payment for reference:', reference)

    // Check payment status from Paystack
    const paystackResponse = await paystackAPI.verifyTransaction(reference)

    if (!paystackResponse.status) {
      console.error('Paystack verification failed:', paystackResponse.message)
      return NextResponse.json({
        success: false,
        message: 'Failed to verify payment with Paystack'
      }, { status: 500 })
    }

    const paymentData = paystackResponse.data
    console.log('Paystack payment verification:', paymentData)

    if (paymentData.status.toLowerCase() !== 'success') {
      return NextResponse.json({
        success: false,
        message: 'Payment was not successful'
      }, { status: 400 })
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
      console.error('Order not found for verification:', { reference })
      return NextResponse.json({ 
        success: false, 
        message: 'Order not found' 
      }, { status: 404 })
    }

    // Check if order is already processed
    if (order.payment_status === 'confirmed') {
      return NextResponse.json({ 
        success: true, 
        message: 'Payment already verified',
        order: order
      })
    }

    // Additional check for Hubnet transaction ID (prevent duplicate processing)
    if (order.hubnet_transaction_id) {
      console.log(`Order ${order.order_id} already has Hubnet transaction: ${order.hubnet_transaction_id}`)
      return NextResponse.json({ 
        success: true, 
        message: 'Order already processed through Hubnet',
        order: order
      })
    }

    // Check delivery status to prevent duplicate processing
    if (['processing', 'accepted', 'delivered'].includes(order.delivery_status)) {
      console.log(`Order ${order.order_id} already in delivery status: ${order.delivery_status}`)
      return NextResponse.json({ 
        success: true, 
        message: 'Order already being processed',
        order: order
      })
    }

    // Update payment status to confirmed and delivery to processing
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'confirmed',
        delivery_status: 'processing',
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

    // Process data delivery (same as callback route)
    try {
      const deliveryResult = await processDataDelivery(order)
      console.log('Data delivery result:', deliveryResult)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified and order processed successfully',
        order: order,
        delivery: deliveryResult
      })
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
      
      return NextResponse.json({ 
        success: false, 
        message: 'Payment verified but delivery failed' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to verify payment'
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
    '0249905548'
  )
  
  // Check for success - either direct status/code or nested in data
  const isSuccess = (hubnetResult.status && hubnetResult.code === '0000') || 
                  (hubnetResult.data?.status && hubnetResult.data?.code === '0000') ||
                  (typeof hubnetResult.status === "string" && hubnetResult.status === "success" && hubnetResult.data?.status === true)
  
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
    
    throw new Error(`Hubnet delivery failed: ${hubnetResult.data?.message || hubnetResult.reason}`)
  }
}