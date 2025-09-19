"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, RefreshCw, Eye, CheckCircle, XCircle, Clock, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
  status: "pending_payment" | "payment_confirmed" | "processing" | "completed" | "failed"
  paymentMethod: string
  createdAt: string
  completedAt?: string
  transactionId?: string
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
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [networkFilter, setNetworkFilter] = useState("all")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "processing":
      case "payment_confirmed":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
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
      case "completed":
        return "bg-green-100 text-green-800"
      case "processing":
      case "payment_confirmed":
        return "bg-blue-100 text-blue-800"
      case "pending_payment":
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
      console.log("Placing order to Hubnet:", orderId)
      const response = await fetch("/api/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })

      if (response.ok) {
        // Update order status to processing
        const updatedOrders = orders.map((order) =>
          order.id === orderId ? { ...order, status: "processing" as const, needsProcessing: false } : order,
        )
        setOrders(updatedOrders)
        localStorage.setItem("admin_orders", JSON.stringify(updatedOrders))
        console.log("Order placed successfully")
      } else {
        console.error("Failed to place order")
      }
    } catch (error) {
      console.error("Error placing order:", error)
    }
  }

  useEffect(() => {
    const fetchOrders = () => {
      try {
        const storedOrders = localStorage.getItem("admin_orders")
        if (storedOrders) {
          const parsedOrders = JSON.parse(storedOrders)
          console.log("Fetched orders from localStorage:", parsedOrders)
          setOrders(parsedOrders)
        } else {
          console.log("No orders found in localStorage")
          setOrders([])
        }
      } catch (error) {
        console.error("Error fetching orders:", error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()

    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])

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
          <CardTitle>Orders Management</CardTitle>
          <CardDescription>View and manage all customer orders</CardDescription>
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

              <div className="flex items-end">
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
                      <th className="text-left p-4 font-medium">Status</th>
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
                            {order.status === "payment_confirmed" && order.needsProcessing && (
                              <Button
                                size="sm"
                                onClick={() => handlePlaceOrder(order.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Place Order
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {order.status === "failed" && (
                                  <DropdownMenuItem onClick={() => handleRetryOrder(order.id)}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Retry Order
                                  </DropdownMenuItem>
                                )}
                                {order.status === "completed" && (
                                  <DropdownMenuItem onClick={() => handleRefundOrder(order.id)}>
                                    Refund Order
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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
