// Telecom API integration for MTN, AirtelTigo, and Telecel
interface DataBundleRequest {
  network: string
  phoneNumber: string
  packageId: string
  amount: number
  orderId: string
}

interface ApiResponse {
  success: boolean
  transactionId?: string
  message: string
  status?: "pending" | "completed" | "failed"
}

class TelecomAPIClient {
  private baseUrls = {
    mtn: process.env.MTN_API_BASE_URL || "https://api.mtn.com.gh/v1",
    airteltigo: process.env.AIRTELTIGO_API_BASE_URL || "https://api.airteltigo.com.gh/v1",
    telecel: process.env.TELECEL_API_BASE_URL || "https://api.telecel.com.gh/v1",
  }

  private apiKeys = {
    mtn: process.env.MTN_API_KEY || "",
    airteltigo: process.env.AIRTELTIGO_API_KEY || "",
    telecel: process.env.TELECEL_API_KEY || "",
  }

  private getNetworkConfig(network: string) {
    const configs = {
      mtn: {
        baseUrl: this.baseUrls.mtn,
        apiKey: this.apiKeys.mtn,
        endpoint: "/data-bundles/purchase",
        headers: {
          Authorization: `Bearer ${this.apiKeys.mtn}`,
          "Content-Type": "application/json",
          "X-API-Version": "1.0",
        },
      },
      airteltigo: {
        baseUrl: this.baseUrls.airteltigo,
        apiKey: this.apiKeys.airteltigo,
        endpoint: "/bundles/data/purchase",
        headers: {
          Authorization: `ApiKey ${this.apiKeys.airteltigo}`,
          "Content-Type": "application/json",
        },
      },
      telecel: {
        baseUrl: this.baseUrls.telecel,
        apiKey: this.apiKeys.telecel,
        endpoint: "/data/purchase",
        headers: {
          "X-API-Key": this.apiKeys.telecel,
          "Content-Type": "application/json",
        },
      },
    }

    return configs[network as keyof typeof configs]
  }

  async purchaseDataBundle(request: DataBundleRequest): Promise<ApiResponse> {
    const config = this.getNetworkConfig(request.network)

    if (!config || !config.apiKey) {
      return {
        success: false,
        message: `API configuration missing for ${request.network}`,
      }
    }

    try {
      const payload = this.formatRequestPayload(request)

      const response = await fetch(`${config.baseUrl}${config.endpoint}`, {
        method: "POST",
        headers: config.headers,
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          transactionId: data.transactionId || data.reference || data.id,
          message: "Data bundle purchase initiated successfully",
          status: data.status || "pending",
        }
      } else {
        return {
          success: false,
          message: data.message || `Failed to purchase data bundle: ${response.status}`,
        }
      }
    } catch (error) {
      console.error(`API Error for ${request.network}:`, error)
      return {
        success: false,
        message: `Network error: Unable to connect to ${request.network} API`,
      }
    }
  }

  private formatRequestPayload(request: DataBundleRequest) {
    // Format payload based on network requirements
    const basePayload = {
      phoneNumber: this.formatPhoneNumber(request.phoneNumber),
      amount: request.amount,
      reference: request.orderId,
    }

    switch (request.network) {
      case "mtn":
        return {
          ...basePayload,
          msisdn: basePayload.phoneNumber,
          product_code: request.packageId,
          channel: "web",
        }
      case "airteltigo":
        return {
          ...basePayload,
          recipient: basePayload.phoneNumber,
          bundle_id: request.packageId,
          source: "web_portal",
        }
      case "telecel":
        return {
          ...basePayload,
          subscriber: basePayload.phoneNumber,
          package_id: request.packageId,
          platform: "web",
        }
      default:
        return basePayload
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Convert Ghana phone numbers to international format
    let cleaned = phone.replace(/\s+/g, "")

    if (cleaned.startsWith("0")) {
      cleaned = "+233" + cleaned.substring(1)
    } else if (!cleaned.startsWith("+233")) {
      cleaned = "+233" + cleaned
    }

    return cleaned
  }

  async checkTransactionStatus(network: string, transactionId: string): Promise<ApiResponse> {
    const config = this.getNetworkConfig(network)

    if (!config) {
      return {
        success: false,
        message: `Configuration missing for ${network}`,
      }
    }

    try {
      const statusEndpoint = `/transactions/${transactionId}/status`
      const response = await fetch(`${config.baseUrl}${statusEndpoint}`, {
        method: "GET",
        headers: config.headers,
      })

      const data = await response.json()

      return {
        success: response.ok,
        transactionId,
        message: data.message || "Status check completed",
        status: data.status || "unknown",
      }
    } catch (error) {
      console.error(`Status check error for ${network}:`, error)
      return {
        success: false,
        message: "Failed to check transaction status",
      }
    }
  }

  // Get available packages from each network
  async getAvailablePackages(network: string) {
    const config = this.getNetworkConfig(network)

    if (!config) {
      return { success: false, packages: [] }
    }

    try {
      const response = await fetch(`${config.baseUrl}/packages`, {
        method: "GET",
        headers: config.headers,
      })

      const data = await response.json()

      return {
        success: response.ok,
        packages: data.packages || [],
      }
    } catch (error) {
      console.error(`Failed to fetch packages for ${network}:`, error)
      return { success: false, packages: [] }
    }
  }
}

export const telecomAPI = new TelecomAPIClient()
