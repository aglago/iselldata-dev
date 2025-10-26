"use client"

import { useSearchParams } from 'next/navigation'
import { CheckCircle, Smartphone, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const trackingId = searchParams.get('trackingId')
  const amount = searchParams.get('amount')
  const packageSize = searchParams.get('package')
  const network = searchParams.get('network')
  const phone = searchParams.get('phone')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
            <p className="text-gray-600">Your order has been confirmed and is being processed.</p>
          </div>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-medium">{orderId}</span>
            </div>
            {trackingId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tracking ID:</span>
                <span className="font-medium">{trackingId}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Package:</span>
              <span className="font-medium">{packageSize} {network?.toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">{phone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium text-green-600">GH₵{amount}</span>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">Data Delivery in Progress</span>
            </div>
            <p className="text-sm text-blue-700">
              Your {packageSize} data bundle will be delivered to {phone} within 
              <strong className="text-blue-800"> 15-30 minutes</strong> or up to <strong className="text-blue-800">1 hour</strong>.
            </p>
          </div>

          {/* Timer Info */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Expected delivery time: {network?.toLowerCase() === 'airteltigo' ? 'Instant' : '15-30 minutes'}</span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/" className="w-full">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Buy More Data
              </Button>
            </Link>
            <Link href="/support" className="w-full">
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </Link>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-gray-500">
            You will receive an SMS confirmation once your data has been delivered successfully.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}