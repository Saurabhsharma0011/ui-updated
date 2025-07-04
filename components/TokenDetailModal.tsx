"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TokenTrade } from "@/components/TokenTrade"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PriceDisplay } from "@/components/PriceDisplay"
import { SocialLinks } from "@/components/SocialLinks"
import { CandlestickChart } from "@/components/CandlestickChart"
import { useCandlestickData } from "@/hooks/useCandlestickData"
import { TokenData } from "@/hooks/useWebSocket"
import { Clock, TrendingUp, BarChart3, Activity, X, Calendar, Users } from "lucide-react"

interface TokenDetailModalProps {
  token: TokenData | null
  priceData?: any
  isLoadingPrice: boolean
  isOpen: boolean
  onClose: () => void
}

export const TokenDetailModal = ({ 
  token, 
  priceData, 
  isLoadingPrice, 
  isOpen, 
  onClose 
}: TokenDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<"trade" | "details">("trade")
  const [chartTimeframe, setChartTimeframe] = useState<"1H" | "1D" | "1W" | "1M">("1H")
  
  // Get chart data for the token
  const chartTimeBucket = chartTimeframe === "1H" ? "1m" : chartTimeframe === "1D" ? "5m" : chartTimeframe === "1W" ? "1h" : "1d"
  const { data: chartData, isLoading: isChartLoading, refetch: refetchChart } = useCandlestickData(
    token?.bondingCurveKey, 
    chartTimeBucket
  )

  if (!token) return null

  const timeAgo = () => {
    const now = Date.now()
    const diff = now - token.created_timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-transparent border-2 border-primary shadow-xl shadow-primary/40 backdrop-blur-md text-foreground max-w-5xl max-h-[95vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-primary/30">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary-foreground font-semibold overflow-hidden">
              {token.image && token.image !== "/placeholder.svg?height=48&width=48" ? (
                <img
                  src={token.image || "/placeholder.svg"}
                  alt={token.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `<span class="text-primary-foreground font-semibold text-xl">${getInitials(token.name)}</span>`
                    }
                  }}
                />
              ) : (
                <span className="text-primary-foreground font-semibold text-xl">{getInitials(token.name)}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <DialogTitle className="text-2xl font-bold">{token.name}</DialogTitle>
                <Badge className="bg-primary text-primary-foreground">
                  {token.symbol}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {timeAgo()}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="bg-transparent border-primary/30 hover:bg-primary/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Announcement Section */}
        <div className="px-6 py-4 bg-primary/5 border-l-4 border-primary">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Token Announcement</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {token.description || `New token ${token.name} (${token.symbol}) just launched! Join the community and start trading.`}
          </p>
        </div>

        {/* Chart Section */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {token.symbol}/SOL Price Chart
            </h3>
            <div className="flex gap-2">
              {["1H", "1D", "1W", "1M"].map((timeframe) => (
                <Button
                  key={timeframe}
                  variant={chartTimeframe === timeframe ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartTimeframe(timeframe as any)}
                  className={`h-8 px-3 text-xs ${
                    chartTimeframe === timeframe 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-transparent border-primary/30 hover:bg-primary/10"
                  }`}
                >
                  {timeframe}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Real Chart */}
          {token.bondingCurveKey ? (
            <CandlestickChart
              data={chartData}
              isLoading={isChartLoading}
              onRefresh={refetchChart}
              tokenSymbol={token.symbol}
            />
          ) : (
            <div className="bg-primary/5 border border-primary/30 rounded-xl p-8 text-center">
              <BarChart3 className="w-16 h-16 text-primary/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No chart data available for this token</p>
              <p className="text-sm text-muted-foreground mt-2">
                Current Price: {isLoadingPrice ? "Loading..." : `$${Number(priceData?.price || 0).toFixed(6)}`}
              </p>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-2 bg-primary/10 border border-primary/30">
              <TabsTrigger 
                value="trade"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Trade
              </TabsTrigger>
              <TabsTrigger 
                value="details"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Details
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="trade" className="mt-6">
              <TokenTrade 
                tokenMint={token.mint}
                tokenName={token.name}
                tokenSymbol={token.symbol}
                defaultTab="buy"
              />
            </TabsContent>
            
            <TabsContent value="details" className="mt-6">
              <div className="space-y-6">
                {/* Price Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Market Information
                  </h3>
                  <PriceDisplay
                    price={priceData?.price || 0}
                    marketCap={priceData?.marketCap || token.market_cap_value || 0}
                    liquidity={priceData?.liquidity || 0}
                    priceChange24h={priceData?.priceChange24h || 0}
                    volume24h={priceData?.volume24h || 0}
                    isLoading={isLoadingPrice}
                  />
                </div>

                {/* Token Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Token Information
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between p-3 bg-primary/5 rounded-lg">
                        <span className="text-muted-foreground">Contract:</span>
                        <span className="text-foreground font-mono">{token.mint.slice(0, 8)}...{token.mint.slice(-8)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-primary/5 rounded-lg">
                        <span className="text-muted-foreground">Creator:</span>
                        <span className="text-foreground font-mono">{token.creator.slice(0, 8)}...{token.creator.slice(-8)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-primary/5 rounded-lg">
                        <span className="text-muted-foreground">Category:</span>
                        <span className="text-foreground capitalize">{token.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Community
                    </h3>
                    <div className="space-y-3">
                      <SocialLinks 
                        twitter={token.twitter} 
                        telegram={token.telegram} 
                        website={token.website} 
                      />
                      <div className="p-3 bg-primary/5 rounded-lg">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {token.description || "No description available for this token."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
