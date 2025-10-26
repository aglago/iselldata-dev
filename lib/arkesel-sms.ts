// Arkesel SMS API integration
interface ArkeselSMSResponse {
  status: string
  message: string
  data?: any
}

interface SMSMessage {
  to: string
  message: string
}

export class ArkeselSMS {
  private apiKey: string
  private baseUrl = "https://sms.arkesel.com/api/v2/sms"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async sendSMS({ to, message }: SMSMessage): Promise<ArkeselSMSResponse> {
    try {
      console.log("Sending SMS via Arkesel:", { to, message: message.substring(0, 50) + "..." })

      const response = await fetch(`${this.baseUrl}/send`, {
        method: "POST",
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: process.env.SMS_SENDER_ID || "iSellData", // Your sender ID
          message: message,
          recipients: [to],
        }),
      })

      const data = await response.json()
      console.log("Arkesel SMS response:", data)

      if (!response.ok) {
        throw new Error(`SMS API error: ${data.message || "Unknown error"}`)
      }

      return {
        status: "success",
        message: "SMS sent successfully",
        data: data,
      }
    } catch (error) {
      console.error("SMS sending failed:", error)
      return {
        status: "error",
        message: error instanceof Error ? error.message : "SMS sending failed",
      }
    }
  }

  async sendOrderConfirmation(phone: string, trackingId: string, packageSize: string, network: string, baseUrl?: string) {
    const trackingUrl = baseUrl ? `${baseUrl}/track/${trackingId}` : `https://iselldata.vercel.app/track/${trackingId}`
    const message = `Your ${packageSize} ${network.toUpperCase()} data order has been received and is being processed! Tracking ID: ${trackingId}. Delivery in 15-30 mins. Track: ${trackingUrl} | Support: 050 958 1027`
    return this.sendSMS({ to: phone, message })
  }

  async sendDeliveryFailure(phone: string, trackingId: string, packageSize: string, network: string) {
    const message = `Your ${packageSize} ${network.toUpperCase()} data order needs attention. Tracking ID: ${trackingId}. Please contact us at 050 958 1027 for assistance.`
    return this.sendSMS({ to: phone, message })
  }
}

// Export singleton instance
export const smsService = new ArkeselSMS(process.env.SMS_API_KEY || "")
