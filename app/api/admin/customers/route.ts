import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Fetch customers with their order statistics
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders (
          id,
          price,
          payment_status,
          delivery_status,
          created_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customers:', error)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch customers'
      }, { status: 500 })
    }

    // Format customers with statistics
    const formattedCustomers = customers.map(customer => {
      const orders = customer.orders || []
      const totalOrders = orders.length
      const totalSpent = orders
        .filter(order => order.payment_status === 'confirmed')
        .reduce((sum, order) => sum + Number(order.price), 0)
      
      const lastOrder = orders.length > 0 
        ? orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null

      return {
        id: customer.id,
        name: customer.name || 'Unknown',
        phone: customer.phone,
        email: customer.email,
        totalOrders,
        totalSpent: Math.round(totalSpent * 100) / 100,
        lastOrder: lastOrder ? new Date(lastOrder.created_at).toISOString() : null,
        status: totalOrders > 0 ? 'active' : 'inactive',
        joinedAt: customer.created_at
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedCustomers
    })
  } catch (error) {
    console.error('Customers API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch customers'
    }, { status: 500 })
  }
}