import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get dashboard statistics
    const [ordersResult, customersResult, revenueResult] = await Promise.all([
      // Get order statistics
      supabase
        .from('orders')
        .select('payment_status, delivery_status, price, created_at'),
      
      // Get customer count
      supabase
        .from('customers')
        .select('id'),
      
      // Get revenue data (last 30 days)
      supabase
        .from('orders')
        .select('price, created_at, payment_status')
        .eq('payment_status', 'confirmed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ])

    const orders = ordersResult.data || []
    const customers = customersResult.data || []
    const revenueOrders = revenueResult.data || []

    // Calculate statistics
    const totalOrders = orders.length
    const totalCustomers = customers.length
    const totalRevenue = revenueOrders.reduce((sum, order) => sum + Number(order.price), 0)
    
    const completedOrders = orders.filter(o => o.delivery_status === 'delivered').length
    const pendingOrders = orders.filter(o => o.payment_status === 'pending').length
    const failedOrders = orders.filter(o => o.delivery_status === 'failed').length
    
    const successRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0

    // Calculate revenue growth (compare with previous 30 days)
    const previousPeriodStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const previousPeriodEnd = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: previousRevenueOrders } = await supabase
      .from('orders')
      .select('price')
      .eq('payment_status', 'confirmed')
      .gte('created_at', previousPeriodStart)
      .lt('created_at', previousPeriodEnd)

    const previousRevenue = (previousRevenueOrders || []).reduce((sum, order) => sum + Number(order.price), 0)
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    // Get recent orders (last 10)
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        order_id,
        price,
        package_size,
        network,
        payment_status,
        delivery_status,
        created_at,
        customers (
          name,
          phone
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    const formattedRecentOrders = (recentOrders || []).map(order => ({
      id: order.order_id,
      customer: order.customers?.name || order.customers?.phone || 'Unknown',
      package: `${order.package_size} ${order.network.toUpperCase()}`,
      amount: order.price,
      status: order.delivery_status,
      time: new Date(order.created_at).toLocaleString()
    }))

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalOrders,
          totalCustomers,
          successRate: Math.round(successRate * 10) / 10,
          pendingOrders,
          completedOrders,
          failedOrders,
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        },
        recentOrders: formattedRecentOrders
      }
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch dashboard data'
    }, { status: 500 })
  }
}