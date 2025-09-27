"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Users, RefreshCw, XCircle, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AnalyticsData {
  totalRevenue: number
  chartData: {
    name: string
    date: string
    revenue: number
  }[]
  networkBreakdown: {
    network: string
    amount: number
    percentage: number
  }[]
  topCustomers: {
    name: string
    amount: number
  }[]
  period: string
}

interface HubnetBalance {
  balance: number
  currency: string
  lastChecked: string
  todaysSales?: number
  totalSales?: number
  lastTopUp?: string
}

export function RevenueAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [hubnetBalance, setHubnetBalance] = useState<HubnetBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  const fetchHubnetBalance = async () => {
    try {
      setBalanceLoading(true)
      const response = await fetch('/api/admin/hubnet-balance')
      const data = await response.json()
      
      if (data.success) {
        setHubnetBalance(data.data)
      } else {
        console.error('Failed to fetch Hubnet balance:', data.message)
      }
    } catch (error) {
      console.error('Error fetching Hubnet balance:', error)
    } finally {
      setBalanceLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/analytics')
      const data = await response.json()
      
      if (data.success) {
        setAnalyticsData(data.data)
      } else {
        throw new Error(data.message || 'Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    fetchHubnetBalance()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-4">Error loading analytics: {error}</p>
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    )
  }

  const todaysRevenue = analyticsData.chartData[analyticsData.chartData.length - 1]?.revenue || 0
  const yesterdaysRevenue = analyticsData.chartData[analyticsData.chartData.length - 2]?.revenue || 0
  const weeklyRevenue = analyticsData.chartData.slice(-7).reduce((sum, day) => sum + day.revenue, 0)
  const dailyGrowth = yesterdaysRevenue > 0 ? ((todaysRevenue - yesterdaysRevenue) / yesterdaysRevenue) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Day Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{todaysRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className={dailyGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                {dailyGrowth >= 0 ? "+" : ""}{dailyGrowth.toFixed(1)}%
              </span>
              {" "} from previous day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{weeklyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Last 7 days total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{analyticsData.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Last {analyticsData.period}</p>
          </CardContent>
        </Card>
      </div>

      {/* Network Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Network</CardTitle>
          <CardDescription>Revenue distribution across telecom networks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.networkBreakdown.length > 0 ? (
              analyticsData.networkBreakdown.map((network) => (
                <div key={network.network} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="font-medium">{network.network}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">GH₵{network.amount.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">{network.percentage}%</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No network data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Revenue Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over the past {analyticsData.period}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analyticsData.chartData.length > 0 ? (
              analyticsData.chartData.map((day) => {
                const maxRevenue = Math.max(...analyticsData.chartData.map(d => d.revenue))
                const barWidth = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
                
                return (
                  <div key={day.date} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg">
                    <div className="text-sm font-medium">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="font-medium">GH₵{day.revenue.toFixed(2)}</div>
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${barWidth}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No revenue data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
          <CardDescription>Highest spending customers in the last {analyticsData.period}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.topCustomers.length > 0 ? (
              analyticsData.topCustomers.map((customer, index) => (
                <div key={customer.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </div>
                    <div className="font-medium">{customer.name}</div>
                  </div>
                  <div className="font-bold">GH₵{customer.amount.toFixed(2)}</div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No customer data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hubnet Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hubnet Account Analytics</CardTitle>
              <CardDescription>Balance and sales performance from Hubnet API</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHubnetBalance}
              disabled={balanceLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${balanceLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hubnetBalance ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Current Balance */}
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Wallet className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-900">
                  {hubnetBalance.currency} {hubnetBalance.balance.toFixed(3)}
                </div>
                <div className="text-sm text-blue-600">Current Balance</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {hubnetBalance.balance < 10 ? (
                    <span className="text-red-600 font-medium">⚠️ Low balance</span>
                  ) : (
                    <span className="text-green-600">✓ Sufficient</span>
                  )}
                </div>
              </div>

              {/* Today's Sales */}
              {hubnetBalance.todaysSales !== undefined && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-900">
                    GH₵ {hubnetBalance.todaysSales.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-600">Today's Sales</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Hubnet transactions today
                  </div>
                </div>
              )}

              {/* Total Sales */}
              {hubnetBalance.totalSales !== undefined && (
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-900">
                    GH₵ {hubnetBalance.totalSales.toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-600">Total Sales</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Lifetime Hubnet sales
                  </div>
                </div>
              )}

              {/* Last Top-up */}
              {hubnetBalance.lastTopUp && (
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-lg font-bold text-orange-900">
                    {hubnetBalance.lastTopUp.split(',')[0]}
                  </div>
                  <div className="text-sm text-orange-600">Last Top-up</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {hubnetBalance.lastTopUp.split(',').slice(1).join(',').trim()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              {balanceLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="text-muted-foreground">Loading Hubnet data...</span>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Unable to load Hubnet analytics</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchHubnetBalance}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
