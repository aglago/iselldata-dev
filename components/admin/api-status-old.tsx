"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Activity } from "lucide-react"

interface ApiHealth {
  network: string
  status: "healthy" | "degraded" | "down" | "unknown"
  responseTime: number
  lastChecked: string
  errorRate: number
  uptime: number
  totalCalls: number
  successful: number
  failed: number
  processing: number
}

interface SystemHealth {
  overallUptime: number
  avgResponseTime: number
  errorRate: number
  totalCalls: number
}

interface ApiLog {
  id: string
  endpoint: string
  method: string
  success: boolean
  response_time_ms: number
  error_message?: string
  order_id?: string
  network?: string
  created_at: string
}

export function ApiStatus() {
  const [apiHealth, setApiHealth] = useState<ApiHealth[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overallUptime: 0,
    avgResponseTime: 0,
    errorRate: 0,
    totalCalls: 0
  })
  const [recentLogs, setRecentLogs] = useState<ApiLog[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchApiStatus = async () => {
    try {
      setError(null)
      const response = await fetch("/api/admin/api-status")
      const data = await response.json()
      
      if (data.success) {
        setApiHealth(data.data.apiHealth)
        setSystemHealth(data.data.systemHealth)
        setRecentLogs(data.data.recentLogs || [])
      } else {
        throw new Error(data.message || 'Failed to fetch API status')
      }
    } catch (error) {
      console.error("Failed to fetch API status:", error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const refreshApiStatus = async () => {
    setIsRefreshing(true)
    await fetchApiStatus()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  useEffect(() => {
    fetchApiStatus()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "down":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "unknown":
        return <Activity className="h-5 w-5 text-gray-500" />
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
      case "unknown":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 10) return "text-green-600"
    if (responseTime < 30) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading API status...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-4">Error loading API status: {error}</p>
          <Button onClick={refreshApiStatus} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
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
                    <span className="text-sm text-muted-foreground">Avg Response</span>
                    <span className={`font-medium ${getResponseTimeColor(api.responseTime)}`}>
                      {api.responseTime}s
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Error Rate</span>
                    <span className="font-medium">{api.errorRate}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="font-medium text-green-600">{api.uptime}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">24h Calls</span>
                    <span className="font-medium">{api.totalCalls}</span>
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
              <div className="text-2xl font-bold text-green-600">{systemHealth.overallUptime}%</div>
              <div className="text-sm text-muted-foreground">Overall Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{systemHealth.avgResponseTime}s</div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{systemHealth.errorRate}%</div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{systemHealth.totalCalls}</div>
              <div className="text-sm text-muted-foreground">API Calls (24h)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent API Calls */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Calls</CardTitle>
          <CardDescription>Latest Hubnet API requests and responses</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length > 0 ? (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {log.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{log.endpoint.replace('hubnet:', '')}</span>
                      {log.network && (
                        <Badge variant="outline">{log.network.toUpperCase()}</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{log.response_time_ms}ms</span>
                      <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  {log.order_id && (
                    <div className="text-sm text-muted-foreground mb-1">
                      Order: {log.order_id}
                    </div>
                  )}
                  
                  {!log.success && log.error_message && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      Error: {log.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No recent API calls found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
