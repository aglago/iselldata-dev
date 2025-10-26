import { createClient } from '@/lib/supabase/server'

interface ApiLogData {
  endpoint: string
  method?: string
  requestData?: any
  responseData?: any
  responseStatus?: number
  responseTimeMs?: number
  success: boolean
  errorMessage?: string
  orderId?: string
  network?: string
}

export class ApiLogger {
  private static async log(data: ApiLogData) {
    try {
      const supabase = await createClient()
      
      const logEntry = {
        endpoint: data.endpoint,
        method: data.method || 'POST',
        request_data: data.requestData || null,
        response_data: data.responseData || null,
        response_status: data.responseStatus || null,
        response_time_ms: data.responseTimeMs || null,
        success: data.success,
        error_message: data.errorMessage || null,
        order_id: data.orderId || null,
        network: data.network || null,
      }

      const { error } = await supabase
        .from('api_logs')
        .insert(logEntry)

      if (error) {
        // Temporarily suppress RLS errors - API logging is not critical
        if (error.code !== '42501') {
          console.error('Failed to log API call:', error)
        }
      }
    } catch (error) {
      console.error('API logger error:', error)
    }
  }

  static async logHubnetRequest(
    endpoint: string,
    requestData: any,
    responseData: any,
    responseStatus: number,
    responseTimeMs: number,
    orderId?: string,
    network?: string
  ) {
    const success = responseStatus >= 200 && responseStatus < 300
    
    await this.log({
      endpoint: `hubnet:${endpoint}`,
      method: 'POST',
      requestData,
      responseData,
      responseStatus,
      responseTimeMs,
      success,
      errorMessage: !success ? (responseData?.message || `HTTP ${responseStatus}`) : undefined,
      orderId,
      network
    })
  }

  static async logHubnetError(
    endpoint: string,
    requestData: any,
    error: Error,
    orderId?: string,
    network?: string
  ) {
    await this.log({
      endpoint: `hubnet:${endpoint}`,
      method: 'POST',
      requestData,
      success: false,
      errorMessage: error.message,
      orderId,
      network
    })
  }

  static async logOGatewayRequest(
    endpoint: string,
    requestData: any,
    responseData: any,
    responseStatus: number,
    responseTimeMs: number,
    orderId?: string
  ) {
    const success = responseStatus >= 200 && responseStatus < 300
    
    await this.log({
      endpoint: `ogateway:${endpoint}`,
      method: 'POST',
      requestData,
      responseData,
      responseStatus,
      responseTimeMs,
      success,
      errorMessage: !success ? (responseData?.message || `HTTP ${responseStatus}`) : undefined,
      orderId
    })
  }
}