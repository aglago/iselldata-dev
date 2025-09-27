"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, RefreshCw, Eye, CheckCircle, XCircle, Clock, MoreHorizontal, Wallet } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface Order {
  id: string
  customer: {
    name: string
    phone: string
    email?: string
  }
  package: {
    size: string
    network: string
    price: number
    duration: string
  }
  status: "pending_payment" | "payment_confirmed" | "processing" | "completed" | "failed" | "placed"
  paymentStatus: string
  paymentMethod: string
  createdAt: string
  updatedAt?: string
  transactionId?: string
  trackingId?: string
  reference?: string
  screenshot?: {
    name: string
    size: number
    type: string
  }
  needsProcessing?: boolean
}

export function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [networkFilter, setNetworkFilter] = useState("all")
  const [hubnetBalance, setHubnetBalance] = useState<{balance: number, currency: string} | null>(null)
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

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/admin/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        console.log("Fetched orders from API:", data.data)
        setOrders(data.data)
      } else {
        throw new Error(data.message || "Failed to fetch orders")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      console.error("Error fetching orders:", errorMessage)
      setError(errorMessage)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-primary" />
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case "placed":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "pending":
      case "payment_confirmed":
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
        return "bg-primary/10 text-primary"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "placed":
        return "bg-blue-100 text-blue-800"
      case "pending":
      case "payment_confirmed":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleRetryOrder = (orderId: string) => {
    console.log("Retrying order:", orderId)
    // Implement retry logic
  }

  const handleRefundOrder = (orderId: string) => {
    console.log("Refunding order:", orderId)
    // Implement refund logic
  }

  const handlePlaceOrder = async (orderId: string) => {
    try {
      toast.loading("Placing order...", { id: `order-${orderId}` })
      
      console.log("Placing order to Hubnet:", orderId)
      const response = await fetch("/api/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })

      const result = await response.json()
      
      if (response.ok) {
        // Update order status locally based on response
        const newStatus: Order['status'] = result.requiresManualProcessing ? "placed" : "processing"
        const updatedOrders = orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus, needsProcessing: false } : order,
        )
        setOrders(updatedOrders)
        
        if (result.requiresManualProcessing) {
          toast.success("Telecel order queued for manual processing", { id: `order-${orderId}` })
        } else {
          toast.success("Order placed successfully and is being processed", { id: `order-${orderId}` })
        }
        
        // Refresh orders from API to get the latest data
        setTimeout(() => {
          fetchOrders()
        }, 1000)
      } else {
        // Handle different error types with appropriate messages
        let errorMessage = result.message || "Failed to place order"
        
        if (result.balanceError) {
          errorMessage = `Insufficient Hubnet balance (${result.message.split('(')[1]?.split(')')[0] || 'low balance'})`
          toast.error(errorMessage, { 
            id: `order-${orderId}`,
            description: "Please top up your Hubnet account before placing orders"
          })
        } else {
          toast.error(errorMessage, { id: `order-${orderId}` })
        }
        
        // Update order status to failed for UI consistency  
        const updatedOrders = orders.map((order) =>
          order.id === orderId ? { ...order, status: "failed" as Order['status'], needsProcessing: true } : order,
        )
        setOrders(updatedOrders)
        
        // Refresh orders from API to get the latest data
        setTimeout(() => {
          fetchOrders()
        }, 1000)
      }
    } catch (error) {
      console.error("Error placing order:", error)
      toast.error("Network error while placing order", { id: `order-${orderId}` })
      
      // Keep order as retryable
      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, needsProcessing: true } : order,
      )
      setOrders(updatedOrders)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchHubnetBalance()

    // Refresh orders every 30 seconds
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.phone.includes(searchTerm)

    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesNetwork = networkFilter === "all" || order.package.network === networkFilter

    return matchesSearch && matchesStatus && matchesNetwork
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Orders Management</CardTitle>
              <CardDescription>View and manage all customer orders</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              {hubnetBalance ? (
                <div className="text-right">
                  <div className="font-medium">
                    {hubnetBalance.currency} {hubnetBalance.balance.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {hubnetBalance.balance < 10 ? (
                      <span className="text-red-600">Low balance ⚠️</span>
                    ) : (
                      <span className="text-green-600">Available</span>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchHubnetBalance}
                  disabled={balanceLoading}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${balanceLoading ? 'animate-spin' : ''}`} />
                  {balanceLoading ? 'Loading...' : 'Load Balance'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Orders</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by Order ID, customer name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending_payment">Pending Payment</SelectItem>
                    <SelectItem value="payment_confirmed">Payment Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Network</Label>
                <Select value={networkFilter} onValueChange={setNetworkFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Networks</SelectItem>
                    <SelectItem value="mtn">MTN</SelectItem>
                    <SelectItem value="airteltigo">AirtelTigo</SelectItem>
                    <SelectItem value="telecel">Telecel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchOrders}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading orders...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 mb-4">Error loading orders: {error}</p>
              <Button onClick={fetchOrders} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Order ID</th>
                      <th className="text-left p-4 font-medium">Customer</th>
                      <th className="text-left p-4 font-medium">Package</th>
                      <th className="text-left p-4 font-medium">Amount</th>
                      <th className="text-left p-4 font-medium">Payment Status</th>
                      <th className="text-left p-4 font-medium">Order Status</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/30">
                        <td className="p-4">
                          <div className="font-mono text-sm">{order.id}</div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{order.customer.name || "N/A"}</div>
                            <div className="text-sm text-muted-foreground">{order.customer.phone}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">
                              {order.package.size} {order.package.network.toUpperCase()}
                            </div>
                            <div className="text-sm text-muted-foreground">{order.package.duration}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">GH₵{order.package.price}</div>
                          <div className="text-sm text-muted-foreground">{order.paymentMethod.replace("_", " ")}</div>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(order.paymentStatus)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.paymentStatus)}
                              {order.paymentStatus.replace("_", " ")}
                            </div>
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status.replace("_", " ")}
                            </div>
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {order.screenshot && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // View screenshot logic
                                  console.log("Viewing screenshot for order:", order.id)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Screenshot
                              </Button>
                            )}
                            {/* Place Order Button with status-aware logic */}
                            {order.paymentStatus === "confirmed" ? (
                              <Button
                                size="sm"
                                onClick={() => handlePlaceOrder(order.id)}
                                disabled={!order.needsProcessing && order.status !== "failed"}
                                variant={order.status === "failed" ? "destructive" : "default"}
                                className={(order.needsProcessing || order.status === "failed") ? "" : "opacity-50 cursor-not-allowed"}
                              >
                                {order.status === "failed" ? "Try Again" : 
                                 order.needsProcessing ? "Place Order" : "Already Processed"}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="opacity-50 cursor-not-allowed"
                              >
                                Awaiting Payment
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && filteredOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No orders found matching your criteria.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
