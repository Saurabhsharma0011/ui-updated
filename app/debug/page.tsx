"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useTokenData } from "@/hooks/useTokenData"
import { CandlestickDebug } from "@/components/CandlestickDebug"

export default function DebugPage() {
  const { allTokens, isConnected } = useTokenData()
  const [selectedToken, setSelectedToken] = useState<any>(null)

  // Find a token with a bonding curve key for testing
  useEffect(() => {
    const tokenWithBondingCurve = allTokens.find(token => token.bondingCurveKey)
    if (tokenWithBondingCurve && !selectedToken) {
      setSelectedToken(tokenWithBondingCurve)
    }
  }, [allTokens, selectedToken])

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Candlestick Chart Debug</h1>
          <p className="text-slate-400">Debug and test the candlestick chart functionality</p>
        </div>

        {/* Connection Status */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>{isConnected ? 'Connected to WebSocket' : 'Disconnected'}</span>
              <span className="text-slate-400">•</span>
              <span>{allTokens.length} tokens loaded</span>
            </div>
          </CardContent>
        </Card>

        {/* Token Selection */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Select Token for Testing</CardTitle>
          </CardHeader>
          <CardContent>
            {allTokens.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allTokens.slice(0, 6).map((token) => (
                    <button
                      key={token.mint}
                      onClick={() => setSelectedToken(token)}
                      className={`p-4 rounded border text-left transition-colors ${
                        selectedToken?.mint === token.mint
                          ? 'border-blue-400 bg-blue-950'
                          : 'border-slate-700 bg-slate-800 hover:bg-slate-750'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-semibold">
                          {token.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{token.name}</p>
                          <p className="text-xs text-slate-400">{token.symbol}</p>
                        </div>
                      </div>
                      <div className="text-xs space-y-1">
                        <p>
                          <span className="text-slate-400">Bonding Curve:</span>{" "}
                          {token.bondingCurveKey ? (
                            <span className="text-green-400 font-mono">
                              {token.bondingCurveKey.slice(0, 8)}...
                            </span>
                          ) : (
                            <span className="text-red-400">None</span>
                          )}
                        </p>
                        <p>
                          <span className="text-slate-400">Category:</span>{" "}
                          <span className="capitalize">{token.category}</span>
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                
                {selectedToken && (
                  <div className="border-t border-slate-700 pt-4">
                    <h3 className="font-semibold mb-2">Selected Token Details</h3>
                    <div className="bg-slate-800 p-4 rounded space-y-2 text-sm">
                      <p><span className="text-slate-400">Name:</span> {selectedToken.name}</p>
                      <p><span className="text-slate-400">Symbol:</span> {selectedToken.symbol}</p>
                      <p><span className="text-slate-400">Mint:</span> <span className="font-mono">{selectedToken.mint}</span></p>
                      <p><span className="text-slate-400">Bonding Curve:</span> {selectedToken.bondingCurveKey ? <span className="font-mono text-green-400">{selectedToken.bondingCurveKey}</span> : <span className="text-red-400">Not Available</span>}</p>
                      <p><span className="text-slate-400">Category:</span> <span className="capitalize">{selectedToken.category}</span></p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">
                  {isConnected ? 'No tokens available yet...' : 'Waiting for connection...'}
                </p>
                <RefreshCw className="w-8 h-8 mx-auto text-slate-600" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Component */}
        {selectedToken && (
          <CandlestickDebug
            poolAddress={selectedToken.bondingCurveKey}
            timeBucket="1s"
            tokenSymbol={selectedToken.symbol}
          />
        )}

        {/* Manual Test Section */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Manual Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">
                You can also test with a known bonding curve address. Here are some test scenarios:
              </p>
              
              <div className="space-y-2">
                <Button
                  onClick={() => setSelectedToken({
                    name: "Test Token",
                    symbol: "TEST",
                    mint: "test",
                    bondingCurveKey: "7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5", // Known pump.fun bonding curve
                    category: "bonding"
                  })}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-slate-600 text-slate-400 hover:bg-slate-800"
                >
                  Test with Known Bonding Curve
                </Button>
                
                <Button
                  onClick={() => setSelectedToken({
                    name: "Invalid Token",
                    symbol: "INVALID",
                    mint: "invalid",
                    bondingCurveKey: "invalidaddress123", // Invalid address
                    category: "bonding"
                  })}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-slate-600 text-slate-400 hover:bg-slate-800"
                >
                  Test with Invalid Address
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
