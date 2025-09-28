import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"

export const dynamic = 'force-dynamic'

// Webhook endpoint for payment confirmations from payment providers
export async function POST(request: NextRequest) {
  try {
    const headersList = headers()
    const signature = headersList.get("x-webhook-signature")
    const provider = headersList.get("x-payment-provider") || "unknown"

    if (!verifyWebhookSignature(signature, provider)) {
      console.log("Invalid webhook signature from provider:", provider)
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const payload = await request.json()
    console.log("Payment webhook received from", provider, ":", payload)

    // Process payment confirmation based on provider
    const result = await processPaymentWebhook(payload, provider)

    if (result.success) {
      console.log("Payment confirmed, triggering data delivery for order:", result.orderId)

      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: result.orderId,
          status: "payment_confirmed",
          paymentReference: result.paymentReference,
        }),
      })
    }

    return NextResponse.json({ success: true, message: "Payment webhook processed" })
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

async function processPaymentWebhook(payload: any, provider: string) {
  try {
    let orderId: string
    let paymentReference: string
    let status: string

    // Parse webhook payload based on provider format
    switch (provider) {
      case "mtn_momo":
        orderId = payload.externalId || payload.reference
        paymentReference = payload.financialTransactionId
        status = payload.status
        break
      case "vodafone_cash":
        orderId = payload.clientReference
        paymentReference = payload.transactionId
        status = payload.responseCode === "0000" ? "SUCCESSFUL" : "FAILED"
        break
      case "paystack":
        orderId = payload.data.reference
        paymentReference = payload.data.id
        status = payload.data.status
        break
      default:
        orderId = payload.reference || payload.orderId
        paymentReference = payload.transactionId || payload.id
        status = payload.status
    }

    const isSuccessful = ["SUCCESSFUL", "SUCCESS", "COMPLETED", "successful"].includes(status)

    return {
      success: isSuccessful,
      orderId,
      paymentReference,
      status,
    }
  } catch (error) {
    console.error("Webhook payload processing error:", error)
    return { success: false }
  }
}
