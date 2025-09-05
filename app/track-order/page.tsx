"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Clock, CheckCircle, XCircle, RefreshCw, ArrowLeft, Phone } from "lucide-react"
import Link from "next/link"

interface OrderStatus {
  orderId: string
  status: "pending_payment" | "payment_confirmed" | "processing" | "completed" | "failed"
  package: {
    size: string
    network: string
    price: number
    duration: string
  }
  customer: {
    phoneNumber: string
    customerName: string
  }
  createdAt: string
  completedAt?: string
  timeline: {
    step: string
    status: "completed" | "current" | "pending"
    timestamp?: string
  }[]
}

export default function TrackOrderPage() {
  const searchParams = useSearchParams()
  const [orderId, setOrderId] = useState(searchParams?.get("id") || "")
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const trackOrder = async () => {
    if (!orderId.trim()) {
      setError("Please enter an order ID")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/orders/track?id=${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrderStatus(data.order)
      } else {
        setError("Order not found")
      }
    } catch (error) {
      setError("Failed to track order")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (orderId) {
      trackOrder()
    }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_payment":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "payment_confirmed":
      case "processing":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800"
      case "payment_confirmed":
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Track Your Order</h1>
          <p className="text-muted-foreground mt-2">Enter your order ID to check the status of your data bundle</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Tracking</CardTitle>
            <CardDescription>Enter your order ID to track your data bundle delivery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID</Label>
              <div className="flex gap-2">
                <Input
                  id="orderId"
                  placeholder="Enter Order ID (e.g., GD1234567890ABCD)"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && trackOrder()}
                />
                <Button onClick={trackOrder} disabled={isLoading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}
          </CardContent>
        </Card>

        {orderStatus && (
          <div className="space-y-6">
            {/* Order Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order #{orderStatus.orderId}</CardTitle>
                  <Badge className={getStatusColor(orderStatus.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(orderStatus.status)}
                      {orderStatus.status.replace("_", " ").toUpperCase()}
                    </div>
                  </Badge>
                </div>
                <CardDescription>
                  Placed on {new Date(orderStatus.createdAt).toLocaleDateString()} at{" "}
                  {new Date(orderStatus.createdAt).toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <div className="font-medium">{orderStatus.customer.customerName}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <div className="font-medium">{orderStatus.customer.phoneNumber}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Package:</span>
                    <div className="font-medium">
                      {orderStatus.package.size} {orderStatus.package.network.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <div className="font-medium">GH₵{orderStatus.package.price}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderStatus.timeline.map((step, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.status === "completed"
                            ? "bg-green-100 text-green-600"
                            : step.status === "current"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {step.status === "completed" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : step.status === "current" ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{step.step}</div>
                        {step.timestamp && (
                          <div className="text-sm text-muted-foreground">
                            {new Date(step.timestamp).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you have any issues with your order, contact our support team.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent">
                    WhatsApp Support
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    Call Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
