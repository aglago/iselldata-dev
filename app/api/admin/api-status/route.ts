import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get recent API calls to Hubnet (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: apiLogs, error } = await supabase
      .from('api_logs')
      .select('*')
      .like('endpoint', 'hubnet:%')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API logs:', error)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch API logs'
      }, { status: 500 })
    }

    // Calculate stats by network and endpoint
    const networkStats = {}
    const endpointStats = {}
    let totalCalls = 0
    let totalSuccessful = 0
    let totalFailed = 0
    let totalResponseTime = 0

    apiLogs?.forEach(log => {
      const network = (log.network || 'unknown').toUpperCase()
      const endpoint = log.endpoint.replace('hubnet:', '')
      
      totalCalls++
      if (log.success) {
        totalSuccessful++
      } else {
        totalFailed++
      }
      
      if (log.response_time_ms) {
        totalResponseTime += log.response_time_ms
      }

      // Network stats
      if (!networkStats[network]) {
        networkStats[network] = {
          network,
          totalCalls: 0,
          successful: 0,
          failed: 0,
          responseTimes: [],
          lastCall: null
        }
      }

      networkStats[network].totalCalls++
      if (log.success) {
        networkStats[network].successful++
      } else {
        networkStats[network].failed++
      }
      
      if (log.response_time_ms) {
        networkStats[network].responseTimes.push(log.response_time_ms)
      }
      
      if (!networkStats[network].lastCall || new Date(log.created_at) > new Date(networkStats[network].lastCall)) {
        networkStats[network].lastCall = log.created_at
      }

      // Endpoint stats
      if (!endpointStats[endpoint]) {
        endpointStats[endpoint] = {
          endpoint,
          totalCalls: 0,
          successful: 0,
          failed: 0,
          avgResponseTime: 0
        }
      }
      endpointStats[endpoint].totalCalls++
      if (log.success) {
        endpointStats[endpoint].successful++
      } else {
        endpointStats[endpoint].failed++
      }
    })

    // Format data for frontend
    const apiHealth = Object.values(networkStats).map((stats: any) => {
      const avgResponseTime = stats.responseTimes.length > 0 
        ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length / 1000) // Convert to seconds
        : 0
      
      const errorRate = stats.totalCalls > 0 
        ? Math.round((stats.failed / stats.totalCalls) * 100 * 10) / 10 
        : 0
      
      const successRate = stats.totalCalls > 0 
        ? Math.round((stats.successful / stats.totalCalls) * 100 * 10) / 10 
        : 0

      let status = 'healthy'
      if (errorRate > 5 || avgResponseTime > 30) {
        status = 'degraded'
      }
      if (errorRate > 20 || avgResponseTime > 60) {
        status = 'down'
      }
      if (stats.totalCalls === 0) {
        status = 'unknown'
      }

      return {
        network: stats.network,
        status,
        responseTime: avgResponseTime,
        lastChecked: stats.lastCall || new Date().toISOString(),
        errorRate,
        uptime: successRate,
        totalCalls: stats.totalCalls,
        successful: stats.successful,
        failed: stats.failed,
        processing: stats.processing
      }
    })

    // Ensure all networks are represented
    const allNetworks = ['MTN', 'AIRTELTIGO', 'TELECEL']
    const missingNetworks = allNetworks.filter(net => !apiHealth.find(api => api.network === net))
    
    missingNetworks.forEach(network => {
      apiHealth.push({
        network,
        status: 'unknown',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        errorRate: 0,
        uptime: 0,
        totalCalls: 0,
        successful: 0,
        failed: 0,
        processing: 0
      })
    })

    // Calculate overall system health
    const overallUptime = totalCalls > 0 ? Math.round((totalSuccessful / totalCalls) * 100 * 10) / 10 : 0
    const avgResponseTime = totalCalls > 0 ? Math.round(totalResponseTime / totalCalls) : 0
    const overallErrorRate = totalCalls > 0 ? Math.round((totalFailed / totalCalls) * 100 * 10) / 10 : 0

    return NextResponse.json({
      success: true,
      data: {
        apiHealth,
        systemHealth: {
          overallUptime,
          avgResponseTime,
          errorRate: overallErrorRate,
          totalCalls
        },
        recentLogs: apiLogs?.slice(0, 10) || []
      }
    })
  } catch (error) {
    console.error('API status error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch API status'
    }, { status: 500 })
  }
}