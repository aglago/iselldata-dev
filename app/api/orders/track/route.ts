import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("id")

    if (!orderId) {
      return NextResponse.json({ success: false, message: "Order ID required" }, { status: 400 })
    }

    // In a real application, fetch from database
    // For now, simulate order status based on order ID
    const mockOrder = {
      orderId,
      status: "processing",
      package: {
        size: "2GB",
        network: "mtn",
        price: 8,
        duration: "3 Days",
      },
      customer: {
        phoneNumber: "0XX XXX XXXX",
        customerName: "John Doe",
      },
      createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      timeline: [
        {
          step: "Order Placed",
          status: "completed" as const,
          timestamp: new Date(Date.now() - 300000).toISOString(),
        },
        {
          step: "Payment Confirmed",
          status: "completed" as const,
          timestamp: new Date(Date.now() - 240000).toISOString(),
        },
        {
          step: "Processing Data Bundle",
          status: "current" as const,
        },
        {
          step: "Data Bundle Delivered",
          status: "pending" as const,
        },
      ],
    }

    return NextResponse.json({
      success: true,
      order: mockOrder,
    })
  } catch (error) {
    console.error("Order tracking error:", error)
    return NextResponse.json({ success: false, message: "Failed to track order" }, { status: 500 })
  }
}
