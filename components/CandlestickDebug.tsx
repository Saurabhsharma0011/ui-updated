"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react"
import { useCandlestickData, CandlestickData } from "@/hooks/useCandlestickData"

interface CandlestickDebugProps {
  poolAddress?: string
  timeBucket?: string
  tokenSymbol?: string
}

export const CandlestickDebug = ({ 
  poolAddress, 
  timeBucket = "1s", 
  tokenSymbol = "TOKEN" 
}: CandlestickDebugProps) => {
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})
  
  const {
    data: candlestickData,
    isLoading,
    error,
    refetch,
  } = useCandlestickData(poolAddress, timeBucket)

  // Test direct API call
  const testDirectAPI = async () => {
    if (!poolAddress) return
    
    try {
      setApiError(null)
      const response = await fetch(`/api/candlesticks?poolAddress=${poolAddress}&timeBucket=${timeBucket}`)
      const data = await response.json()
      
      if (!response.ok) {
        setApiError(data.error || `API Error: ${response.status}`)
        setApiResponse(null)
      } else {
        setApiResponse(data)
        setApiError(null)
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unknown API error")
      setApiResponse(null)
    }
  }

  // Test MEVX API directly
  const testMEVXAPI = async () => {
    if (!poolAddress) return
    
    try {
      const endTime = Math.floor(Date.now() / 1000)
      const url = `https://api.mevx.io/api/v1/candlesticks?chain=sol&poolAddress=${poolAddress}&timeBucket=${timeBucket}&endTime=${endTime}&outlier=true&limit=100`
      
      setDebugInfo({ ...debugInfo, mevxUrl: url, testing: true })
      
      const response = await fetch(url)
      const data = await response.json()
      
      setDebugInfo({ 
        ...debugInfo, 
        mevxUrl: url, 
        mevxResponse: data,
        mevxStatus: response.status,
        testing: false
      })
    } catch (err) {
      setDebugInfo({ 
        ...debugInfo, 
        mevxError: err instanceof Error ? err.message : "Unknown MEVX error",
        testing: false 
      })
    }
  }

  useEffect(() => {
    if (poolAddress) {
      testDirectAPI()
    }
  }, [poolAddress, timeBucket])

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getStatusIcon = (hasData: boolean, isLoading: boolean, hasError: boolean) => {
    if (isLoading) return <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
    if (hasError) return <XCircle className="w-4 h-4 text-red-400" />
    if (hasData) return <CheckCircle className="w-4 h-4 text-green-400" />
    return <AlertTriangle className="w-4 h-4 text-yellow-400" />
  }

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            Candlestick Chart Debug - {tokenSymbol}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Pool Address</p>
              <p className="text-white text-sm font-mono break-all">
                {poolAddress || <span className="text-red-400">Not provided</span>}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Time Bucket</p>
              <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                {timeBucket}
              </Badge>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Status</p>
              <div className="flex items-center gap-2">
                {getStatusIcon(candlestickData.length > 0, isLoading, !!error)}
                <span className="text-sm text-slate-300">
                  {isLoading ? "Loading..." : 
                   error ? "Error" : 
                   candlestickData.length > 0 ? "Data Available" : "No Data"}
                </span>
              </div>
            </div>
          </div>

          {/* Hook Results */}
          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-white font-semibold mb-2">useCandlestickData Hook Results</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-slate-400 text-xs">Data Points</p>
                <p className="text-white font-semibold">{candlestickData.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Loading</p>
                <p className="text-white font-semibold">{isLoading ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Error</p>
                <p className={`font-semibold ${error ? "text-red-400" : "text-green-400"}`}>
                  {error || "None"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Last Update</p>
                <p className="text-white text-xs">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          {/* Sample Data */}
          {candlestickData.length > 0 && (
            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-white font-semibold mb-2">Sample Data (First & Last)</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-800 p-3 rounded">
                  <p className="text-green-400 text-xs font-semibold mb-2">FIRST CANDLE</p>
                  <div className="space-y-1 text-xs">
                    <p><span className="text-slate-400">Time:</span> <span className="text-white">{formatTimestamp(candlestickData[0].timestamp)}</span></p>
                    <p><span className="text-slate-400">Open:</span> <span className="text-white">${candlestickData[0].open}</span></p>
                    <p><span className="text-slate-400">High:</span> <span className="text-white">${candlestickData[0].high}</span></p>
                    <p><span className="text-slate-400">Low:</span> <span className="text-white">${candlestickData[0].low}</span></p>
                    <p><span className="text-slate-400">Close:</span> <span className="text-white">${candlestickData[0].close}</span></p>
                    <p><span className="text-slate-400">Volume:</span> <span className="text-white">${candlestickData[0].volume}</span></p>
                  </div>
                </div>
                <div className="bg-slate-800 p-3 rounded">
                  <p className="text-blue-400 text-xs font-semibold mb-2">LATEST CANDLE</p>
                  <div className="space-y-1 text-xs">
                    <p><span className="text-slate-400">Time:</span> <span className="text-white">{formatTimestamp(candlestickData[candlestickData.length - 1].timestamp)}</span></p>
                    <p><span className="text-slate-400">Open:</span> <span className="text-white">${candlestickData[candlestickData.length - 1].open}</span></p>
                    <p><span className="text-slate-400">High:</span> <span className="text-white">${candlestickData[candlestickData.length - 1].high}</span></p>
                    <p><span className="text-slate-400">Low:</span> <span className="text-white">${candlestickData[candlestickData.length - 1].low}</span></p>
                    <p><span className="text-slate-400">Close:</span> <span className="text-white">${candlestickData[candlestickData.length - 1].close}</span></p>
                    <p><span className="text-slate-400">Volume:</span> <span className="text-white">${candlestickData[candlestickData.length - 1].volume}</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Response Debug */}
          {apiResponse && (
            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-white font-semibold mb-2">API Response Debug</h4>
              <div className="bg-slate-800 p-3 rounded overflow-x-auto">
                <pre className="text-xs text-slate-300">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* API Error */}
          {apiError && (
            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-red-400 font-semibold mb-2">API Error</h4>
              <div className="bg-red-950 border border-red-800 p-3 rounded">
                <p className="text-red-200 text-sm">{apiError}</p>
              </div>
            </div>
          )}

          {/* MEVX Direct Test */}
          <div className="border-t border-slate-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-semibold">MEVX API Direct Test</h4>
              <Button
                onClick={testMEVXAPI}
                variant="outline"
                size="sm"
                className="bg-transparent border-slate-600 text-slate-400 hover:bg-slate-800"
                disabled={!poolAddress || debugInfo.testing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${debugInfo.testing ? 'animate-spin' : ''}`} />
                Test MEVX
              </Button>
            </div>
            
            {debugInfo.mevxUrl && (
              <div className="mb-2">
                <p className="text-slate-400 text-xs">MEVX URL:</p>
                <p className="text-blue-300 text-xs font-mono break-all">{debugInfo.mevxUrl}</p>
              </div>
            )}
            
            {debugInfo.mevxResponse && (
              <div className="bg-slate-800 p-3 rounded overflow-x-auto max-h-40">
                <pre className="text-xs text-slate-300">
                  {JSON.stringify(debugInfo.mevxResponse, null, 2)}
                </pre>
              </div>
            )}
            
            {debugInfo.mevxError && (
              <div className="bg-red-950 border border-red-800 p-3 rounded">
                <p className="text-red-200 text-sm">{debugInfo.mevxError}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-slate-700 pt-4 flex gap-2">
            <Button
              onClick={refetch}
              variant="outline"
              size="sm"
              className="bg-transparent border-slate-600 text-slate-400 hover:bg-slate-800"
              disabled={isLoading || !poolAddress}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Button
              onClick={testDirectAPI}
              variant="outline"
              size="sm"
              className="bg-transparent border-slate-600 text-slate-400 hover:bg-slate-800"
              disabled={!poolAddress}
            >
              Test API
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
