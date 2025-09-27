// Hubnet pricing lookup based on network and package size
// Data sourced from hubnet-prices.md

interface PricingTier {
  size: number // in GB
  mtn: number // price in GHS
  at: number  // price in GHS (AirtelTigo)
}

// Pricing tiers for both networks
const PRICING_TIERS: PricingTier[] = [
  { size: 1, mtn: 4.5, at: 3.7 },
  { size: 2, mtn: 9, at: 7.4 },
  { size: 3, mtn: 13, at: 11.1 },
  { size: 4, mtn: 18, at: 14.8 },
  { size: 5, mtn: 22, at: 18.5 },
  { size: 6, mtn: 26, at: 22.2 },
  { size: 7, mtn: 0, at: 25.9 }, // MTN doesn't have 7GB
  { size: 8, mtn: 34, at: 29.6 },
  { size: 9, mtn: 0, at: 33.3 }, // MTN doesn't have 9GB
  { size: 10, mtn: 42, at: 37 },
  { size: 12, mtn: 0, at: 44.4 }, // MTN doesn't have 12GB
  { size: 15, mtn: 59, at: 55.5 },
  { size: 20, mtn: 78, at: 74 },
  { size: 25, mtn: 97, at: 92.5 },
  { size: 30, mtn: 118, at: 111 },
  { size: 40, mtn: 158, at: 148 },
  { size: 50, mtn: 195, at: 185 },
  { size: 100, mtn: 390, at: 370 },
]

/**
 * Get the exact Hubnet cost for a specific package size and network
 * @param network - The network (mtn, airteltigo, telecel)
 * @param packageSizeGB - Package size in GB
 * @returns Price in GHS, or null if not available
 */
export function getHubnetCost(network: string, packageSizeGB: number): number | null {
  // Telecel is handled manually, not through Hubnet
  if (network.toLowerCase() === 'telecel') {
    return null
  }
  
  const networkKey = network.toLowerCase() === 'mtn' ? 'mtn' : 'at'
  
  // Find exact matching tier
  const tier = PRICING_TIERS.find(t => t.size === packageSizeGB)
  
  if (!tier) {
    console.warn(`No pricing data found for ${packageSizeGB}GB on ${network}`)
    return null
  }
  
  const price = tier[networkKey]
  
  // Return null if this network doesn't support this package size
  if (price === 0) {
    console.warn(`${network.toUpperCase()} doesn't support ${packageSizeGB}GB packages`)
    return null
  }
  
  return price
}

/**
 * Get all available package sizes for a specific network
 * @param network - The network (mtn, airteltigo)
 * @returns Array of available package sizes in GB
 */
export function getAvailablePackageSizes(network: string): number[] {
  if (network.toLowerCase() === 'telecel') {
    return [] // Telecel handled manually
  }
  
  const networkKey = network.toLowerCase() === 'mtn' ? 'mtn' : 'at'
  
  return PRICING_TIERS
    .filter(tier => tier[networkKey] > 0)
    .map(tier => tier.size)
}

/**
 * Estimate cost with fallback for unknown package sizes
 * @param network - The network
 * @param packageSizeGB - Package size in GB
 * @returns Estimated price in GHS
 */
export function estimateHubnetCost(network: string, packageSizeGB: number): number {
  const exactCost = getHubnetCost(network, packageSizeGB)
  
  if (exactCost !== null) {
    return exactCost
  }
  
  // Fallback: estimate based on average cost per GB
  const networkKey = network.toLowerCase() === 'mtn' ? 'mtn' : 'at'
  const avgCostPerGB = networkKey === 'mtn' ? 4.2 : 3.7 // Rough averages
  
  console.warn(`Using estimated cost for ${packageSizeGB}GB on ${network}: ${avgCostPerGB * packageSizeGB} GHS`)
  return avgCostPerGB * packageSizeGB
}