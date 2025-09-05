import { type NextRequest, NextResponse } from "next/server"
import { telecomAPI } from "@/lib/telecom-api"

// Endpoint to fetch live packages from telecom APIs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const network = searchParams.get("network")

    if (!network) {
      return NextResponse.json({ error: "Network parameter required" }, { status: 400 })
    }

    const result = await telecomAPI.getAvailablePackages(network)

    if (result.success) {
      return NextResponse.json({
        success: true,
        network,
        packages: result.packages,
        lastUpdated: new Date().toISOString(),
      })
    } else {
      // Fallback to static packages if API fails
      const staticPackages = getStaticPackages(network)
      return NextResponse.json({
        success: true,
        network,
        packages: staticPackages,
        source: "static",
        lastUpdated: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Package fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 })
  }
}

function getStaticPackages(network: string) {
  const packages = {
    mtn: [
      { id: "1GB_1DAY", size: "1GB", price: 5, duration: "1 Day", popular: false },
      { id: "2GB_3DAYS", size: "2GB", price: 8, duration: "3 Days", popular: true },
      { id: "5GB_7DAYS", size: "5GB", price: 15, duration: "7 Days", popular: false },
      { id: "10GB_30DAYS", size: "10GB", price: 25, duration: "30 Days", popular: false },
      { id: "20GB_30DAYS", size: "20GB", price: 45, duration: "30 Days", popular: false },
      { id: "50GB_30DAYS", size: "50GB", price: 100, duration: "30 Days", popular: false },
    ],
    airteltigo: [
      { id: "1GB_1DAY", size: "1GB", price: 4.5, duration: "1 Day", popular: false },
      { id: "2GB_3DAYS", size: "2GB", price: 7.5, duration: "3 Days", popular: true },
      { id: "5GB_7DAYS", size: "5GB", price: 14, duration: "7 Days", popular: false },
      { id: "10GB_30DAYS", size: "10GB", price: 24, duration: "30 Days", popular: false },
      { id: "25GB_30DAYS", size: "25GB", price: 50, duration: "30 Days", popular: false },
      { id: "60GB_30DAYS", size: "60GB", price: 110, duration: "30 Days", popular: false },
    ],
    telecel: [
      { id: "1GB_1DAY", size: "1GB", price: 5.5, duration: "1 Day", popular: false },
      { id: "2GB_3DAYS", size: "2GB", price: 9, duration: "3 Days", popular: true },
      { id: "5GB_7DAYS", size: "5GB", price: 16, duration: "7 Days", popular: false },
      { id: "10GB_30DAYS", size: "10GB", price: 26, duration: "30 Days", popular: false },
      { id: "20GB_30DAYS", size: "20GB", price: 48, duration: "30 Days", popular: false },
      { id: "40GB_30DAYS", size: "40GB", price: 90, duration: "30 Days", popular: false },
    ],
  }

  return packages[network as keyof typeof packages] || []
}
