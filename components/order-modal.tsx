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
import { Smartphone, Clock, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const getNetworkCode = (network: string) => {
  switch (network.toLowerCase()) {
    case "mtn":
      return "MTN";
    case "telecel":
    case "vodafone":
      return "VOD";
    case "airteltigo":
      return "ATM";
    default:
      return "MTN";
  }
};

export function OrderModal({
  isOpen,
  onClose,
  package: selectedPackage,
}: OrderModalProps) {
  const [step, setStep] = useState(1);
  const [orderData, setOrderData] = useState({
    phoneNumber: "",
    customerName: "",
  });
  const [paymentData, setPaymentData] = useState({
    paymentNetwork: "",
    paymentPhoneNumber: "",
    accountName: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidatingAccount, setIsValidatingAccount] = useState(false);

  const businessStatus = isBusinessHours();
  const deliveryInfo = selectedPackage
    ? getDeliveryInfo(selectedPackage.network)
    : null;

  const handleInputChange = (field: string, value: string) => {
    setOrderData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePaymentInputChange = (field: string, value: string) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }));
    
    // Clear account name when network or phone number changes
    if (field === "paymentNetwork" || field === "paymentPhoneNumber") {
      setPaymentData((prev) => ({ ...prev, accountName: "" }));
    }
  };

  const validatePhoneNumber = (phone: string) => {
    const ghanaPhoneRegex = /^(\+233|0)[2-9]\d{8}$/;
    return ghanaPhoneRegex.test(phone.replace(/\s/g, ""));
  };

  const validateAccount = async () => {
    if (!paymentData.paymentNetwork || !paymentData.paymentPhoneNumber) {
      toast.error("Please select network and enter phone number");
      return;
    }

    if (!validatePhoneNumber(paymentData.paymentPhoneNumber)) {
      toast.error("Please enter a valid Ghana phone number");
      return;
    }

    setIsValidatingAccount(true);

    try {
      const response = await fetch('/api/payment/validate-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: 'GHS',
          accountCode: getNetworkCode(paymentData.paymentNetwork),
          accountNumber: paymentData.paymentPhoneNumber,
        }),
      });

      const result = await response.json();

      if (result.success && result.accountName) {
        setPaymentData((prev) => ({ ...prev, accountName: result.accountName }));
      } else {
        toast.error("Could not validate account. Please check the phone number and network.");
      }
    } catch (error) {
      console.error("Account validation error:", error);
      toast.error("Failed to validate account. Please try again.");
    } finally {
      setIsValidatingAccount(false);
    }
  };

  const handleContinueToPayment = () => {
    if (!orderData.phoneNumber || !validatePhoneNumber(orderData.phoneNumber)) {
      toast.error("Please enter a valid Ghana phone number");
      return;
    }
    setStep(2);
  };

  const handleProcessPayment = async () => {
    if (!paymentData.paymentNetwork || !paymentData.paymentPhoneNumber || !paymentData.accountName) {
      toast.error("Please validate your payment account first");
      return;
    }

    setIsProcessing(true);

    try {
      const timestamp = Date.now().toString().slice(-8);
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newOrderId = `GD${timestamp}${randomId}`;

      const paymentResponse = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: selectedPackage?.price,
          reason: `${selectedPackage?.size} ${selectedPackage?.network.toUpperCase()} data package`,
          currency: 'GHS',
          network: getNetworkCode(paymentData.paymentNetwork),
          accountName: paymentData.accountName,
          accountNumber: paymentData.paymentPhoneNumber,
          reference: newOrderId,
          packageDetails: selectedPackage,
          customerDetails: orderData,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error('Payment processing failed');
      }

      const paymentResult = await paymentResponse.json();
      
      if (paymentResult.success) {
        toast.success('Payment initiated successfully! Please check your phone for the payment prompt.');
        resetModal();
      } else {
        throw new Error(paymentResult.message || 'Payment failed');
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      toast.error("Failed to process payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setOrderData({ phoneNumber: "", customerName: "" });
    setPaymentData({ paymentNetwork: "", paymentPhoneNumber: "", accountName: "" });
    setIsProcessing(false);
    setIsValidatingAccount(false);
    onClose();
  };

  if (!selectedPackage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            {step === 1 ? "Complete Your Order" : "Payment Details"}
            {step === 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="ml-auto"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {selectedPackage.size} {selectedPackage.network.toUpperCase()} data package
            {step === 2 && " - Step 2 of 2"}
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

        {/* Step 1: Delivery Information */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (Delivery) *</Label>
              <Input
                id="phoneNumber"
                placeholder="0XX XXX XXXX"
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

            <Button
              onClick={handleContinueToPayment}
              className="w-full"
            >
              Continue to Payment
            </Button>
          </div>
        )}

        {/* Step 2: Payment Information */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentNetwork">Payment Network *</Label>
              <Select
                value={paymentData.paymentNetwork}
                onValueChange={(value) => handlePaymentInputChange("paymentNetwork", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                  <SelectItem value="telecel">Telecel Cash</SelectItem>
                  <SelectItem value="airteltigo">AirtelTigo Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentPhoneNumber">Payment Phone Number *</Label>
              <Input
                id="paymentPhoneNumber"
                placeholder="0XX XXX XXXX"
                value={paymentData.paymentPhoneNumber}
                onChange={(e) => handlePaymentInputChange("paymentPhoneNumber", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Phone number to debit payment from
              </p>
            </div>

            <Button
              onClick={validateAccount}
              disabled={isValidatingAccount || !paymentData.paymentNetwork || !paymentData.paymentPhoneNumber}
              variant="outline"
              className="w-full"
            >
              {isValidatingAccount ? "Validating..." : "Validate Account"}
            </Button>

            {paymentData.accountName && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-medium text-green-800">Account Validated</p>
                <p className="text-sm text-green-600">{paymentData.accountName}</p>
              </div>
            )}

            <Button
              onClick={handleProcessPayment}
              disabled={isProcessing || !paymentData.accountName}
              className="w-full"
            >
              {isProcessing ? "Processing Payment..." : `Pay GH₵${selectedPackage.price}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}