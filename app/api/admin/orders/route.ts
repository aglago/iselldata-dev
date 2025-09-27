import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Fetch all orders with customer information
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          name,
          phone,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch orders'
      }, { status: 500 })
    }

    // Format orders for the frontend
    const formattedOrders = orders.map(order => ({
      id: order.order_id,
      customer: {
        name: order.customers?.name || 'Unknown',
        phone: order.customers?.phone || order.phone,
        email: order.customers?.email || null
      },
      package: {
        size: order.package_size,
        network: order.network,
        price: Number(order.price),
        duration: '90 Days' // Default duration
      },
      status: order.delivery_status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      transactionId: order.hubnet_transaction_id,
      trackingId: order.tracking_id,
      reference: order.reference,
      needsProcessing: order.payment_status === 'confirmed' && (order.delivery_status === 'pending' || order.delivery_status === 'payment_confirmed') && !order.hubnet_transaction_id
    }))

    return NextResponse.json({
      success: true,
      data: formattedOrders
    })
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch orders'
    }, { status: 500 })
  }
}