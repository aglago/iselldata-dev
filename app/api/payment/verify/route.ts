import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paystackAPI } from '@/lib/paystack'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json({
        success: false,
        message: 'Payment reference is required'
      }, { status: 400 })
    }

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

    // Map Paystack status to our status
    const paymentStatus = paymentData.status.toLowerCase()
    let ourStatus = 'pending'
    
    if (paymentStatus === 'success') {
      ourStatus = 'confirmed'
    } else if (paymentStatus === 'failed' || paymentStatus === 'abandoned') {
      ourStatus = 'failed'
    }

    // If payment is confirmed, update our database
    if (ourStatus === 'confirmed') {
      const supabase = await createClient()
      
      // Update order status in database using Paystack reference
      const { data: updateResult, error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'confirmed',
          delivery_status: 'pending',
          paystack_reference: reference,
          updated_at: new Date().toISOString()
        })
        .or(`paystack_reference.eq.${reference},reference.eq.${reference},order_id.eq.${reference}`)
        .select()

      if (updateError) {
        console.error('Error updating order status:', updateError)
        // Don't fail the request, just log the error
      } else {
        console.log('Order status updated successfully for reference:', reference, 'Updated rows:', updateResult?.length || 0)
        if (updateResult && updateResult.length === 0) {
          console.warn('No orders were updated - order might not exist or already processed')
        } else if (updateResult && updateResult.length > 0) {
          // Trigger data delivery for confirmed payment
          try {
            const orderToDeliver = updateResult[0]
            console.log('Triggering data delivery for manually verified payment:', orderToDeliver.order_id)
            
            // Call place-order API to trigger data delivery
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.includes('://') 
              ? process.env.NEXT_PUBLIC_BASE_URL 
              : `https://${process.env.NEXT_PUBLIC_BASE_URL}`
            const deliveryResponse = await fetch(`${baseUrl}/api/place-order`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: orderToDeliver.order_id
              }),
            })
            
            const deliveryResult = await deliveryResponse.json()
            console.log('Data delivery trigger result:', deliveryResult)
          } catch (deliveryError) {
            console.error('Failed to trigger data delivery:', deliveryError)
            // Don't fail the verification, just log the error
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: ourStatus,
      paystackStatus: paymentStatus,
      amount: paymentData.amount / 100, // Convert from pesewas to cedis
      reference: paymentData.reference,
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