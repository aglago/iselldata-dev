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
  const [orderId, setOrderId] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'confirmed' | 'failed'>('pending');
  const [ogateWayTransactionId, setOgateWayTransactionId] = useState<string | null>(null);

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
        setOrderId(newOrderId);
        setTrackingId(paymentResult.trackingId);
        setOgateWayTransactionId(paymentResult.transactionId);
        setStep(3);
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

  const checkPaymentStatusFromOGateway = async () => {
    if (!ogateWayTransactionId) {
      toast.error('No transaction ID found');
      return;
    }
    
    setPaymentStatus('checking');
    
    try {
      const response = await fetch(`/api/payment/verify?transactionId=${ogateWayTransactionId}`);
      const result = await response.json();
      
      if (result.success) {
        if (result.status === 'success' || result.status === 'confirmed') {
          setPaymentStatus('confirmed');
        } else if (result.status === 'failed' || result.status === 'cancelled') {
          setPaymentStatus('failed');
        } else {
          // Still pending
          setPaymentStatus('pending');
          toast.info('Payment is still processing. Please try again in a moment.');
        }
      } else {
        toast.error(result.message || 'Failed to verify payment');
        setPaymentStatus('pending');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast.error('Failed to verify payment. Please try again.');
      setPaymentStatus('pending');
    }
  };
  
  const handlePaymentConfirmed = async () => {
    if (!orderId) {
      toast.error('Order ID not found');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Send SMS confirmation
      const response = await fetch('/api/payment/send-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          phone: orderData.phoneNumber,
          packageSize: selectedPackage?.size || '',
          network: selectedPackage?.network || ''
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Payment confirmed! Your data will be delivered shortly.');
      } else {
        toast.success('Payment confirmed! SMS notification failed but your data will be delivered shortly.');
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      toast.success('Payment confirmed! SMS notification failed but your data will be delivered shortly.');
    } finally {
      setIsProcessing(false);
      resetModal();
    }
  };
  
  const handleCheckPayment = () => {
    checkPaymentStatusFromOGateway();
  };

  const resetModal = () => {
    setStep(1);
    setOrderData({ phoneNumber: "", customerName: "" });
    setPaymentData({ paymentNetwork: "", paymentPhoneNumber: "", accountName: "" });
    setIsProcessing(false);
    setIsValidatingAccount(false);
    setOrderId(null);
    setPaymentStatus('pending');
    setOgateWayTransactionId(null);
    onClose();
  };

  if (!selectedPackage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            {step === 1 && "Complete Your Order"}
            {step === 2 && "Payment Details"}
            {step === 3 && "Payment Confirmation"}
            {(step === 2 || step === 3) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(step - 1)}
                className="ml-auto"
                disabled={step === 3 && paymentStatus === 'checking'}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {selectedPackage.size} {selectedPackage.network.toUpperCase()} data package
            {step === 2 && " - Step 2 of 3"}
            {step === 3 && " - Step 3 of 3"}
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

        {/* Step 3: Payment Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center space-y-3">
              {paymentStatus === 'pending' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="font-medium text-slate-800">Awaiting Payment</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Check your phone for the payment prompt from {paymentData.paymentNetwork.toUpperCase()} and complete the payment
                  </p>
                </div>
              )}
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Order ID:</strong> {orderId}
                </p>
                {trackingId && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Tracking ID:</strong> {trackingId}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  <strong>Amount:</strong> GH₵{selectedPackage.price}
                </p>
              </div>
            </div>

            {paymentStatus === 'pending' && (
              <div className="space-y-3">
                <Button
                  onClick={handleCheckPayment}
                  className="w-full"
                  disabled={isProcessing}
                >
                  I have made payment
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Click after completing the payment on your phone
                </p>
              </div>
            )}

            {paymentStatus === 'checking' && (
              <div className="text-center space-y-3">
                <div className="animate-spin mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="text-sm text-muted-foreground">
                  Verifying your payment... Please wait.
                </p>
              </div>
            )}

            {paymentStatus === 'confirmed' && (
              <div className="space-y-3">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                  <p className="font-medium text-primary">Payment Confirmed! ✅</p>
                  <p className="text-sm text-primary/80 mt-1">
                    Your data bundle will be delivered to {orderData.phoneNumber} shortly.
                  </p>
                </div>
                <Button
                  onClick={handlePaymentConfirmed}
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Sending confirmation..." : "Complete Order"}
                </Button>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="space-y-3">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                  <p className="font-medium text-red-800">Payment Not Confirmed</p>
                  <p className="text-sm text-red-600 mt-1">
                    We couldn't verify your payment. Please try again or contact support.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={handleCheckPayment}
                    variant="outline"
                    className="w-full"
                  >
                    Check Payment Again
                  </Button>
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="w-full"
                  >
                    Try New Payment
                  </Button>
                  <Button
                    onClick={resetModal}
                    variant="ghost"
                    className="w-full"
                  >
                    Cancel Order
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}