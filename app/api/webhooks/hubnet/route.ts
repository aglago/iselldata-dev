import { type NextRequest, NextResponse } from "next/server"
import { smsService } from "@/lib/arkesel-sms"
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
      // Send appropriate SMS notification based on status
      await handleStatusNotification(result)
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
    // Extract Hubnet webhook data
    const {
      transaction_id,
      payment_id,
      reference, // This is our order ID
      status,
      reason,
      code,
      phone,
      volume,
      network,
      data,
    } = payload

    console.log("Processing Hubnet status update:", {
      orderId: reference,
      transactionId: transaction_id,
      status,
      code,
      reason,
    })

    // Determine if transaction was successful
    const isSuccessful = status === true && code === "0000"
    const isFailed = status === false || (code !== "0000" && code !== undefined)

    // Update order status in database
    const supabase = await createClient()
    
    let deliveryStatus = 'processing'
    if (isSuccessful) {
      deliveryStatus = 'delivered'
    } else if (isFailed) {
      deliveryStatus = 'failed'
    }
    
    console.log(`Updating order ${reference} status to: ${deliveryStatus.toUpperCase()}`)
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        delivery_status: deliveryStatus,
        hubnet_transaction_id: transaction_id,
        hubnet_payment_id: payment_id,
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
      transactionId: transaction_id,
      paymentId: payment_id,
      phone,
      volume,
      network,
      isDelivered: isSuccessful,
      isFailed,
      reason: reason || data?.message,
      code,
    }
  } catch (error) {
    console.error("Hubnet webhook payload processing error:", error)
    return { success: false }
  }
}

async function handleStatusNotification(result: any) {
  try {
    const { orderId, phone, volume, network, isDelivered, isFailed, reason } = result

    // Convert volume from MB to GB for user-friendly message
    const volumeGB = Math.round((Number.parseInt(volume) / 1024) * 10) / 10
    const packageSize = `${volumeGB}GB`

    // Map Hubnet network codes back to display names
    const networkDisplay = mapHubnetToDisplay(network)

    if (isDelivered) {
      await smsService.sendDeliveryConfirmation(phone, orderId, packageSize, networkDisplay)
      console.log(`Delivery confirmation sent for order ${orderId}`)
    } else if (isFailed) {
      await smsService.sendDeliveryFailure(phone, orderId, packageSize, networkDisplay)
      console.log(`Failure notification sent for order ${orderId}`)
    }
    // If status is still pending, no SMS needed yet
  } catch (error) {
    console.error("Failed to send status notification:", error)
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
