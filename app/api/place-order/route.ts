import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hubnetAPI } from '@/lib/hubnet-api'
import { smsService } from '@/lib/arkesel-sms'
import { getHubnetCost, estimateHubnetCost } from '@/lib/hubnet-pricing'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        message: 'Order ID is required'
      }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get order details
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
      .eq('order_id', orderId)
      .single()
    
    if (orderError || !order) {
      console.error('Order not found:', orderId)
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 })
    }
    
    // Check if payment is confirmed
    if (order.payment_status !== 'confirmed') {
      return NextResponse.json({
        success: false,
        message: 'Payment not confirmed for this order'
      }, { status: 400 })
    }
    
    // Check if already processed or delivered
    if (order.delivery_status === 'delivered') {
      return NextResponse.json({
        success: true,
        message: 'Order already delivered',
        alreadyDelivered: true
      })
    }
    
    if (order.delivery_status === 'placed' || order.delivery_status === 'processing') {
      return NextResponse.json({
        success: false,
        message: 'Order already placed and being processed'
      }, { status: 400 })
    }
    
    console.log(`Processing data delivery for order: ${order.order_id}`)
    
    // Handle Telecel orders separately (manual processing)
    if (order.network.toLowerCase() === 'telecel') {
      // Update status to placed for manual processing
      await supabase
        .from('orders')
        .update({
          delivery_status: 'placed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)
      
      // Send SMS to admin for manual processing
      try {
        const adminMessage = `TELECEL ORDER ALERT: Order ${order.order_id} - ${order.package_size} for ${order.phone}. Customer: ${order.customers?.name || 'N/A'}. Amount: GH₵${order.package_price}. Please process manually.`
        await smsService.sendSMS({
          to: '0249905548',
          message: adminMessage
        })
        console.log('Admin SMS sent for Telecel order:', order.order_id)
      } catch (smsError) {
        console.error('Failed to send admin SMS for Telecel order:', smsError)
      }
      
      return NextResponse.json({
        success: true,
        message: 'Telecel order queued for manual processing. Admin has been notified.',
        status: 'placed',
        requiresManualProcessing: true
      })
    }
    
    // Update status to placed for Hubnet processing
    await supabase
      .from('orders')
      .update({
        delivery_status: 'placed',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)
    
    const packageSizeGB = Number.parseFloat(order.package_size.replace('GB', ''))
    
    // Check Hubnet balance before attempting purchase
    console.log('Checking Hubnet balance before placing order...')
    const balanceCheck = await hubnetAPI.checkBalance()
    
    if (!balanceCheck.status) {
      console.error('Failed to check Hubnet balance')
      
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
        message: 'Unable to verify account balance. Please try again later.',
        status: 'failed'
      }, { status: 500 })
    }
    
    // Get exact Hubnet cost for this package
    const exactCost = getHubnetCost(order.network, packageSizeGB)
    
    if (exactCost === null) {
      console.error(`No pricing data available for ${packageSizeGB}GB on ${order.network}`)
      
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
        message: `Package size ${packageSizeGB}GB is not available for ${order.network.toUpperCase()}`,
        status: 'failed'
      }, { status: 400 })
    }
    
    const estimatedCost = exactCost
    
    if (balanceCheck.balance < estimatedCost) {
      console.error(`Insufficient balance: ${balanceCheck.balance} ${balanceCheck.currency} < ${estimatedCost} GHS (exact cost)`)
      
      // Update delivery status to failed
      await supabase
        .from('orders')
        .update({
          delivery_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)
      
      // Log insufficient balance for monitoring (no SMS to save costs)
      console.warn(`INSUFFICIENT BALANCE: ${balanceCheck.balance} ${balanceCheck.currency} < ${estimatedCost} GHS for order ${order.order_id}`)
      
      return NextResponse.json({
        success: false,
        message: `Insufficient account balance (${balanceCheck.balance} ${balanceCheck.currency}). Current balance: ${balanceCheck.balance} ${balanceCheck.currency}, Required: ${estimatedCost} GHS.`,
        status: 'failed',
        balanceError: true
      }, { status: 400 })
    }
    
    console.log(`Balance check passed: ${balanceCheck.balance} ${balanceCheck.currency} >= ${estimatedCost} GHS (exact cost for ${packageSizeGB}GB ${order.network})`)
    
    try {
      // Use Hubnet API to deliver data
      const hubnetResult = await hubnetAPI.purchaseFromPackage(
        order.network,
        order.phone,
        packageSizeGB,
        order.order_id,
        order.phone
      )
      
      if (hubnetResult.status && hubnetResult.code === '0000') {
        // Update order with transaction details (processing, not delivered yet)
        await supabase
          .from('orders')
          .update({
            delivery_status: 'processing',
            hubnet_transaction_id: hubnetResult.transaction_id,
            hubnet_payment_id: hubnetResult.payment_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)
        
        // Send SMS confirmation for transaction initialization
        try {
          const message = `Your ${order.package_size} ${order.network.toUpperCase()} data order is being processed. Tracking ID: ${order.tracking_id}. You'll receive confirmation when delivered. Transaction ID: ${hubnetResult.transaction_id}`
          await smsService.sendSMS({
            to: order.phone,
            message
          })
        } catch (smsError) {
          console.error('SMS sending failed:', smsError)
          // Don't fail the whole process for SMS errors
        }
        
        console.log('Hubnet transaction initialized for order:', order.order_id)
        
        return NextResponse.json({
          success: true,
          message: 'Order placed successfully and is being processed',
          hubnetTransactionId: hubnetResult.transaction_id,
          status: 'processing'
        })
      } else {
        throw new Error(hubnetResult.message || 'Hubnet delivery failed')
      }
    } catch (error) {
      console.error('Hubnet transaction failed for order:', order.order_id, error)
      
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
        message: error instanceof Error ? error.message : 'Transaction initialization failed',
        status: 'failed'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Place order API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to process order'
    }, { status: 500 })
  }
}