"use client"

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, XCircle, Smartphone, Package } from 'lucide-react'
import Link from 'next/link'

interface OrderStatus {
  order_id: string
  tracking_id: string
  phone: string
  network: string
  package_size: string
  price: number
  payment_status: string
  delivery_status: string
  created_at: string
  updated_at: string
  customers?: {
    name: string
    email: string
  }
}

export default function TrackOrderPage() {
  const params = useParams()
  const trackingId = params.trackingId as string
  const [order, setOrder] = useState<OrderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (trackingId) {
      fetchOrderStatus()
    }
  }, [trackingId])

  const fetchOrderStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/track/${trackingId}`)
      const data = await response.json()
      
      if (data.success) {
        setOrder(data.data)
      } else {
        setError(data.message || 'Order not found')
      }
    } catch (error) {
      console.error('Failed to fetch order:', error)
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'processing':
      case 'placed':
        return <Clock className="w-6 h-6 text-blue-600" />
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-600" />
      default:
        return <Package className="w-6 h-6 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'processing':
      case 'placed':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusMessage = (deliveryStatus: string, paymentStatus: string) => {
    if (paymentStatus === 'pending') {
      return 'Awaiting payment confirmation'
    }
    
    switch (deliveryStatus) {
      case 'delivered':
        return 'Data bundle delivered successfully!'
      case 'processing':
        return 'Data bundle is being processed for delivery'
      case 'placed':
        return 'Order placed and awaiting processing'
      case 'failed':
        return 'Delivery failed - please contact support'
      default:
        return 'Order pending'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <p>Loading order details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold text-gray-900">Order Not Found</h1>
            <p className="text-gray-600">{error || 'The tracking ID you entered could not be found.'}</p>
            <Link href="/">
              <Button className="w-full">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">Order status and delivery information</p>
        </div>

        {/* Order Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getStatusIcon(order.delivery_status)}
              <span>{getStatusMessage(order.delivery_status, order.payment_status)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg border ${getStatusColor(order.delivery_status)}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Status: {order.delivery_status.charAt(0).toUpperCase() + order.delivery_status.slice(1)}</span>
                <span className="text-sm">{new Date(order.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tracking ID:</span>
                <p className="font-medium">{order.tracking_id}</p>
              </div>
              <div>
                <span className="text-gray-600">Order ID:</span>
                <p className="font-medium">{order.order_id}</p>
              </div>
              <div>
                <span className="text-gray-600">Package:</span>
                <p className="font-medium">{order.package_size} {order.network.toUpperCase()}</p>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <p className="font-medium text-green-600">GH₵{order.price}</p>
              </div>
              <div>
                <span className="text-gray-600">Phone Number:</span>
                <p className="font-medium">{order.phone}</p>
              </div>
              <div>
                <span className="text-gray-600">Order Date:</span>
                <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {order.customers && (
              <div className="pt-3 border-t">
                <span className="text-gray-600 text-sm">Customer:</span>
                <p className="font-medium">{order.customers.name}</p>
                {order.customers.email && (
                  <p className="text-sm text-gray-600">{order.customers.email}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.delivery_status === 'delivered' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">✅ Data bundle delivered successfully!</p>
                  <p className="text-green-700 text-sm mt-1">Your {order.package_size} data has been added to {order.phone}</p>
                </div>
              )}
              
              {(order.delivery_status === 'processing' || order.delivery_status === 'placed') && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium">🔄 Your order is being processed</p>
                  <p className="text-blue-700 text-sm mt-1">
                    Expected delivery: 15-30 minutes or up to 1 hour
                  </p>
                </div>
              )}
              
              {order.delivery_status === 'failed' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">❌ Delivery failed</p>
                  <p className="text-red-700 text-sm mt-1">Please contact support for assistance</p>
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
          <Link href="/support" className="flex-1">
            <Button className="w-full">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}