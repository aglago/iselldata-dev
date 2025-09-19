import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hubnetAPI } from "@/lib/hubnet-api"
import { smsService } from "@/lib/arkesel-sms"

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()
    console.log("Creating Supabase client...")
    const supabase = await createClient()
    console.log("Supabase client created successfully")

    const orderId = `GD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    const trackingId = `TRK${Math.random().toString(36).substr(2, 8).toUpperCase()}`

    let customerId: string
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", orderData.customer.phoneNumber)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id
      // Update customer info if provided
      await supabase
        .from("customers")
        .update({
          name: orderData.customer.name,
          email: orderData.customer.email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerId)
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          phone: orderData.customer.phoneNumber,
          name: orderData.customer.name,
          email: orderData.customer.email,
        })
        .select("id")
        .single()

      if (customerError) {
        console.error("Customer creation error:", customerError)
        return NextResponse.json({ success: false, message: "Failed to create customer record" }, { status: 500 })
      }
      customerId = newCustomer.id
    }

    const packageSizeGB = Number.parseFloat(orderData.package.size.replace("GB", ""))
    const volumeMB = Math.round(packageSizeGB * 1024)

    const paymentDetails = generatePaymentDetails(orderData.customer.paymentMethod, orderData.package.price)

    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_id: orderId,
        customer_id: customerId,
        phone: orderData.customer.phoneNumber,
        network: orderData.package.network,
        package_size: orderData.package.size,
        volume_mb: volumeMB,
        price: orderData.package.price,
        payment_method: orderData.customer.paymentMethod,
        payment_status: "pending",
        delivery_status: "pending",
        reference: orderId,
        tracking_id: trackingId,
      })
      .select()
      .single()

    if (orderError) {
      console.error("Order creation error:", orderError)
      return NextResponse.json({ success: false, message: "Failed to create order" }, { status: 500 })
    }

    console.log("New order created in database:", newOrder)

    await smsService.sendOrderConfirmation(
      orderData.customer.phoneNumber,
      trackingId,
      orderData.package.size,
      orderData.package.network,
    )

    return NextResponse.json({
      success: true,
      orderId,
      trackingId,
      paymentDetails,
      message: "Order placed successfully. Payment instructions and tracking ID sent via SMS.",
    })
  } catch (error) {
    console.error("Order processing error:", error)
    return NextResponse.json({ success: false, message: "Failed to process order" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { orderId, status, paymentReference } = await request.json()
    const supabase = await createClient()

    if (status === "payment_confirmed") {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)

      if (updateError) {
        console.error("Payment status update error:", updateError)
        return NextResponse.json({ success: false, message: "Failed to update payment status" }, { status: 500 })
      }

      const result = await processHubnetDataDelivery(orderId, paymentReference)

      return NextResponse.json({
        success: result.success,
        message: result.message,
        transactionId: result.transactionId,
        hubnetPaymentId: result.hubnetPaymentId,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated",
    })
  } catch (error) {
    console.error("Order update error:", error)
    return NextResponse.json({ success: false, message: "Failed to update order" }, { status: 500 })
  }
}

async function processHubnetDataDelivery(orderId: string, paymentReference: string) {
  try {
    const supabase = await createClient()

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        customers (
          name,
          phone,
          email
        )
      `)
      .eq("order_id", orderId)
      .single()

    if (orderError || !order) {
      console.error("Order not found:", orderError)
      return {
        success: false,
        message: "Order not found in database",
      }
    }

    console.log(`Processing Hubnet data delivery for order: ${orderId}`)

    const packageSizeGB = Number.parseFloat(order.package_size.replace("GB", ""))

    const hubnetResult = await hubnetAPI.purchaseFromPackage(
      order.network,
      order.phone,
      packageSizeGB,
      orderId,
      order.phone, // Use customer phone as referrer for SMS alerts
    )

    if (hubnetResult.status && hubnetResult.code === "0000") {
      await supabase
        .from("orders")
        .update({
          delivery_status: "delivered",
          hubnet_transaction_id: hubnetResult.transaction_id,
          hubnet_payment_id: hubnetResult.payment_id,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)

      await smsService.sendDeliveryConfirmation(order.phone, order.tracking_id, order.package_size, order.network)

      return {
        success: true,
        message: "Data bundle delivered successfully via network provider",
        transactionId: hubnetResult.transaction_id,
        hubnetPaymentId: hubnetResult.payment_id,
      }
    } else {
      const errorMessage = hubnetResult.data?.message || hubnetResult.reason || "Unknown error"
      console.error("Hubnet delivery failed:", hubnetResult)

      await supabase
        .from("orders")
        .update({
          delivery_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)

      await smsService.sendDeliveryFailure(order.phone, order.tracking_id, order.package_size, order.network)

      return {
        success: false,
        message: `Delivery failed: ${errorMessage}`,
        hubnetCode: hubnetResult.code,
      }
    }
  } catch (error) {
    console.error("Hubnet data delivery error:", error)
    return {
      success: false,
      message: "Failed to deliver data bundle - network error",
    }
  }
}

function mapNetworkToHubnet(network: string): string {
  const networkMap = {
    mtn: "mtn",
    airteltigo: "at",
    telecel: "big-time",
  }
  return networkMap[network as keyof typeof networkMap] || "mtn"
}

function generatePaymentDetails(paymentMethod: string, amount: number) {
  switch (paymentMethod) {
    case "mtn_momo":
      return {
        merchantNumber: "123456",
        shortCode: "*170#",
        instructions: "Dial *170# > Send Money > Enter merchant number",
      }
    case "vodafone_cash":
      return {
        merchantNumber: "654321",
        shortCode: "*110#",
        instructions: "Dial *110# > Send Money > Enter merchant number",
      }
    case "airteltigo_money":
      return {
        merchantNumber: "789012",
        shortCode: "*185#",
        instructions: "Dial *185# > Send Money > Enter merchant number",
      }
    case "bank_transfer":
      return {
        bankName: "GCB Bank Limited",
        accountNumber: "1234567890123456",
        accountName: "GhanaData Pro Limited",
        branch: "Accra Main Branch",
      }
    case "card":
      return {
        paymentUrl: `https://payment.ghanadatapro.com/pay?amount=${amount}&ref=${Date.now()}`,
        processor: "Paystack",
      }
    default:
      return {}
  }
}

export async function GET() {
  return NextResponse.json({ message: "Orders API endpoint - Hubnet Integration Active with Database" })
}
