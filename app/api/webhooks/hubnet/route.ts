import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Webhook endpoint for Hubnet transaction status updates
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    console.log("Hubnet webhook received:", payload)

    // Process Hubnet status update
    const result = await processHubnetWebhook(payload)

    if (result.success) {
      // Log status update for admin notifications (can be used for toasts)
      console.log('Order status update:', {
        orderId: result.orderId,
        status: result.deliveryStatus,
        phone: result.phone,
        volume: result.volume,
        network: result.network
      })
    }

    return NextResponse.json({
      success: true,
      message: "Hubnet webhook processed successfully",
    })
  } catch (error) {
    console.error("Hubnet webhook processing error:", error)
    return NextResponse.json(
      {
        error: "Hubnet webhook processing failed",
      },
      { status: 500 },
    )
  }
}

async function processHubnetWebhook(payload: any) {
  try {
    // Extract Hubnet webhook data (new format)
    const {
      event,
      status,
      message,
      code,
      data
    } = payload

    const reference = data?.reference
    const phone = data?.msisdn
    const volume = data?.volume
    const network = data?.network
    const hubnetStatus = data?.status

    console.log("Processing Hubnet status update:", {
      event,
      orderId: reference,
      status,
      code,
      hubnetStatus,
      message,
    })

    if (!reference) {
      console.error('No reference found in Hubnet webhook')
      return { success: false, message: 'No reference found' }
    }

    // Map Hubnet webhook events to our delivery status
    let deliveryStatus = 'processing'
    
    if (event === 'transfer.delivered' && status === true) {
      deliveryStatus = 'delivered'
    } else if (event === 'transfer.processing') {
      deliveryStatus = 'processing'  
    } else if (event === 'transfer.failed' || status === false) {
      deliveryStatus = 'failed'
    }

    // Update order status in database
    const supabase = await createClient()
    
    console.log(`Updating order ${reference} status to: ${deliveryStatus.toUpperCase()}`)
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        delivery_status: deliveryStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', reference)
    
    if (updateError) {
      console.error('Failed to update order status:', updateError)
    } else {
      console.log(`Order ${reference} status updated successfully to: ${deliveryStatus}`)
    }

    return {
      success: true,
      orderId: reference,
      phone,
      volume,
      network,
      deliveryStatus,
      isDelivered: deliveryStatus === 'delivered',
      isFailed: deliveryStatus === 'failed',
      event,
      message,
    }
  } catch (error) {
    console.error("Hubnet webhook payload processing error:", error)
    return { success: false }
  }
}


function mapHubnetToDisplay(hubnetNetwork: string): string {
  const networkMap = {
    mtn: "MTN",
    at: "AirtelTigo",
    "big-time": "Telecel",
  }
  return networkMap[hubnetNetwork as keyof typeof networkMap] || hubnetNetwork.toUpperCase()
}


export async function GET() {
  return NextResponse.json({
    message: "Hubnet webhook endpoint",
    status: "active",
    timestamp: new Date().toISOString(),
  })
}
