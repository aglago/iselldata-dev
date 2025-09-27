"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, XCircle } from "lucide-react"

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
  const [recentLogs, setRecentLogs] = useState<ApiLog[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchApiLogs = async () => {
    try {
      setError(null)
      const response = await fetch("/api/admin/api-logs?limit=20")
      const data = await response.json()
      
      if (data.success) {
        setRecentLogs(data.data || [])
      } else {
        throw new Error(data.message || 'Failed to fetch API logs')
      }
    } catch (error) {
      console.error("Failed to fetch API logs:", error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const refreshApiLogs = async () => {
    setIsRefreshing(true)
    await fetchApiLogs()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  useEffect(() => {
    fetchApiLogs()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading API logs...</span>
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
          <p className="text-red-600 mb-4">Error loading API logs: {error}</p>
          <Button onClick={refreshApiLogs} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* API Call Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Hubnet API Logs</CardTitle>
            <CardDescription>Individual API requests and responses</CardDescription>
          </div>
          <Button onClick={refreshApiLogs} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
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
              No API calls found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}