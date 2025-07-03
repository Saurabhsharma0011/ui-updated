"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface BondingCurveDebugProps {
  tokens: any[]
  rawMessages: any[]
  onRefresh: () => void
}

export const BondingCurveDebug = ({ tokens, rawMessages, onRefresh }: BondingCurveDebugProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const tokensWithCurves = tokens.filter(token => token.bondingCurveKey)
  const tokensWithoutCurves = tokens.filter(token => !token.bondingCurveKey)

  const recentMessages = rawMessages.slice(0, 5)

  return (
    <Card className="bg-slate-900 border-slate-700 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">Bonding Curve Status</CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-green-600 text-white">
              {tokensWithCurves.length} with curves
            </Badge>
            <Badge variant="secondary" className="bg-red-600 text-white">
              {tokensWithoutCurves.length} without curves
            </Badge>
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="outline"
              size="sm"
              className="bg-transparent border-slate-600 text-slate-400 hover:bg-slate-800"
            >
              {isExpanded ? "Hide Details" : "Show Details"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tokens with Bonding Curves */}
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Tokens with Chart Data ({tokensWithCurves.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tokensWithCurves.map((token) => (
                  <div key={token.mint} className="bg-slate-800 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-medium text-sm">{token.symbol}</p>
                        <p className="text-slate-400 text-xs">{token.name}</p>
                      </div>
                      <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                        CHART READY
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div>
                        <p className="text-slate-500 text-xs">Mint:</p>
                        <p className="text-slate-300 text-xs font-mono">
                          {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Bonding Curve:</p>
                        <p className="text-blue-300 text-xs font-mono">
                          {token.bondingCurveKey.slice(0, 8)}...{token.bondingCurveKey.slice(-8)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {tokensWithCurves.length === 0 && (
                  <p className="text-slate-500 text-sm">No tokens with bonding curves yet...</p>
                )}
              </div>
            </div>

            {/* Recent WebSocket Messages */}
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400" />
                Recent WebSocket Messages ({recentMessages.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentMessages.map((message, index) => (
                  <div key={index} className="bg-slate-800 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-white text-xs font-medium">
                        Message {index + 1}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          message.bondingCurveKey || message.bonding_curve_key || message.curve 
                            ? 'bg-green-600 text-white' 
                            : 'bg-slate-600 text-slate-300'
                        }`}
                      >
                        {message.bondingCurveKey || message.bonding_curve_key || message.curve ? 'HAS CURVE' : 'NO CURVE'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 text-xs">
                        Keys: {Object.keys(message).slice(0, 5).join(", ")}
                        {Object.keys(message).length > 5 && "..."}
                      </p>
                      {(message.mint || message.token) && (
                        <p className="text-slate-300 text-xs">
                          Token: {(message.mint || message.token)?.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {recentMessages.length === 0 && (
                  <p className="text-slate-500 text-sm">No recent messages...</p>
                )}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{tokens.length}</p>
                <p className="text-slate-400 text-sm">Total Tokens</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{tokensWithCurves.length}</p>
                <p className="text-slate-400 text-sm">Chart Ready</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{rawMessages.length}</p>
                <p className="text-slate-400 text-sm">WS Messages</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {tokens.length > 0 ? Math.round((tokensWithCurves.length / tokens.length) * 100) : 0}%
                </p>
                <p className="text-slate-400 text-sm">Success Rate</p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
