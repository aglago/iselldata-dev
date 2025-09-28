import { NextResponse } from "next/server"
import { apiMonitor } from "@/lib/api-monitor"

export const dynamic = 'force-dynamic'

// Health check endpoint for monitoring API status
export async function GET() {
  try {
    const healthChecks = await apiMonitor.checkAllNetworks()

    const overallStatus = healthChecks.every((check) => check.status === "healthy")
      ? "healthy"
      : healthChecks.some((check) => check.status === "healthy")
        ? "degraded"
        : "down"

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      networks: healthChecks,
      summary: {
        total: healthChecks.length,
        healthy: healthChecks.filter((c) => c.status === "healthy").length,
        degraded: healthChecks.filter((c) => c.status === "degraded").length,
        down: healthChecks.filter((c) => c.status === "down").length,
      },
    })
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        status: "down",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 500 },
    )
  }
}
