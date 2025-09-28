import { type NextRequest, NextResponse } from "next/server"
import { telecomAPI } from "@/lib/telecom-api"

export const dynamic = 'force-dynamic'

// Endpoint to check transaction status with telecom APIs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const network = searchParams.get("network")
    const transactionId = searchParams.get("transactionId")

    if (!network || !transactionId) {
      return NextResponse.json({ error: "Network and transactionId parameters required" }, { status: 400 })
    }

    const result = await telecomAPI.checkTransactionStatus(network, transactionId)

    return NextResponse.json({
      success: result.success,
      network,
      transactionId,
      status: result.status,
      message: result.message,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 })
  }
}
