// Hubnet API integration for real data bundle purchases
import { createClient } from "@/lib/supabase/server"
import { smsService } from "./arkesel-sms"

interface HubnetDataRequest {
  network: "mtn" | "at" | "big-time"
  phoneNumber: string
  volumeMB: number
  reference: string
  referrer?: string
  webhook?: string
}

interface HubnetResponse {
  status: boolean
  reason: string
  code: string
  message: string
  transaction_id: string
  payment_id: string
  ip_address: string
  reference: string
  data: {
    status: boolean
    code: string
    message: string
  }
}

interface BalanceResponse {
  status: boolean
  balance: number
  currency: string
}

class HubnetAPIClient {
  private baseUrl = "https://console.hubnet.app/live/api/context/business/transaction"
  private apiKey = process.env.HUBNET_API_KEY || ""

  private getHeaders() {
    return {
      token: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    }
  }

  // Map our network names to Hubnet's network codes
  private mapNetworkToHubnet(network: string): "mtn" | "at" | "big-time" {
    const networkMap = {
      mtn: "mtn",
      airteltigo: "at",
      telecel: "big-time",
    }
    return networkMap[network as keyof typeof networkMap] || "mtn"
  }

  // Convert GB to MB for Hubnet API
  private convertGBToMB(gb: number): number {
    return Math.round(gb * 1024)
  }

  // Format Ghana phone number to national format (0xxxxxxxxx)
  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\s+/g, "")

    // Remove +233 and replace with 0
    if (cleaned.startsWith("+233")) {
      cleaned = "0" + cleaned.substring(4)
    } else if (!cleaned.startsWith("0")) {
      cleaned = "0" + cleaned
    }

    return cleaned
  }

  async checkBalance(): Promise<BalanceResponse> {
    try {
      console.log("Checking Hubnet balance")

      const response = await fetch(`${this.baseUrl}/check_balance`, {
        method: "GET",
        headers: this.getHeaders(),
      })

      const data = await response.json()
      console.log("Balance check response:", data)

      return {
        status: response.ok && data.status,
        balance: data.balance || 0,
        currency: data.currency || "GHS",
      }
    } catch (error) {
      console.error("Balance check error:", error)
      return {
        status: false,
        balance: 0,
        currency: "GHS",
      }
    }
  }

  async purchaseDataBundle(request: HubnetDataRequest): Promise<HubnetResponse> {
    try {
      console.log("Hubnet purchase request:", request)

      const endpoint = `${this.baseUrl}/${request.network}-new-transaction`

      const payload = {
        phone: this.formatPhoneNumber(request.phoneNumber),
        volume: request.volumeMB.toString(),
        reference: request.reference,
        ...(request.referrer && { referrer: this.formatPhoneNumber(request.referrer) }),
        ...(request.webhook && { webhook: request.webhook }),
      }

      console.log("Hubnet API payload:", payload)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log("Hubnet API response:", data)

      return data
    } catch (error) {
      console.error("Hubnet API error:", error)
      return {
        status: false,
        reason: "Network Error",
        code: "9999",
        message: "Failed to connect to Hubnet API",
        transaction_id: "",
        payment_id: "",
        ip_address: "",
        reference: request.reference,
        data: {
          status: false,
          code: "9999",
          message: "Network connection failed",
        },
      }
    }
  }

  // Convert our package data to Hubnet format
  async purchaseFromPackage(
    network: string,
    phoneNumber: string,
    packageSize: number, // in GB
    orderId: string,
    referrerPhone?: string,
  ): Promise<HubnetResponse> {
    const supabase = await createClient()

    try {
      const hubnetNetwork = this.mapNetworkToHubnet(network)
      const volumeMB = this.convertGBToMB(packageSize)

      const request: HubnetDataRequest = {
        network: hubnetNetwork,
        phoneNumber,
        volumeMB,
        reference: orderId,
        referrer: referrerPhone,
        webhook: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/hubnet`,
      }

      console.log("Making Hubnet API call for order:", orderId)
      const response = await this.purchaseDataBundle(request)

      const { error: transactionError } = await supabase.from("transactions").insert({
        order_id: orderId,
        hubnet_transaction_id: response.transaction_id,
        hubnet_payment_id: response.payment_id,
        status: response.status ? "success" : "failed",
        response_data: response,
      })

      if (transactionError) {
        console.error("Failed to save transaction:", transactionError)
      }

      if (response.status && response.code === "0000") {
        const { error: orderError } = await supabase
          .from("orders")
          .update({
            hubnet_transaction_id: response.transaction_id,
            hubnet_payment_id: response.payment_id,
            delivery_status: "processing",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId)

        if (orderError) {
          console.error("Failed to update order status:", orderError)
        }
      }

      return response
    } catch (error) {
      console.error("Hubnet purchase error:", error)

      const { error: transactionError } = await supabase.from("transactions").insert({
        order_id: orderId,
        status: "failed",
        response_data: { error: error instanceof Error ? error.message : "Unknown error" },
      })

      if (transactionError) {
        console.error("Failed to save failed transaction:", transactionError)
      }

      return {
        status: false,
        reason: "Network Error",
        code: "9999",
        message: "Failed to connect to Hubnet API",
        transaction_id: "",
        payment_id: "",
        ip_address: "",
        reference: orderId,
        data: {
          status: false,
          code: "9999",
          message: "Network connection failed",
        },
      }
    }
  }
}

export const hubnetAPI = new HubnetAPIClient()
export { smsService }
