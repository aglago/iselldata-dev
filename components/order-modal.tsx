"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  package: {
    id: number;
    size: string;
    price: number;
    duration: string;
    network: string;
  } | null;
}

const isBusinessHours = () => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  if (day === 0) {
    return {
      isOpen: false,
      message: "We are closed on Sundays. Orders will be processed on Monday.",
    };
  }

  if (hour < 7 || hour >= 21) {
    return {
      isOpen: false,
      message:
        "Orders outside business hours (7 AM - 9 PM) will be processed the next business day.",
    };
  }

  return { isOpen: true, message: "" };
};

const getDeliveryInfo = (network: string) => {
  switch (network) {
    case "airteltigo":
      return { time: "Instant delivery", color: "text-green-600" };
    case "mtn":
    case "telecel":
      return { time: "15-30 minutes (up to 1 hour)", color: "text-amber-600" };
    default:
      return { time: "15-30 minutes", color: "text-blue-600" };
  }
};


export function OrderModal({
  isOpen,
  onClose,
  package: selectedPackage,
}: OrderModalProps) {
  const [orderData, setOrderData] = useState({
    phoneNumber: "",
    customerName: "",
  });
  const [customerEmail, setCustomerEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const businessStatus = isBusinessHours();
  const deliveryInfo = selectedPackage
    ? getDeliveryInfo(selectedPackage.network)
    : null;

  const handleInputChange = (field: string, value: string) => {
    setOrderData((prev) => ({ ...prev, [field]: value }));
  };


  const validatePhoneNumber = (phone: string) => {
    const ghanaPhoneRegex = /^(\+233|0)[2-9]\d{8}$/;
    return ghanaPhoneRegex.test(phone.replace(/\s/g, ""));
  };


  const handleContinueToPayment = async () => {
    if (!orderData.phoneNumber || !validatePhoneNumber(orderData.phoneNumber)) {
      toast.error("Please enter a valid Ghana phone number");
      return;
    }
    if (!customerEmail || !/\S+@\S+\.\S+/.test(customerEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    // Directly process payment (skip step 2)
    await handleProcessPayment();
  };

  const handleProcessPayment = async () => {
    if (!customerEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsProcessing(true);

    try {
      const paymentResponse = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: selectedPackage?.price,
          packageDetails: selectedPackage,
          customerDetails: {
            ...orderData,
            email: customerEmail
          },
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error('Payment initialization failed');
      }

      const paymentResult = await paymentResponse.json();
      
      if (paymentResult.success) {
        
        // Redirect to Paystack payment page with success callback
        const successUrl = `${window.location.origin}/success?orderId=${paymentResult.orderId}&trackingId=${paymentResult.trackingId}&amount=${selectedPackage?.price}&package=${selectedPackage?.size}&network=${selectedPackage?.network}&phone=${orderData.phoneNumber}`;
        
        // Add success URL to Paystack payment URL
        const paymentUrl = `${paymentResult.authorizationUrl}&callback_url=${encodeURIComponent(successUrl)}`;
        
        // Redirect to Paystack (same window)
        window.location.href = paymentUrl;
      } else {
        throw new Error(paymentResult.message || 'Payment initialization failed');
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      toast.error("Failed to initialize payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };


  const resetModal = () => {
    setOrderData({ phoneNumber: "", customerName: "" });
    setCustomerEmail("");
    setIsProcessing(false);
    onClose();
  };

  if (!selectedPackage) return null;

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
            <AlertDescription className="text-sm">
              {businessStatus.message}
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-4">
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">
                {selectedPackage.size} {selectedPackage.network.toUpperCase()}
              </span>
              <span className="text-xl font-bold text-primary">
                GH₵{selectedPackage.price}
              </span>
            </div>
            {deliveryInfo && (
              <p className="text-sm text-muted-foreground">
                Expected delivery:{" "}
                <span className={deliveryInfo.color}>{deliveryInfo.time}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">validity: 90 days</p>
          </CardContent>
        </Card>

        {/* Order Information */}
        <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (Delivery) *</Label>
              <Input
                id="phoneNumber"
                placeholder={selectedPackage.network.toUpperCase() == "MTN" ? "024 XXX XXXX" : "027 XX XXXXX"}
                value={orderData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the phone number to receive the data bundle
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Full Name (Optional)</Label>
              <Input
                id="customerName"
                placeholder="Enter your full name"
                value={orderData.customerName}
                onChange={(e) =>
                  handleInputChange("customerName", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email Address *</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="your@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required for payment receipt and order notifications
              </p>
            </div>

            <Button
              onClick={handleContinueToPayment}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Opening Payment..." : `Pay GH₵${selectedPackage?.price} with Paystack`}
            </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}