import { type NextRequest, NextResponse } from "next/server"
import { smsService } from "@/lib/hubnet-api"

// Webhook endpoint for Hubnet transaction status updates
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    console.log("[v0] Hubnet webhook received:", payload)

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
    console.error("[v0] Hubnet webhook processing error:", error)
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

    console.log("[v0] Processing Hubnet status update:", {
      orderId: reference,
      transactionId: transaction_id,
      status,
      code,
      reason,
    })

    // Determine if transaction was successful
    const isSuccessful = status === true && code === "0000"
    const isFailed = status === false || (code !== "0000" && code !== undefined)

    // In production, update order status in database
    // For now, just log the status change
    console.log(`[v0] Order ${reference} status: ${isSuccessful ? "DELIVERED" : isFailed ? "FAILED" : "PENDING"}`)

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
    console.error("[v0] Hubnet webhook payload processing error:", error)
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
      await smsService.sendDeliveryConfirmation(phone, orderId, networkDisplay, packageSize)
      console.log(`[v0] Delivery confirmation sent for order ${orderId}`)
    } else if (isFailed) {
      await sendFailureNotification(phone, orderId, reason || "Unknown error")
      console.log(`[v0] Failure notification sent for order ${orderId}`)
    }
    // If status is still pending, no SMS needed yet
  } catch (error) {
    console.error("[v0] Failed to send status notification:", error)
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

async function sendFailureNotification(phoneNumber: string, orderId: string, reason: string) {
  try {
    const message = `Sorry, we couldn't deliver your data bundle. Order: ${orderId}. Reason: ${reason}. Your payment will be refunded within 24 hours. Contact support: 050 958 1027 - GhanaData Pro`

    console.log(`[v0] Failure SMS to ${phoneNumber}: ${message}`)

    // In production, integrate with real SMS provider
    // For now, simulate SMS sending
    return new Promise((resolve) => setTimeout(resolve, 500))
  } catch (error) {
    console.error("[v0] Failed to send failure notification:", error)
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Hubnet webhook endpoint",
    status: "active",
    timestamp: new Date().toISOString(),
  })
}
