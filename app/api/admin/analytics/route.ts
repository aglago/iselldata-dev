import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get revenue data for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: revenueData, error: revenueError } = await supabase
      .from('orders')
      .select('price, created_at, network, payment_status')
      .eq('payment_status', 'confirmed')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true })

    if (revenueError) {
      console.error('Error fetching revenue data:', revenueError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch analytics data'
      }, { status: 500 })
    }

    // Group revenue by day
    const dailyRevenue = {}
    const networkBreakdown = { mtn: 0, airteltigo: 0, telecel: 0 }
    let totalRevenue = 0

    revenueData.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      const amount = Number(order.price)
      
      // Daily revenue
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = 0
      }
      dailyRevenue[date] += amount
      
      // Network breakdown
      if (networkBreakdown.hasOwnProperty(order.network)) {
        networkBreakdown[order.network] += amount
      }
      
      totalRevenue += amount
    })

    // Generate chart data for last 30 days
    const chartData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
      
      chartData.push({
        name: dayName,
        date: dateStr,
        revenue: dailyRevenue[dateStr] || 0
      })
    }

    // Calculate network percentages
    const networkPercentages = Object.keys(networkBreakdown).map(network => ({
      network: network.toUpperCase(),
      amount: networkBreakdown[network],
      percentage: totalRevenue > 0 ? Math.round((networkBreakdown[network] / totalRevenue) * 100) : 0
    }))

    // Get top customers
    const { data: topCustomers, error: customersError } = await supabase
      .from('customers')
      .select(`
        name,
        phone,
        orders!inner (
          price,
          payment_status
        )
      `)
      .eq('orders.payment_status', 'confirmed')

    let customerSpending = {}
    if (!customersError && topCustomers) {
      topCustomers.forEach(customer => {
        const customerKey = customer.name || customer.phone
        if (!customerSpending[customerKey]) {
          customerSpending[customerKey] = 0
        }
        customer.orders.forEach(order => {
          customerSpending[customerKey] += Number(order.price)
        })
      })
    }

    const topCustomersList = Object.entries(customerSpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }))

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        chartData,
        networkBreakdown: networkPercentages,
        topCustomers: topCustomersList,
        period: '30 days'
      }
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch analytics data'
    }, { status: 500 })
  }
}