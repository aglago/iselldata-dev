"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Clock, CheckCircle, XCircle, RefreshCw, ArrowLeft, Phone, Smartphone } from "lucide-react"
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
  const [trackingInput, setTrackingInput] = useState(searchParams?.get("id") || searchParams?.get("trackingId") || "")
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const trackOrder = async () => {
    if (!trackingInput.trim()) {
      setError("Please enter a tracking ID or order ID")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Determine if input is tracking ID (TRK...) or order ID (GD...)
      const isTrackingId = trackingInput.startsWith('TRK')
      const queryParam = isTrackingId ? `trackingId=${trackingInput}` : `id=${trackingInput}`
      
      const response = await fetch(`/api/orders/track?${queryParam}`)
      const data = await response.json()
      
      if (response.ok && data.success) {
        setOrderStatus(data.order)
      } else {
        setError(data.message || "Order not found")
      }
    } catch (error) {
      setError("Failed to track order")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (trackingInput) {
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
              <Label htmlFor="trackingInput">Tracking ID or Order ID</Label>
              <div className="flex gap-2">
                <Input
                  id="trackingInput"
                  placeholder="Enter Tracking ID (TRK...) or Order ID (GD...)"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
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
                  Placed on {new Date(orderStatus.createdAt).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {new Date(orderStatus.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Order ID:</span>
                    <div className="font-medium">{orderStatus.orderId}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <div className="font-medium">{orderStatus.customer.customerName}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone Number:</span>
                    <div className="font-medium">{orderStatus.customer.phoneNumber}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Package:</span>
                    <div className="font-medium">
                      {orderStatus.package.size} {orderStatus.package.network.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <div className="font-medium text-green-600">GH₵{orderStatus.package.price}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Order Date:</span>
                    <div className="font-medium">{new Date(orderStatus.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric', 
                      year: 'numeric'
                    })}</div>
                  </div>
                </div>
                
                {orderStatus.completedAt && (
                  <div className="pt-3 border-t">
                    <span className="text-muted-foreground text-sm">Completed:</span>
                    <p className="font-medium">{new Date(orderStatus.completedAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })} at {new Date(orderStatus.completedAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}</p>
                  </div>
                )}
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
                            {new Date(step.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })} at {new Date(step.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orderStatus.status === 'completed' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">✅ Data bundle delivered successfully!</p>
                      <p className="text-green-700 text-sm mt-1">
                        Your {orderStatus.package.size} {orderStatus.package.network.toUpperCase()} data has been added to {orderStatus.customer.phoneNumber}
                      </p>
                      {orderStatus.completedAt && (
                        <p className="text-green-600 text-xs mt-2">
                          Delivered on {new Date(orderStatus.completedAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })} at {new Date(orderStatus.completedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {(orderStatus.status === 'processing' || orderStatus.status === 'payment_confirmed') && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 font-medium">🔄 Your order is being processed</p>
                      <p className="text-blue-700 text-sm mt-1">
                        Expected delivery: 15-30 minutes (up to 1 hour during peak times)
                      </p>
                      <p className="text-blue-600 text-xs mt-2">
                        You'll receive an SMS confirmation when your data is delivered
                      </p>
                    </div>
                  )}
                  
                  {orderStatus.status === 'pending_payment' && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 font-medium">⏳ Awaiting payment confirmation</p>
                      <p className="text-yellow-700 text-sm mt-1">
                        Complete your payment to start processing your data bundle
                      </p>
                    </div>
                  )}
                  
                  {orderStatus.status === 'failed' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 font-medium">❌ Delivery failed</p>
                      <p className="text-red-700 text-sm mt-1">Please contact support for assistance and refund</p>
                      <p className="text-red-600 text-xs mt-2">
                        Our support team will help resolve this issue within 24 hours
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  Buy More Data
                </Button>
              </Link>
              <Button variant="default" className="flex-1" onClick={() => window.open('https://wa.me/233509581027', '_blank')}>
                Contact Support
              </Button>
            </div>

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
                  If you have any issues with your order or need assistance, our support team is here to help.
                </p>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">WhatsApp:</span> +233 50 958 1027
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Response Time:</span> Within 24 hours
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Support Hours:</span> 7 AM - 9 PM (Mon-Sat)
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
