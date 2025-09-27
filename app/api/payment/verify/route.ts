import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json({
        success: false,
        message: 'Transaction ID is required'
      }, { status: 400 })
    }

    // Check payment status from OGateway
    const ogateWayResponse = await fetch(`https://api.ogateway.io/payments/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': process.env.OGATEWAY_API_KEY!,
        'Content-Type': 'application/json',
      },
    })

    if (!ogateWayResponse.ok) {
      console.error('OGateway API error:', ogateWayResponse.status, ogateWayResponse.statusText)
      return NextResponse.json({
        success: false,
        message: 'Failed to verify payment with OGateway'
      }, { status: 500 })
    }

    const paymentData = await ogateWayResponse.json()
    console.log('OGateway payment verification:', paymentData)

    // Map OGateway status to our status
    const paymentStatus = paymentData.status.toLowerCase()
    let ourStatus = 'pending'
    
    if (paymentStatus === 'success' || paymentStatus === 'successful' || paymentStatus === 'completed') {
      ourStatus = 'confirmed'
    } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled' || paymentStatus === 'declined') {
      ourStatus = 'failed'
    }

    // If payment is confirmed, update our database
    if (ourStatus === 'confirmed') {
      const supabase = await createClient()
      
      // Update order status in database - try both ogateway_payment_id and reference
      const { data: updateResult, error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'confirmed',
          delivery_status: 'pending',
          ogateway_payment_id: transactionId,
          updated_at: new Date().toISOString()
        })
        .or(`ogateway_payment_id.eq.${transactionId},reference.eq.${paymentData.reference_business},order_id.eq.${paymentData.reference_business}`)
        .select()

      if (updateError) {
        console.error('Error updating order status:', updateError)
        // Don't fail the request, just log the error
      } else {
        console.log('Order status updated successfully for transaction:', transactionId, 'Updated rows:', updateResult?.length || 0)
        if (updateResult && updateResult.length === 0) {
          console.warn('No orders were updated - order might not exist or already processed')
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: ourStatus,
      ogateWayStatus: paymentStatus,
      amount: paymentData.amount,
      reference: paymentData.reference_business,
      transactionId: paymentData.id
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to verify payment'
    }, { status: 500 })
  }
}