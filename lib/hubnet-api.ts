// Hubnet API integration for real data bundle purchases
import { createClient } from "@/lib/supabase/server"
import { smsService } from "./arkesel-sms"
import { ApiLogger } from "./api-logger"

interface HubnetDataRequest {
  network: "mtn" | "at" | "big-time"
  phoneNumber: string
  volumeMB: number
  reference: string
  referrer?: string
  webhook?: string
}

interface HubnetResponse {
  event?: string
  status: boolean
  reason: string
  code: string
  message: string
  transaction_id: string
  payment_id: string
  ip_address: string
  reference: string
  batch_id?: string
  amount?: number
  data: {
    status: boolean
    code: string
    message?: string
    current_balance?: number
  }
}

interface HubnetBalanceData {
  response_msg: string
  expire_time: string | null
  wallet_balance: number
  last_top_up_date: string
  "today's_sales": number
  total_sales: number
}

interface HubnetBalanceResponse {
  event: string
  status: string
  message: string
  ip_address: string
  request_id: string
  data: HubnetBalanceData
}

interface BalanceResponse {
  status: boolean
  balance: number
  currency: string
  todaysSales?: number
  totalSales?: number
  lastTopUp?: string
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
  // Note: Telecel orders are handled manually, not through Hubnet
  private mapNetworkToHubnet(network: string): "mtn" | "at" {
    const networkMap: Record<string, "mtn" | "at"> = {
      mtn: "mtn" as const,
      airteltigo: "at" as const,
    }
    
    if (network.toLowerCase() === 'telecel') {
      throw new Error('Telecel orders should not be processed through Hubnet API')
    }
    
    const mappedNetwork = networkMap[network.toLowerCase()]
    if (!mappedNetwork) {
      throw new Error(`Unsupported network: ${network}`)
    }
    return mappedNetwork
  }

  // Convert GB to MB for Hubnet API (1GB = 1000MB as per Hubnet docs)
  private convertGBToMB(gb: number): number {
    return Math.round(gb * 1000)
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
    const startTime = Date.now()
    
    try {
      console.log("Checking Hubnet balance")

      const response = await fetch(`${this.baseUrl}/check_balance`, {
        method: "GET",
        headers: this.getHeaders(),
      })

      const data = await response.json()
      const responseTime = Date.now() - startTime
      
      console.log("Balance check response:", data)

      // Log the API call (commented out temporarily to avoid RLS issues)
      try {
        await ApiLogger.logHubnetRequest(
          'check_balance',
          {},
          data,
          response.status,
          responseTime
        )
      } catch (logError) {
        console.warn('Failed to log API call (non-blocking):', logError)
      }

      // Parse the actual Hubnet balance response structure
      const isSuccess = response.ok && data.status === 'success' && data.event === 'query.success'
      
      console.log('Hubnet balance raw response:', JSON.stringify(data, null, 2))
      
      const result = {
        status: isSuccess,
        balance: isSuccess ? data.data?.wallet_balance || 0 : 0,
        currency: "GHS", // Hubnet always returns GHS
        todaysSales: data.data?.["today's_sales"],
        totalSales: data.data?.total_sales,
        lastTopUp: data.data?.last_top_up_date,
      }
      
      console.log('Parsed balance result:', JSON.stringify(result, null, 2))
      
      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      console.error("Balance check error:", error)
      
      // Log the error (non-blocking)
      try {
        await ApiLogger.logHubnetError(
          'check_balance',
          {},
          error instanceof Error ? error : new Error('Unknown error')
        )
      } catch (logError) {
        console.warn('Failed to log error (non-blocking):', logError)
      }

      return {
        status: false,
        balance: 0,
        currency: "GHS",
      }
    }
  }

  async purchaseDataBundle(request: HubnetDataRequest): Promise<HubnetResponse> {
    const startTime = Date.now()
    
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
      const responseTime = Date.now() - startTime
      
      console.log("Hubnet API response:", data)

      // Log the API call
      await ApiLogger.logHubnetRequest(
        `${request.network}-new-transaction`,
        payload,
        data,
        response.status,
        responseTime,
        request.reference,
        request.network
      )

      return data
    } catch (error) {
      const responseTime = Date.now() - startTime
      console.error("Hubnet API error:", error)
      
      // Log the error
      await ApiLogger.logHubnetError(
        `${request.network}-new-transaction`,
        {
          phone: this.formatPhoneNumber(request.phoneNumber),
          volume: request.volumeMB.toString(),
          reference: request.reference,
        },
        error instanceof Error ? error : new Error('Unknown error'),
        request.reference,
        request.network
      )

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
        
        // Refresh balance after successful transaction to keep UI updated
        console.log("Refreshing Hubnet balance after successful transaction")
        try {
          await this.checkBalance()
        } catch (balanceError) {
          console.warn("Failed to refresh balance after successful transaction:", balanceError)
          // Don't fail the whole process for balance refresh errors
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
