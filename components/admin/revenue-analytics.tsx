"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, DollarSign, Users } from "lucide-react"

export function RevenueAnalytics() {
  const revenueData = {
    daily: [
      { date: "2024-01-10", revenue: 450, orders: 45 },
      { date: "2024-01-11", revenue: 520, orders: 52 },
      { date: "2024-01-12", revenue: 380, orders: 38 },
      { date: "2024-01-13", revenue: 680, orders: 68 },
      { date: "2024-01-14", revenue: 590, orders: 59 },
      { date: "2024-01-15", revenue: 720, orders: 72 },
    ],
    networkBreakdown: [
      { network: "MTN", revenue: 8450, percentage: 45.2, orders: 845 },
      { network: "AirtelTigo", revenue: 6230, percentage: 33.4, orders: 623 },
      { network: "Telecel", revenue: 3990, percentage: 21.4, orders: 399 },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵720</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5%
              </span>
              from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵3,340</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.2%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₢12,450</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15.3%</span> from last month
            </p>
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
            {revenueData.networkBreakdown.map((network) => (
              <div key={network.network} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="font-medium">{network.network}</div>
                  <div className="text-sm text-muted-foreground">{network.orders} orders</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">GH₵{network.revenue.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{network.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Revenue Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over the past week</CardDescription>
          </div>
          <Select defaultValue="7days">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {revenueData.daily.map((day, index) => (
              <div key={day.date} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg">
                <div className="text-sm font-medium">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-muted-foreground">{day.orders} orders</div>
                  <div className="font-medium">GH₵{day.revenue}</div>
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${(day.revenue / 800) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
