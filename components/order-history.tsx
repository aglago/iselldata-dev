"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react"

interface Order {
  orderId: string
  package: {
    size: string
    network: string
    price: number
  }
  customer: {
    phoneNumber: string
    customerName: string
  }
  status: "pending_payment" | "processing" | "completed" | "failed"
  createdAt: string
}

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_payment":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const searchOrders = async () => {
    if (!searchTerm.trim()) return

    setIsLoading(true)
    try {
      // In a real app, this would search the database
      // For now, we'll simulate with mock data
      const mockOrders: Order[] = [
        {
          orderId: searchTerm,
          package: { size: "2GB", network: "mtn", price: 8 },
          customer: { phoneNumber: "0XX XXX XXXX", customerName: "John Doe" },
          status: "completed",
          createdAt: new Date().toISOString(),
        },
      ]
      setOrders(mockOrders)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="search">Search Order</Label>
        <div className="flex gap-2">
          <Input
            id="search"
            placeholder="Enter Order ID or Phone Number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && searchOrders()}
          />
          <Button onClick={searchOrders} disabled={isLoading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {orders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Order Results</h3>
          {orders.map((order) => (
            <Card key={order.orderId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Order #{order.orderId}</CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {order.status.replace("_", " ").toUpperCase()}
                    </div>
                  </Badge>
                </div>
                <CardDescription>
                  {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <div className="font-medium">{order.customer.customerName}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <div className="font-medium">{order.customer.phoneNumber}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Package:</span>
                    <div className="font-medium">
                      {order.package.size} {order.package.network.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <div className="font-medium">GH₵{order.package.price}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
