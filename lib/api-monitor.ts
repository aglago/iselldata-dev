// API monitoring and health check utilities
interface ApiHealthStatus {
  network: string
  status: "healthy" | "degraded" | "down"
  responseTime: number
  lastChecked: string
  errorRate: number
}

class ApiMonitor {
  private healthStatus: Map<string, ApiHealthStatus> = new Map()

  async checkNetworkHealth(network: string): Promise<ApiHealthStatus> {
    const startTime = Date.now()

    try {
      // Simple health check - attempt to fetch packages
      const response = await fetch(`/api/telecom/packages?network=${network}`)
      const responseTime = Date.now() - startTime

      const status: ApiHealthStatus = {
        network,
        status: response.ok ? "healthy" : "degraded",
        responseTime,
        lastChecked: new Date().toISOString(),
        errorRate: response.ok ? 0 : 1,
      }

      this.healthStatus.set(network, status)
      return status
    } catch (error) {
      const responseTime = Date.now() - startTime

      const status: ApiHealthStatus = {
        network,
        status: "down",
        responseTime,
        lastChecked: new Date().toISOString(),
        errorRate: 1,
      }

      this.healthStatus.set(network, status)
      return status
    }
  }

  async checkAllNetworks(): Promise<ApiHealthStatus[]> {
    const networks = ["mtn", "airteltigo", "telecel"]
    const results = await Promise.all(networks.map((network) => this.checkNetworkHealth(network)))

    return results
  }

  getHealthStatus(network: string): ApiHealthStatus | null {
    return this.healthStatus.get(network) || null
  }

  getAllHealthStatus(): ApiHealthStatus[] {
    return Array.from(this.healthStatus.values())
  }
}

export const apiMonitor = new ApiMonitor()
