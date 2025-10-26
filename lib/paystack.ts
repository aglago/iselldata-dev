// Paystack payment integration for instant payment processing
interface PaystackInitializeData {
  email: string
  amount: number // in kobo (multiply by 100)
  reference: string
  callback_url?: string
  metadata?: {
    orderId: string
    customerName?: string
    packageSize: string
    network: string
    phoneNumber: string
  }
}

interface PaystackInitializeResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    id: number
    domain: string
    status: 'success' | 'failed' | 'abandoned'
    reference: string
    amount: number
    message: string
    gateway_response: string
    paid_at: string
    created_at: string
    channel: string
    currency: string
    ip_address: string
    metadata: any
    fees: number
    fees_split: any
    authorization: {
      authorization_code: string
      bin: string
      last4: string
      exp_month: string
      exp_year: string
      channel: string
      card_type: string
      bank: string
      country_code: string
      brand: string
      reusable: boolean
      signature: string
      account_name: string
    }
    customer: {
      id: number
      first_name: string
      last_name: string
      email: string
      customer_code: string
      phone: string
      metadata: any
      risk_action: string
      international_format_phone: string
    }
    plan: any
    order_id: any
    paidAt: string
    createdAt: string
    requested_amount: number
    pos_transaction_data: any
    source: any
    fees_breakdown: any
  }
}

export class PaystackAPI {
  private secretKey: string
  private baseUrl = 'https://api.paystack.co'

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    }
  }

  async initializeTransaction(data: PaystackInitializeData): Promise<PaystackInitializeResponse> {
    try {
      console.log('Initializing Paystack transaction:', {
        email: data.email,
        amount: data.amount,
        reference: data.reference
      })

      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      })

      const result = await response.json()
      console.log('Paystack initialize response:', result)

      if (!response.ok) {
        throw new Error(`Paystack API error: ${result.message || 'Unknown error'}`)
      }

      return result
    } catch (error) {
      console.error('Paystack initialization failed:', error)
      throw error
    }
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    try {
      console.log('Verifying Paystack transaction:', reference)

      const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      const result = await response.json()
      console.log('Paystack verify response:', result)

      if (!response.ok) {
        throw new Error(`Paystack API error: ${result.message || 'Unknown error'}`)
      }

      return result
    } catch (error) {
      console.error('Paystack verification failed:', error)
      throw error
    }
  }

  // Convert Ghana Cedis to Pesewas (Paystack uses pesewas for GHS)
  static toPesewas(cedis: number): number {
    return Math.round(cedis * 100)
  }

  // Convert Pesewas to Ghana Cedis
  static fromPesewas(pesewas: number): number {
    return pesewas / 100
  }

  // Generate unique reference
  static generateReference(prefix: string = 'PS'): string {
    const timestamp = Date.now().toString().slice(-8)
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}${timestamp}${randomId}`
  }
}

// Export singleton instance
export const paystackAPI = new PaystackAPI(process.env.PAYSTACK_SECRET_KEY || '')