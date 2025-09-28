import { NextResponse } from 'next/server'
import { hubnetAPI } from '@/lib/hubnet-api'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('Fetching Hubnet balance for admin dashboard')
    
    const balanceResult = await hubnetAPI.checkBalance()
    
    if (!balanceResult.status) {
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch Hubnet balance',
        error: 'Balance check failed'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        balance: balanceResult.balance,
        currency: balanceResult.currency,
        todaysSales: balanceResult.todaysSales,
        totalSales: balanceResult.totalSales,
        lastTopUp: balanceResult.lastTopUp,
        lastChecked: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Hubnet balance API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch balance',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST endpoint to force refresh balance (useful after manual top-ups)
export async function POST() {
  try {
    console.log('Force refreshing Hubnet balance')
    
    const balanceResult = await hubnetAPI.checkBalance()
    
    if (!balanceResult.status) {
      return NextResponse.json({
        success: false,
        message: 'Failed to refresh Hubnet balance',
        error: 'Balance check failed'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Balance refreshed successfully',
      data: {
        balance: balanceResult.balance,
        currency: balanceResult.currency,
        todaysSales: balanceResult.todaysSales,
        totalSales: balanceResult.totalSales,
        lastTopUp: balanceResult.lastTopUp,
        lastChecked: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Hubnet balance refresh error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to refresh balance',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}