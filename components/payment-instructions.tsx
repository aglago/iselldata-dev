"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, CheckCircle2, AlertCircle, Phone, CreditCard, Building, Clock, Upload, Camera } from "lucide-react"

interface PaymentInstructionsProps {
  orderId: string
  paymentMethod: string
  amount: number
  paymentDetails: any
  packageDetails: any
  customerDetails: any
  onClose: () => void
}

export function PaymentInstructions({
  orderId,
  paymentMethod,
  amount,
  paymentDetails,
  packageDetails,
  customerDetails,
  onClose,
}: PaymentInstructionsProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      setPaymentScreenshot(file)
    }
  }

  const handlePaymentConfirmation = async () => {
    if (!paymentScreenshot) {
      alert("Please upload a payment screenshot first")
      return
    }

    setIsSubmittingPayment(true)

    try {
      const formData = new FormData()
      formData.append("screenshot", paymentScreenshot)
      formData.append("orderId", orderId)
      formData.append("paymentMethod", paymentMethod)
      formData.append("amount", amount.toString())
      formData.append("packageDetails", JSON.stringify(packageDetails))
      formData.append("customerDetails", JSON.stringify(customerDetails))

      const response = await fetch("/api/payment-confirm", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setPaymentSubmitted(true)
      } else {
        alert("Failed to submit payment confirmation. Please try again.")
      }
    } catch (error) {
      console.error("Payment confirmation error:", error)
      alert("Failed to submit payment confirmation. Please try again.")
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  const getPaymentIcon = () => {
    if (paymentMethod.includes("momo") || paymentMethod.includes("cash") || paymentMethod.includes("money")) {
      return <Phone className="h-5 w-5 text-green-600" />
    }
    if (paymentMethod === "card") {
      return <CreditCard className="h-5 w-5 text-blue-600" />
    }
    return <Building className="h-5 w-5 text-gray-600" />
  }

  const getPaymentTitle = () => {
    switch (paymentMethod) {
      case "mtn_momo":
        return "MTN Mobile Money Payment"
      case "vodafone_cash":
        return "Vodafone Cash Payment"
      case "airteltigo_money":
        return "AirtelTigo Money Payment"
      case "bank_transfer":
        return "Bank Transfer Payment"
      case "card":
        return "Card Payment"
      default:
        return "Payment Instructions"
    }
  }

  if (paymentSubmitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-green-600">Payment Confirmation Submitted!</h3>
        <p className="text-sm text-muted-foreground">
          Your payment confirmation has been sent to our admin team. You will receive an SMS notification once your
          order is processed and data bundle is delivered.
        </p>
        <p className="text-xs text-muted-foreground font-mono">Order ID: {orderId}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={() => window.open(`/track-order?id=${orderId}`, "_blank")}
          >
            Track Order
          </Button>
          <Button onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-amber-600">Payment Required</h3>
        <p className="text-sm text-muted-foreground">Complete payment to activate your data bundle</p>
        <p className="text-xs text-muted-foreground font-mono">Order ID: {orderId}</p>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Important:</strong> Your data bundle will only be delivered after we confirm your payment. We do not
          have automatic payment confirmation from mobile money providers.
        </AlertDescription>
      </Alert>

      {/* Payment Instructions Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {getPaymentIcon()}
            Mobile Money Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mobile Money Instructions */}
          <div className="space-y-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Complete payment within 10 minutes to secure your data bundle.</AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">MTN Mobile Money</p>
                  <p className="font-mono font-medium">{paymentDetails.momoNumber}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(paymentDetails.momoNumber, "mtn")}>
                  {copied === "mtn" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Vodafone Cash</p>
                  <p className="font-mono font-medium">{paymentDetails.vodafoneNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(paymentDetails.vodafoneNumber, "vodafone")}
                >
                  {copied === "vodafone" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">AirtelTigo Money</p>
                  <p className="font-mono font-medium">{paymentDetails.airteltigoNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(paymentDetails.airteltigoNumber, "airteltigo")}
                >
                  {copied === "airteltigo" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Recipient Name</p>
                  <p className="font-medium">{paymentDetails.recipientName}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-mono font-medium">GH₵{amount}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(amount.toString(), "amount")}>
                  {copied === "amount" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Reference (Important!)</p>
                  <p className="font-mono font-medium">{orderId}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(orderId, "reference")}>
                  {copied === "reference" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Payment Steps (Choose any network):</h4>
              <div className="space-y-3 text-sm text-blue-800">
                <div>
                  <p className="font-medium">MTN Mobile Money:</p>
                  <ol className="space-y-1 ml-4">
                    <li>1. Dial *170# on your MTN line</li>
                    <li>2. Select "Send Money"</li>
                    <li>3. Enter number: {paymentDetails.momoNumber}</li>
                    <li>4. Enter amount: GH₵{amount}</li>
                    <li>5. Enter reference: {orderId}</li>
                    <li>6. Confirm with your PIN</li>
                  </ol>
                </div>
                <div>
                  <p className="font-medium">Vodafone Cash:</p>
                  <ol className="space-y-1 ml-4">
                    <li>1. Dial *110# on your Vodafone line</li>
                    <li>2. Select "Send Money"</li>
                    <li>3. Enter number: {paymentDetails.vodafoneNumber}</li>
                    <li>4. Enter amount: GH₵{amount}</li>
                    <li>5. Enter reference: {orderId}</li>
                    <li>6. Confirm with your PIN</li>
                  </ol>
                </div>
                <div>
                  <p className="font-medium">AirtelTigo Money:</p>
                  <ol className="space-y-1 ml-4">
                    <li>1. Dial *185# on your AirtelTigo line</li>
                    <li>2. Select "Send Money"</li>
                    <li>3. Enter number: {paymentDetails.airteltigoNumber}</li>
                    <li>4. Enter amount: GH₵{amount}</li>
                    <li>5. Enter reference: {orderId}</li>
                    <li>6. Confirm with your PIN</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Transfer Instructions */}
          {paymentMethod === "bank_transfer" && (
            <div className="space-y-3">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Transfer the exact amount and include the order ID as reference.</AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Bank Name</p>
                  <p className="font-medium">Absa Bank Ghana</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-medium">0123456789</p>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard("0123456789", "account")}>
                      {copied === "account" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Account Name</p>
                  <p className="font-medium">Samuella Manye Aglago</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-medium">{orderId}</p>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(orderId, "ref")}>
                      {copied === "ref" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card Payment Instructions */}
          {paymentMethod === "card" && (
            <div className="space-y-3">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Contact us to arrange card payment processing.</AlertDescription>
              </Alert>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Call or WhatsApp:</p>
                <p className="font-mono font-medium text-lg">050 958 1027</p>
                <p className="text-xs text-muted-foreground mt-1">Reference: {orderId}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Next Steps:</strong> After payment, upload a screenshot and click "I have paid" below. We will
          manually verify and process your order. You'll receive an SMS confirmation when your data bundle is delivered
          (usually within 15-30 minutes for MTN/Telecel, instant for AirtelTigo).
        </AlertDescription>
      </Alert>

      {/* Payment Confirmation Section */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Camera className="h-5 w-5" />
            Confirm Your Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="screenshot">Upload Payment Screenshot *</Label>
            <Input
              id="screenshot"
              type="file"
              accept="image/*"
              onChange={handleScreenshotUpload}
              className="cursor-pointer"
            />
            {paymentScreenshot && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Screenshot uploaded: {paymentScreenshot.name}
              </p>
            )}
          </div>

          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              Please upload a clear screenshot of your payment confirmation (transaction receipt) before clicking "I
              have paid".
            </AlertDescription>
          </Alert>

          <Button
            onClick={handlePaymentConfirmation}
            disabled={!paymentScreenshot || isSubmittingPayment}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSubmittingPayment ? "Submitting..." : "I Have Paid"}
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 bg-transparent"
          onClick={() => window.open(`/track-order?id=${orderId}`, "_blank")}
        >
          Track Order
        </Button>
        <Button onClick={onClose} className="flex-1">
          Close
        </Button>
      </div>
    </div>
  )
}
