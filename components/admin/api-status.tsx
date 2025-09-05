"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Activity } from "lucide-react"

interface ApiHealth {
  network: string
  status: "healthy" | "degraded" | "down"
  responseTime: number
  lastChecked: string
  errorRate: number
  uptime: number
}

export function ApiStatus() {
  const [apiHealth, setApiHealth] = useState<ApiHealth[]>([
    {
      network: "MTN",
      status: "healthy",
      responseTime: 245,
      lastChecked: new Date().toISOString(),
      errorRate: 0.2,
      uptime: 99.8,
    },
    {
      network: "AirtelTigo",
      status: "degraded",
      responseTime: 1200,
      lastChecked: new Date().toISOString(),
      errorRate: 2.1,
      uptime: 97.5,
    },
    {
      network: "Telecel",
      status: "healthy",
      responseTime: 180,
      lastChecked: new Date().toISOString(),
      errorRate: 0.1,
      uptime: 99.9,
    },
  ])

  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshApiStatus = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch("/api/health")
      if (response.ok) {
        const data = await response.json()
        // Update with real data
        console.log("API Health:", data)
      }
    } catch (error) {
      console.error("Failed to refresh API status:", error)
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "down":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800"
      case "degraded":
        return "bg-yellow-100 text-yellow-800"
      case "down":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 500) return "text-green-600"
    if (responseTime < 1000) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>API Status Monitor</CardTitle>
            <CardDescription>Real-time status of telecom network APIs</CardDescription>
          </div>
          <Button onClick={refreshApiStatus} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {apiHealth.map((api) => (
              <Card key={api.network} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{api.network}</CardTitle>
                    {getStatusIcon(api.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className={getStatusColor(api.status)}>{api.status.toUpperCase()}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Response Time</span>
                    <span className={`font-medium ${getResponseTimeColor(api.responseTime)}`}>
                      {api.responseTime}ms
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Error Rate</span>
                    <span className="font-medium">{api.errorRate}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="font-medium text-green-600">{api.uptime}%</span>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Last checked: {new Date(api.lastChecked).toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Overview</CardTitle>
          <CardDescription>Overall system performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">99.2%</div>
              <div className="text-sm text-muted-foreground">Overall Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">542ms</div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">0.8%</div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">1,247</div>
              <div className="text-sm text-muted-foreground">API Calls Today</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
