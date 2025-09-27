"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, ShoppingCart, DollarSign, Clock, CheckCircle, XCircle, Wallet, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  successRate: number
  pendingOrders: number
  completedOrders: number
  failedOrders: number
  revenueGrowth: number
}

interface RecentOrder {
  id: string
  customer: string
  package: string
  amount: number
  status: string
  time: string
}

interface HubnetBalance {
  balance: number
  currency: string
  lastChecked: string
  todaysSales?: number
  totalSales?: number
  lastTopUp?: string
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    successRate: 0,
    pendingOrders: 0,
    completedOrders: 0,
    failedOrders: 0,
    revenueGrowth: 0,
  })

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [hubnetBalance, setHubnetBalance] = useState<HubnetBalance | null>(null)
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard')
        const data = await response.json()
        
        if (data.success) {
          setStats(data.data.stats)
          setRecentOrders(data.data.recentOrders)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    fetchHubnetBalance()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "pending":
      case "pending_payment":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
      case "completed":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "pending":
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className={stats.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                {stats.revenueGrowth >= 0 ? "+" : ""}{stats.revenueGrowth}%
              </span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingOrders} pending orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active customer base</p>
          </CardContent>
        </Card>
      </div>

      {/* Hubnet Balance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Hubnet Account Balance</CardTitle>
            <CardDescription className="text-xs">
              {hubnetBalance?.lastChecked && (
                `Last updated: ${new Date(hubnetBalance.lastChecked).toLocaleTimeString()}`
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHubnetBalance}
              disabled={balanceLoading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${balanceLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hubnetBalance ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {hubnetBalance.currency} {hubnetBalance.balance.toFixed(3)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hubnetBalance.balance < 10 ? (
                      <span className="text-red-600 font-medium">⚠️ Low balance - consider topping up</span>
                    ) : hubnetBalance.balance < 50 ? (
                      <span className="text-yellow-600 font-medium">⚠️ Balance getting low</span>
                    ) : (
                      <span className="text-green-600">✓ Sufficient balance</span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Additional Hubnet Sales Info */}
              {(hubnetBalance.todaysSales !== undefined || hubnetBalance.totalSales !== undefined) && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-muted">
                  {hubnetBalance.todaysSales !== undefined && (
                    <div>
                      <div className="text-sm font-medium">Today's Sales</div>
                      <div className="text-lg font-bold text-blue-600">
                        GHS {hubnetBalance.todaysSales.toFixed(2)}
                      </div>
                    </div>
                  )}
                  {hubnetBalance.totalSales !== undefined && (
                    <div>
                      <div className="text-sm font-medium">Total Sales</div>
                      <div className="text-lg font-bold text-green-600">
                        GHS {hubnetBalance.totalSales.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {hubnetBalance.lastTopUp && (
                <div className="text-xs text-muted-foreground">
                  Last top-up: {hubnetBalance.lastTopUp}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {balanceLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading balance...</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Unable to load balance</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status</CardTitle>
            <CardDescription>Current order distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Completed</span>
              </div>
              <span className="font-medium">{stats.completedOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Pending</span>
              </div>
              <span className="font-medium">{stats.pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Failed</span>
              </div>
              <span className="font-medium">{stats.failedOrders}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <CardDescription>Latest customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <div className="font-medium text-sm">{order.customer}</div>
                        <div className="text-xs text-muted-foreground">{order.id}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{order.package}</div>
                      <div className="text-xs text-muted-foreground">GH₵{order.amount}</div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>{order.status.replace("_", " ")}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">{order.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No recent orders found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}