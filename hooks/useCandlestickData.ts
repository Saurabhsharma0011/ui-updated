"use client"

import { useState, useEffect, useCallback } from "react"

export interface CandlestickData {
  timestamp: number
  open: string
  high: string
  low: string
  close: string
  volume: string
}

export interface CandlesticksResponse {
  candlesticks: CandlestickData[]
}

export const useCandlestickData = (poolAddress?: string, timeBucket: string = "1s") => {
  const [data, setData] = useState<CandlestickData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [debugInfo, setDebugInfo] = useState<{
    url?: string
    responseStatus?: number
    responseData?: any
    rawError?: any
  }>({})

  const fetchCandlesticks = useCallback(async () => {
    if (!poolAddress) {
      setData([])
      setError(null)
      setDebugInfo({})
      return
    }

    console.log(`[useCandlestickData] Fetching data for pool: ${poolAddress}, timeBucket: ${timeBucket}`)
    
    setIsLoading(true)
    setError(null)
    setLastFetch(new Date())

    try {
      const url = `/api/candlesticks?poolAddress=${poolAddress}&timeBucket=${timeBucket}`
      setDebugInfo(prev => ({ ...prev, url }))
      
      const response = await fetch(url)
      
      setDebugInfo(prev => ({ ...prev, responseStatus: response.status }))

      if (!response.ok) {
        const errorData = await response.json()
        setDebugInfo(prev => ({ ...prev, responseData: errorData }))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch candlestick data`)
      }

      const result: CandlesticksResponse = await response.json()
      setDebugInfo(prev => ({ ...prev, responseData: result }))
      
      console.log(`[useCandlestickData] Received ${result.candlesticks?.length || 0} candlesticks`)
      
      // Validate candlesticks array
      if (!result.candlesticks || !Array.isArray(result.candlesticks)) {
        throw new Error("Invalid response format: candlesticks array not found")
      }
      
      // Sort candlesticks by timestamp in ascending order (oldest first)
      const sortedData = result.candlesticks.sort((a, b) => a.timestamp - b.timestamp)
      
      setData(sortedData)
      setError(null)
    } catch (err) {
      console.error("[useCandlestickData] Error fetching candlestick data:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch data"
      setError(errorMessage)
      setData([])
      setDebugInfo(prev => ({ ...prev, rawError: err }))
    } finally {
      setIsLoading(false)
    }
  }, [poolAddress, timeBucket])

  useEffect(() => {
    fetchCandlesticks()
  }, [fetchCandlesticks])

  const refetch = useCallback(() => {
    console.log(`[useCandlestickData] Manual refetch requested for pool: ${poolAddress}`)
    fetchCandlesticks()
  }, [fetchCandlesticks])

  return {
    data,
    isLoading,
    error,
    refetch,
    lastFetch,
    debugInfo,
  }
}
