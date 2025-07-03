import { PublicKey } from "@solana/web3.js"

// Pump.fun program constants
const PUMP_FUN_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
const PUMP_FUN_CURVE_SEED = "bonding-curve"

/**
 * Derives the bonding curve address for a pump.fun token
 * This is a deterministic derivation based on the mint address
 */
export function deriveBondingCurveAddress(mintAddress: string): string | null {
  try {
    const mintPublicKey = new PublicKey(mintAddress)
    const programPublicKey = new PublicKey(PUMP_FUN_PROGRAM_ID)
    
    // Derive the bonding curve PDA
    const [bondingCurveAddress] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(PUMP_FUN_CURVE_SEED),
        mintPublicKey.toBuffer(),
      ],
      programPublicKey
    )
    
    return bondingCurveAddress.toBase58()
  } catch (error) {
    console.error("Error deriving bonding curve address:", error)
    return null
  }
}

/**
 * Validates if a string is a valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

/**
 * Attempts to extract or derive bonding curve address from various sources
 */
export function extractOrDeriveBondingCurve(
  mintAddress: string, 
  rawData: any
): string | null {
  // First try to extract from raw data
  const extractedCurve = 
    rawData.bondingCurveKey ||
    rawData.bonding_curve_key ||
    rawData.bondingCurve ||
    rawData.bonding_curve ||
    rawData.curve ||
    rawData.curveKey ||
    rawData.curve_key ||
    rawData.curveAddress ||
    rawData.curve_address

  if (extractedCurve && isValidSolanaAddress(extractedCurve)) {
    return extractedCurve
  }

  // Try to derive it deterministically
  const derivedCurve = deriveBondingCurveAddress(mintAddress)
  if (derivedCurve) {
    console.log(`Derived bonding curve for ${mintAddress}: ${derivedCurve}`)
    return derivedCurve
  }

  return null
}
