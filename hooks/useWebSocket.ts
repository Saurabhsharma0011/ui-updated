"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { PriceData } from "./usePriceData"
import { extractOrDeriveBondingCurve } from "@/lib/bondingCurve"


export interface TokenMetadata {
  name: string
  symbol: string
  description: string
  image: string
  twitter?: string
  telegram?: string
  website?: string
}

export interface TokenData {
  mint: string
  name: string
  symbol: string
  description: string
  image: string
  metadata_uri?: string
  creator: string
  bondingCurveKey?: string  // Added bonding curve key for OHLC data
  price?: string
  market_cap?: string
  market_cap_value?: number
  liquidity?: string
  created_timestamp: number
  twitter?: string
  telegram?: string
  website?: string
  category?: "new" | "bonding" | "graduated"
}

export const useWebSocket = () => {
  const [allTokens, setAllTokens] = useState<TokenData[]>([])
  const [newTokens, setNewTokens] = useState<TokenData[]>([])
  const [bondingTokens, setBondingTokens] = useState<TokenData[]>([])
  const [graduatedTokens, setGraduatedTokens] = useState<TokenData[]>([])
  const [trendingTokens, setTrendingTokens] = useState<TokenData[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [rawMessages, setRawMessages] = useState<any[]>([])

  const fetchTokenMetadata = useCallback(async (metadataUri: string): Promise<TokenMetadata | null> => {
    try {
      const response = await fetch(metadataUri)
      if (!response.ok) throw new Error("Failed to fetch metadata")

      const metadata = await response.json()
      return {
        name: metadata.name || "Unknown Token",
        symbol: metadata.symbol || "UNKNOWN",
        description: metadata.description || "",
        image: metadata.image || "/placeholder.svg?height=48&width=48",
        twitter: metadata.twitter || metadata.extensions?.twitter,
        telegram: metadata.telegram || metadata.extensions?.telegram,
        website: metadata.website || metadata.extensions?.website,
      }
    } catch (error) {
      console.error("Error fetching metadata:", error)
      return null
    }
  }, [])

  const categorizeToken = useCallback((marketCapValue: number): "new" | "bonding" | "graduated" => {
    if (marketCapValue >= 50000) {
      return "graduated"
    } else if (marketCapValue >= 10000) {
      return "bonding"
    } else {
      return "new"
    }
  }, [])

  const updateTokenCategories = useCallback((tokens: TokenData[]) => {
    const newTokensList: TokenData[] = []
    const bondingTokensList: TokenData[] = []
    const graduatedTokensList: TokenData[] = []
    
    // Create trending tokens list sorted by market cap (highest first)
    // Include tokens with market cap > 0 OR tokens that are newly created with price data
    let trendingTokensList = [...tokens]
      .filter(token => {
        // Include tokens with explicit market cap value
        if (token.market_cap_value && token.market_cap_value > 0) {
          return true
        }
        // Include newly created tokens with price data (calculate estimated market cap)
        if (token.price && token.created_timestamp > Date.now() - 24 * 60 * 60 * 1000) { // Last 24 hours
          return true
        }
        return false
      })
      .map(token => {
        // Calculate estimated market cap if not available but price exists
        let estimatedMarketCap = token.market_cap_value || 0
        if (!estimatedMarketCap && token.price) {
          const priceValue = typeof token.price === 'string' 
            ? parseFloat(token.price.replace('$', '')) 
            : token.price
          // Simple estimation: assume 1B token supply for market cap calculation
          estimatedMarketCap = priceValue * 1000000000
        }
        
        return {
          ...token,
          market_cap_value: estimatedMarketCap,
          market_cap: estimatedMarketCap > 0 ? `$${estimatedMarketCap.toLocaleString()}` : token.market_cap
        }
      })
      .sort((a, b) => (b.market_cap_value || 0) - (a.market_cap_value || 0))

    // If we don't have enough trending tokens with market cap data, 
    // add recently created tokens sorted by creation time
    if (trendingTokensList.length < 10) {
      const recentTokens = tokens
        .filter(token => {
          // Don't include tokens already in trending list
          return !trendingTokensList.some(t => t.mint === token.mint) &&
                 token.created_timestamp > Date.now() - 24 * 60 * 60 * 1000
        })
        .sort((a, b) => b.created_timestamp - a.created_timestamp)
        .slice(0, 20 - trendingTokensList.length)
        .map(token => ({
          ...token,
          market_cap_value: token.market_cap_value || 0
        }))

      trendingTokensList = [...trendingTokensList, ...recentTokens]
    }

    // Limit to top 50 tokens
    trendingTokensList = trendingTokensList.slice(0, 50)

    // Log trending tokens for debugging
    console.log('Trending tokens calculated:', trendingTokensList.map(t => ({
      symbol: t.symbol,
      marketCap: t.market_cap_value,
      price: t.price,
      isNew: t.created_timestamp > Date.now() - 24 * 60 * 60 * 1000,
      createdAt: new Date(t.created_timestamp).toLocaleString()
    })))

    tokens.forEach((token) => {
      switch (token.category) {
        case "bonding":
          bondingTokensList.push(token)
          break
        case "graduated":
          graduatedTokensList.push(token)
          break
        default:
          newTokensList.push(token)
          break
      }
    })

    setNewTokens(newTokensList)
    setBondingTokens(bondingTokensList)
    setGraduatedTokens(graduatedTokensList)
    setTrendingTokens(trendingTokensList)
  }, [])

  const processNewToken = useCallback(
    async (rawData: any) => {
      try {
        // Delay processing to allow APIs to catch up
        await new Promise((resolve) => setTimeout(resolve, 1000))

        console.log("Processing raw token data:", rawData)

        // Handle different possible data structures from pumpportal.fun
        let tokenInfo: any = {}

        // Check if it's a new token creation event
        if (rawData.type === "create" || rawData.method === "create" || rawData.txType === "create") {
          tokenInfo = rawData
        } else if (rawData.data && rawData.data.type === "create") {
          tokenInfo = rawData.data
        } else if (rawData.tokenData) {
          tokenInfo = rawData.tokenData
        } else {
          // Try to extract token info from various possible structures
          tokenInfo = rawData
        }

        // Extract token information from the raw data
        const mint = tokenInfo.mint || tokenInfo.token || tokenInfo.address || tokenInfo.ca
        const name = tokenInfo.name || tokenInfo.tokenName || "Unknown Token"
        const symbol = tokenInfo.symbol || tokenInfo.tokenSymbol || "UNKNOWN"

        // STEP 2: Extract or derive bondingCurveKey from token creation event
        const bondingCurveKey = extractOrDeriveBondingCurve(mint, rawData)

        console.log("Bonding curve result for", mint, ":", bondingCurveKey)
        
        // Additional logging for debugging
        if (bondingCurveKey) {
          console.log("✅ BONDING CURVE FOUND for", symbol, ":", bondingCurveKey)
        } else {
          console.log("❌ No bonding curve found for", symbol)
        }

        // Extract creator/trader information - prioritize traderpublickey
        const creator =
          tokenInfo.traderpublickey ||
          tokenInfo.traderPublicKey ||
          tokenInfo.trader_public_key ||
          tokenInfo.creator ||
          tokenInfo.user ||
          tokenInfo.deployer ||
          tokenInfo.authority ||
          "Unknown"

        const metadataUri = tokenInfo.uri || tokenInfo.metadata_uri || tokenInfo.metadataUri
        const signature = tokenInfo.signature || tokenInfo.txId || tokenInfo.transaction

        // Extract price and market data if available
        const initialPrice = tokenInfo.price || tokenInfo.initialPrice || tokenInfo.sol_amount || tokenInfo.priceInSol
        const marketCap = tokenInfo.market_cap || tokenInfo.marketCap || tokenInfo.fdv || tokenInfo.usd_market_cap || tokenInfo.mcap
        const liquidity = tokenInfo.liquidity || tokenInfo.liquidityPool || tokenInfo.liquidityUsd

        // Parse market cap value for categorization
        let marketCapValue = 0
        if (marketCap) {
          if (typeof marketCap === "number") {
            marketCapValue = marketCap
          } else if (typeof marketCap === "string") {
            // Remove $ and commas, then parse
            const cleanMarketCap = marketCap.replace(/[$,]/g, "")
            marketCapValue = Number.parseFloat(cleanMarketCap) || 0
          }
        }

        // If no market cap but we have price, try to calculate estimated market cap
        if (!marketCapValue && initialPrice) {
          const priceValue = typeof initialPrice === 'string' 
            ? parseFloat(initialPrice.replace('$', '')) 
            : initialPrice
          if (priceValue > 0) {
            // Use token supply data if available, otherwise estimate with 1B supply
            const tokenSupply = tokenInfo.supply || tokenInfo.totalSupply || 1000000000
            marketCapValue = priceValue * tokenSupply
          }
        }

        console.log("Market cap extraction:", {
          rawMarketCap: marketCap,
          rawPrice: initialPrice,
          calculatedMarketCap: marketCapValue,
          tokenSupply: tokenInfo.supply || tokenInfo.totalSupply || "estimated 1B"
        })

        // Get timestamp
        const timestamp = tokenInfo.timestamp || tokenInfo.blockTime || tokenInfo.created_timestamp || Date.now()

        if (!mint) {
          console.log("No mint address found in token data, skipping...")
          return
        }

        let metadata: TokenMetadata | null = null

        // Try to fetch metadata if URI is provided
        if (metadataUri) {
          console.log("Fetching metadata from:", metadataUri)
          metadata = await fetchTokenMetadata(metadataUri)
        }

        // Determine token category based on market cap
        const category = categorizeToken(marketCapValue)

        console.log("Available fields in token data:", Object.keys(tokenInfo))
        console.log("Market cap value:", marketCapValue, "Category:", category)

        const newToken: TokenData = {
          mint: mint,
          name: metadata?.name || name,
          symbol: metadata?.symbol || symbol,
          description: metadata?.description || tokenInfo.description || "",
          image: metadata?.image || "/placeholder.svg?height=48&width=48",
          metadata_uri: metadataUri,
          creator: creator,
          bondingCurveKey: bondingCurveKey || undefined, // Store the bonding curve key
          created_timestamp: typeof timestamp === "number" ? timestamp : Date.now(),
          price: initialPrice ? `$${Number.parseFloat(initialPrice).toFixed(6)}` : undefined,
          market_cap: marketCap ? `$${marketCapValue.toLocaleString()}` : undefined,
          market_cap_value: marketCapValue,
          liquidity: liquidity ? `$${Number.parseFloat(liquidity).toFixed(2)}` : undefined,
          twitter: metadata?.twitter,
          telegram: metadata?.telegram,
          website: metadata?.website,
          category: category,
        }

        console.log("Processed new token:", newToken)

        setAllTokens((prev) => {
          const updated = [newToken, ...prev.slice(0, 149)] // Keep only latest 150 tokens
          updateTokenCategories(updated)
          return updated
        })
      } catch (error) {
        console.error("Error processing new token:", error)
      }
    },
    [fetchTokenMetadata, categorizeToken, updateTokenCategories],
  )

  // Function to update token categories when price data changes
  const updateTokenWithPriceData = useCallback(
    (mint: string, priceData: PriceData) => {
      setAllTokens((prev) => {
        const updated = prev.map((token) => {
          if (token.mint === mint && priceData.marketCap) {
            const newMarketCapValue = priceData.marketCap
            const newCategory = categorizeToken(newMarketCapValue)

            return {
              ...token,
              market_cap: `$${newMarketCapValue.toLocaleString()}`,
              market_cap_value: newMarketCapValue,
              category: newCategory,
              price: `$${priceData.price.toFixed(6)}`,
              liquidity: priceData.liquidity ? `$${priceData.liquidity.toLocaleString()}` : token.liquidity,
            }
          }
          return token
        })

        updateTokenCategories(updated)
        return updated
      })
    },
    [categorizeToken, updateTokenCategories],
  )

  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket("wss://pumpportal.fun/api/data")
      wsRef.current = ws

      ws.onopen = () => {
        console.log("WebSocket connected")
        setIsConnected(true)
        setError(null)

        // Subscribe to new token creation events
        const payload = {
          method: "subscribeNewToken",
        }
        ws.send(JSON.stringify(payload))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log("Received WebSocket data:", data)
          
          // STEP 1: Listen to WebSocket messages from pump.fun
          console.log("Raw WebSocket message structure:", {
            keys: Object.keys(data),
            hasAccountsArray: Array.isArray(data.accounts),
            hasInstructionData: !!data.instructionData,
            hasBondingCurve: !!(data.bondingCurveKey || data.bonding_curve_key || data.curve),
            fullMessage: data
          })

          setRawMessages((prev) => [data, ...prev.slice(0, 19)]) // Keep latest 20 messages

          // Process different types of messages for new tokens
          const isNewToken =
            data.type === "create" ||
            data.method === "create" ||
            data.txType === "create" ||
            (data.data && data.data.type === "create") ||
            data.tokenData ||
            (data.method === "subscribeNewToken" && data.data) ||
            // Check for pump.fun specific structures
            (data.mint && data.creator) ||
            (data.token && data.user)

          if (isNewToken) {
            console.log("Detected new token creation with structure:", {
              mint: data.mint || data.token || data.address || data.ca,
              bondingCurveKey: data.bondingCurveKey || data.bonding_curve_key || data.curve,
              accounts: data.accounts,
              fullData: data
            })
            processNewToken(data)
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setError("WebSocket connection error")
        setIsConnected(false)
      }

      ws.onclose = () => {
        console.log("WebSocket disconnected")
        setIsConnected(false)

        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            connectWebSocket()
          }
        }, 5000)
      }
    } catch (error) {
      console.error("Error connecting to WebSocket:", error)
      setError("Failed to connect to WebSocket")
    }
  }, [processNewToken])

  useEffect(() => {
    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connectWebSocket])

  return {
    allTokens,
    newTokens,
    bondingTokens,
    graduatedTokens,
    trendingTokens,
    isConnected,
    error,
    rawMessages,
    updateTokenWithPriceData,
  }
}
