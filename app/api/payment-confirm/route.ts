import { type NextRequest, NextResponse } from "next/server"


export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const orderId = formData.get("orderId") as string
    const paymentMethod = formData.get("paymentMethod") as string
    const amount = formData.get("amount") as string
    const packageDetails = JSON.parse(formData.get("packageDetails") as string)
    const customerDetails = JSON.parse(formData.get("customerDetails") as string)
    const screenshot = formData.get("screenshot") as File

    console.log("Payment confirmation received:", {
      orderId,
      paymentMethod,
      amount,
      hasScreenshot: !!screenshot,
    })

    // Store order in localStorage for now (in real app, save to database)
    const orderData = {
      orderId,
      paymentMethod,
      amount: Number.parseFloat(amount),
      packageDetails,
      customerDetails,
      screenshot: screenshot
        ? {
            name: screenshot.name,
            size: screenshot.size,
            type: screenshot.type,
          }
        : null,
      status: "payment_confirmed",
      createdAt: new Date().toISOString(),
      needsProcessing: true,
    }

    // In a real app, you would:
    // 1. Save order to database
    // 2. Send SMS to admin (0249905548)
    // 3. Store screenshot file

    console.log("Order created for admin review:", orderData)

    const response = {
      success: true,
      message: "Payment confirmation submitted successfully",
      orderId,
      status: "awaiting_admin_review",
      estimatedDelivery: "15-30 minutes after admin confirmation",
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Payment confirmation error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Payment confirmation failed",
      },
      { status: 500 },
    )
  }
}
