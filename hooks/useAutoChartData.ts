"use client"

import { useEffect, useState } from "react"
import { TokenData } from "@/hooks/useWebSocket"
import { useCandlestickData } from "@/hooks/useCandlestickData"

// Hook to automatically fetch chart data for tokens with bonding curve keys
export const useAutoChartData = (tokens: TokenData[]) => {
  const [chartDataMap, setChartDataMap] = useState<Record<string, any>>({})
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

  // Filter tokens that have bonding curve keys
  const tokensWithCurves = tokens.filter(token => token.bondingCurveKey)

  useEffect(() => {
    // Auto-fetch chart data for tokens with bonding curve keys
    tokensWithCurves.forEach(token => {
      if (!chartDataMap[token.mint] && !loadingMap[token.mint]) {
        setLoadingMap(prev => ({ ...prev, [token.mint]: true }))
        
        // Delay to avoid overwhelming the API
        setTimeout(() => {
          fetchChartData(token)
        }, Math.random() * 2000) // Random delay 0-2 seconds
      }
    })
  }, [tokensWithCurves.length])

  const fetchChartData = async (token: TokenData) => {
    if (!token.bondingCurveKey) return

    try {
      const response = await fetch(
        `/api/candlesticks?poolAddress=${token.bondingCurveKey}&timeBucket=5m&limit=100`
      )
      
      if (response.ok) {
        const data = await response.json()
        setChartDataMap(prev => ({
          ...prev,
          [token.mint]: data.candlesticks || []
        }))
        console.log(`Chart data loaded for ${token.symbol}:`, data.candlesticks?.length, "candles")
      }
    } catch (error) {
      console.error(`Error fetching chart data for ${token.symbol}:`, error)
    } finally {
      setLoadingMap(prev => ({ ...prev, [token.mint]: false }))
    }
  }

  return {
    chartDataMap,
    loadingMap,
    refetchChart: (token: TokenData) => fetchChartData(token)
  }
}
