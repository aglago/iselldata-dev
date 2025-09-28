import { type NextRequest, NextResponse } from "next/server"
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingId = searchParams.get("trackingId")
    const orderId = searchParams.get("id")

    if (!trackingId && !orderId) {
      return NextResponse.json({ 
        success: false, 
        message: "Tracking ID or Order ID is required" 
      }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Search by tracking_id or order_id
    let query = supabase
      .from('orders')
      .select(`
        *,
        customers (
          name,
          phone,
          email
        )
      `)
    
    if (trackingId) {
      query = query.eq('tracking_id', trackingId)
    } else if (orderId) {
      query = query.eq('order_id', orderId)
    }

    const { data: order, error } = await query.single()

    if (error || !order) {
      return NextResponse.json({
        success: false,
        message: "Order not found"
      }, { status: 404 })
    }

    // Map delivery status to timeline status
    const getTimelineStatus = (currentStep: string, orderStatus: { payment: string, delivery: string }) => {
      if (currentStep === "Order Placed") return "completed"
      if (currentStep === "Payment Confirmed") {
        return orderStatus.payment === "confirmed" ? "completed" : 
               orderStatus.payment === "pending" ? "current" : "pending"
      }
      if (currentStep === "Processing Data Bundle") {
        return orderStatus.delivery === "delivered" ? "completed" :
               orderStatus.delivery === "processing" && orderStatus.payment === "confirmed" ? "current" :
               orderStatus.delivery === "failed" ? "failed" : "pending"
      }
      if (currentStep === "Data Bundle Delivered") {
        return orderStatus.delivery === "delivered" ? "completed" :
               orderStatus.delivery === "failed" ? "failed" : "pending"
      }
      return "pending"
    }

    const orderStatus = {
      payment: order.payment_status,
      delivery: order.delivery_status
    }

    // Build timeline
    const timeline = [
      {
        step: "Order Placed",
        status: getTimelineStatus("Order Placed", orderStatus),
        timestamp: order.created_at
      },
      {
        step: "Payment Confirmed", 
        status: getTimelineStatus("Payment Confirmed", orderStatus),
        timestamp: order.payment_status === "confirmed" ? order.updated_at : undefined
      },
      {
        step: "Processing Data Bundle",
        status: getTimelineStatus("Processing Data Bundle", orderStatus),
        timestamp: order.delivery_status === "processing" ? order.updated_at : undefined
      },
      {
        step: "Data Bundle Delivered",
        status: getTimelineStatus("Data Bundle Delivered", orderStatus),
        timestamp: order.delivery_status === "delivered" ? order.updated_at : undefined
      }
    ]

    // Determine overall status
    let overallStatus = "pending_payment"
    if (order.payment_status === "confirmed" && order.delivery_status === "delivered") {
      overallStatus = "completed"
    } else if (order.payment_status === "confirmed" && order.delivery_status === "processing") {
      overallStatus = "processing"
    } else if (order.payment_status === "confirmed") {
      overallStatus = "payment_confirmed"
    } else if (order.delivery_status === "failed") {
      overallStatus = "failed"
    }

    const formattedOrder = {
      orderId: order.order_id,
      trackingId: order.tracking_id,
      status: overallStatus,
      package: {
        size: order.package_size,
        network: order.network,
        price: order.price,
        duration: "90 days"
      },
      customer: {
        phoneNumber: order.phone,
        customerName: order.customers?.name || "N/A"
      },
      createdAt: order.created_at,
      completedAt: order.delivery_status === "delivered" ? order.updated_at : undefined,
      timeline
    }

    return NextResponse.json({
      success: true,
      order: formattedOrder
    })

  } catch (error) {
    console.error("Order tracking error:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Failed to track order" 
    }, { status: 500 })
  }
}
