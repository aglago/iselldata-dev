"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PaymentInstructions } from "@/components/payment-instructions"

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  package: {
    id: number
    size: string
    price: number
    duration: string
    network: string
  } | null
}

const isBusinessHours = () => {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const hour = now.getHours()

  // Sunday is closed (day 0)
  if (day === 0) {
    return { isOpen: false, message: "We are closed on Sundays. Orders will be processed on Monday." }
  }

  // Monday to Saturday: 7 AM to 9 PM
  if (hour < 7 || hour >= 21) {
    return {
      isOpen: false,
      message: "Orders outside business hours (7 AM - 9 PM) will be processed the next business day.",
    }
  }

  return { isOpen: true, message: "" }
}

const getDeliveryInfo = (network: string) => {
  switch (network) {
    case "airteltigo":
      return { time: "Instant delivery", color: "text-green-600" }
    case "mtn":
    case "telecel":
      return { time: "15-30 minutes (up to 1 hour)", color: "text-amber-600" }
    default:
      return { time: "15-30 minutes", color: "text-blue-600" }
  }
}

export function OrderModal({ isOpen, onClose, package: selectedPackage }: OrderModalProps) {
  const [step, setStep] = useState(1)
  const [orderData, setOrderData] = useState({
    phoneNumber: "",
    customerName: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [paymentDetails, setPaymentDetails] = useState<any>(null)

  const businessStatus = isBusinessHours()
  const deliveryInfo = selectedPackage ? getDeliveryInfo(selectedPackage.network) : null

  const handleInputChange = (field: string, value: string) => {
    setOrderData((prev) => ({ ...prev, [field]: value }))
  }

  const validatePhoneNumber = (phone: string) => {
    // Ghana phone number validation (10 digits starting with 0 or +233)
    const ghanaPhoneRegex = /^(\+233|0)[2-9]\d{8}$/
    return ghanaPhoneRegex.test(phone.replace(/\s/g, ""))
  }

  const handlePlaceOrder = async () => {
    if (!orderData.phoneNumber || !validatePhoneNumber(orderData.phoneNumber)) {
      alert("Please enter a valid Ghana phone number")
      return
    }

    setIsProcessing(true)

    try {
      const timestamp = Date.now().toString().slice(-8) // Last 8 digits of timestamp
      const randomId = Math.random().toString(36).substr(2, 6).toUpperCase() // 6 random chars
      const newOrderId = `GD${timestamp}${randomId}` // Format: GD12345678ABC123 (max 17 chars)

      const paymentInfo = {
        orderId: newOrderId,
        amount: selectedPackage.price,
        momoNumber: "024 990 5548",
        vodafoneNumber: "050 958 1027",
        airteltigoNumber: "027 012 3456",
        recipientName: "Samuella Manye Aglago",
      }

      // Store order locally for tracking
      const orderInfo = {
        orderId: newOrderId,
        package: selectedPackage,
        customer: orderData,
        timestamp: new Date().toISOString(),
        status: "pending_payment",
      }

      // Save to localStorage for now (instead of database)
      const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]")
      existingOrders.push(orderInfo)
      localStorage.setItem("orders", JSON.stringify(existingOrders))

      setOrderId(newOrderId)
      setPaymentDetails(paymentInfo)
      setOrderComplete(true)
      setStep(2)
    } catch (error) {
      console.error("[v0] Order creation error:", error)
      alert("Failed to generate payment instructions. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetModal = () => {
    setStep(1)
    setOrderData({ phoneNumber: "", customerName: "" })
    setOrderComplete(false)
    setOrderId("")
    setPaymentDetails(null)
    setIsProcessing(false)
    onClose()
  }

  if (!selectedPackage) return null

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Complete Your Order
          </DialogTitle>
          <DialogDescription>
            {selectedPackage.size} {selectedPackage.network.toUpperCase()} data package
          </DialogDescription>
        </DialogHeader>

        {!businessStatus.isOpen && (
          <Alert className="mb-4">
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-sm">{businessStatus.message}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-4">
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">
                {selectedPackage.size} {selectedPackage.network.toUpperCase()}
              </span>
              <span className="text-xl font-bold text-primary">GH₵{selectedPackage.price}</span>
            </div>
            {deliveryInfo && (
              <p className="text-sm text-muted-foreground">
                Expected delivery: <span className={deliveryInfo.color}>{deliveryInfo.time}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">validity: 90 days</p>
          </CardContent>
        </Card>

        {/* Step 1: Customer Information */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                placeholder="0XX XXX XXXX"
                value={orderData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Enter the phone number to receive the data bundle</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Full Name (Optional)</Label>
              <Input
                id="customerName"
                placeholder="Enter your full name"
                value={orderData.customerName}
                onChange={(e) => handleInputChange("customerName", e.target.value)}
              />
            </div>

            <Button onClick={handlePlaceOrder} disabled={isProcessing} className="w-full">
              {isProcessing ? "Processing..." : "Continue to Payment"}
            </Button>
          </div>
        )}

        {/* Step 2: Payment Instructions */}
        {step === 2 && orderComplete && paymentDetails && (
          <PaymentInstructions
            orderId={orderId}
            paymentMethod="mobile_money" // Default to mobile money
            amount={selectedPackage.price}
            paymentDetails={paymentDetails}
            packageDetails={selectedPackage}
            customerDetails={orderData}
            onClose={resetModal}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
