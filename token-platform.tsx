"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, Plus, Info, Clock, RefreshCw, BarChart3 } from "lucide-react"
import { useTokenData } from "./hooks/useTokenData"
import { type TokenData } from "./hooks/useWebSocket"
import { ConnectionStatus } from "./components/ConnectionStatus"
import { SocialLinks } from "./components/SocialLinks"
import { PriceDisplay } from "./components/PriceDisplay"
import { TokenTrade } from "./components/TokenTrade"
import { TokenDetailModal } from "./components/TokenDetailModal"
import { BondingCurveDebug } from "./components/BondingCurveDebug"
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Progress } from "@/components/ui/progress"
import { useDexPaidStatus } from "./hooks/useDexPaidStatus"

const TokenCard = ({
  token,
  priceData,
  isLoadingPrice,
  onOpenDetail,
}: {
  token: TokenData
  priceData?: any
  isLoadingPrice: boolean
  onOpenDetail: (token: TokenData) => void
}) => {
  const { isPaid: isDexPaid } = useDexPaidStatus(token.mint, token.category)

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

  const truncateAddress = (address: string) => {
    if (address.length <= 8) return address
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const formatPrice = (price: number) => {
    if (price === 0) return "$0.00"
    if (price < 0.000001) return `$${price.toExponential(2)}`
    if (price < 0.01) return `$${price.toFixed(6)}`
    return `$${price.toFixed(2)}`
  }

  const formatMarketCap = (mcap: number) => {
    if (mcap >= 1000000) return `$${(mcap / 1000000).toFixed(1)}M`
    if (mcap >= 1000) return `$${(mcap / 1000).toFixed(1)}K`
    return `$${mcap.toFixed(0)}`
  }

  const formatLiquidity = (liquidity: number) => {
    if (liquidity >= 1000000) return `$${(liquidity / 1000000).toFixed(1)}M`
    if (liquidity >= 1000) return `$${(liquidity / 1000).toFixed(1)}K`
    return `$${liquidity.toFixed(0)}`
  }

  const getBondingCurveProgress = () => {
    const currentMcap = priceData?.marketCap || token.market_cap_value || 0
    const targetMcap = 50000 // $50K target
    const progress = Math.min((currentMcap / targetMcap) * 100, 100)
    return progress
  }

  return (
    <Card className="bg-transparent border-2 border-primary shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.02] rounded-2xl overflow-hidden h-full backdrop-blur-sm">
              {/* Featured Header */}
        <div className="px-6 py-4 border-b border-primary/30 bg-primary/10">
          <h4 className="text-lg font-semibold text-foreground">Featured</h4>
        </div>

      {/* Token Info Section */}
      <CardContent className="p-6 space-y-5 flex-1">
        {/* Token Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold overflow-hidden">
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
              <h3 className="font-bold text-lg text-foreground">{token.name}</h3>
              <p className="text-sm text-muted-foreground">{token.symbol}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Just now</span>
          </div>
        </div>

        {/* NEW Badge */}
        <div className="flex justify-start">
          <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm font-medium">
            NEW
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">PRICE</p>
            <p className="font-semibold text-foreground">
              {isLoadingPrice 
                ? "Loading..." 
                : formatPrice(Number(priceData?.price || 0))
              }
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">MARKET CAP</p>
            <p className="font-semibold text-foreground">
              {formatMarketCap(priceData?.marketCap || token.market_cap_value || 0)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">LIQUIDITY</p>
            <p className="font-semibold text-foreground">
              {isLoadingPrice 
                ? "Loading..." 
                : formatLiquidity(Number(priceData?.liquidity || 0))
              }
            </p>
          </div>
        </div>

        {/* Bonding Curve */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Bonding Curve</p>
            <p className="text-sm font-semibold text-accent">
              {getBondingCurveProgress().toFixed(2)}%
            </p>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-accent h-2 rounded-full transition-all duration-500"
              style={{ width: `${getBondingCurveProgress()}%` }}
            />
          </div>
        </div>

        {/* Creator Info */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Creator:</p>
          <p className="text-sm font-mono text-foreground">{truncateAddress(token.creator)}</p>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-3">
          <SocialLinks twitter={token.twitter} telegram={token.telegram} website={token.website} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => onOpenDetail(token)}
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent border-border text-foreground hover:bg-secondary hover:shadow-lg hover:shadow-primary/30 rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Details
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="flex-1 bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/50 text-primary-foreground rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Trade {token.symbol}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground max-w-md">
              <DialogHeader>
                <DialogTitle>Trade {token.name} ({token.symbol})</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                {/* Import TokenTrade component */}
                <div className="TokenTradeWrapper">
                  {/* @ts-ignore */}
                  <TokenTrade 
                    tokenMint={token.mint} 
                    tokenName={token.name} 
                    tokenSymbol={token.symbol} 
                    defaultTab="buy" 
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

const WalletConnectButton = () => {
  return (
            <WalletMultiButton className="!bg-primary !hover:bg-primary/90 !hover:shadow-lg !hover:shadow-primary/50 !text-primary-foreground !font-semibold !px-4 !py-2 !rounded-xl !border-none !h-[38px] !transform !transition-all !duration-200 !hover:scale-105 !active:scale-95" />
  )
}

export default function TokenPlatform() {
  const [activeTab, setActiveTab] = useState<"new" | "trending" | "graduated">("new")
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const {
    allTokens,
    newTokens,
    bondingTokens,
    graduatedTokens,
    trendingTokens,
    isConnected,
    error,
    rawMessages,
    priceData,
    isPriceLoading,
    refetchPrices,
  } = useTokenData()

  const handleOpenDetail = (token: TokenData) => {
    setSelectedToken(token)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false)
    setSelectedToken(null)
  }

  // Get tokens for current tab
  const getDisplayTokens = () => {
    let tokens;
    switch (activeTab) {
      case "trending":
        tokens = trendingTokens
        break
      case "graduated":
        tokens = graduatedTokens
        break
      default:
        tokens = newTokens
        break
    }

    // Filter tokens based on search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      tokens = tokens.filter(token => 
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.mint.toLowerCase().includes(query) ||
        token.description.toLowerCase().includes(query)
      )
    }

    return tokens
  }

  const displayTokens = getDisplayTokens()

  const handleSearch = () => {
    // Search functionality is handled by the getDisplayTokens filter
    // This function can be used for additional search actions if needed
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const getTabDescription = (tab: string) => {
    switch (tab) {
      case "new":
        return "Fresh tokens just launched on the platform"
      case "trending":
        return "Tokens with the highest market cap values"
      case "graduated":
        return "Established tokens that have graduated from bonding curves"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="border-b border-primary/30 px-6 py-4 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold">TokenPlatform</h1>
            <div className="flex gap-4">
              <a href="/" className="text-foreground hover:text-primary transition-all duration-200 hover:scale-105 px-3 py-2 rounded-lg hover:bg-secondary/20">Home</a>
              <a href="/trade" className="text-foreground hover:text-primary transition-all duration-200 hover:scale-105 px-3 py-2 rounded-lg hover:bg-secondary/20">Trade</a>
            </div>
            <ConnectionStatus isConnected={isConnected} error={error} rawMessages={rawMessages} />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={refetchPrices}
              variant="outline"
              size="sm"
              className="bg-transparent border-border text-foreground hover:bg-secondary hover:shadow-lg hover:shadow-primary/30 rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95"
              disabled={isPriceLoading}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isPriceLoading ? "animate-spin" : ""}`} />
              {isPriceLoading ? "Loading..." : "Refresh Prices"}
            </Button>
            {Object.keys(priceData).length > 0 && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs">
                {Object.keys(priceData).length} prices loaded
              </Badge>
            )}
            {activeTab === "trending" && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground text-xs">
                {trendingTokens.length} trending tokens
              </Badge>
            )}
            <Button className="bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/50 rounded-xl transform transition-all duration-200 hover:scale-105 active:scale-95">
              <Plus className="w-4 h-4 mr-2" />
              Create Token
            </Button>
            <WalletConnectButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="w-full py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Title */}
          <h1 className="text-6xl md:text-7xl font-bold mb-12">
            <span className="text-foreground">reeveal</span>
            <span className="text-primary">.fun</span>
          </h1>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center bg-transparent border-2 border-primary shadow-lg shadow-primary/30 rounded-xl overflow-hidden backdrop-blur-sm">
              <input
                type="text"
                placeholder="Search for Token by name or address"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-6 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-primary/50 transform hover:scale-105 active:scale-95"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 py-8">
        {/* Debug Info for Trending Tokens */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <h3 className="text-sm font-semibold text-primary mb-2">Debug: Trending Tokens Info</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Total tokens: {allTokens.length}</p>
              <p>Trending tokens: {trendingTokens.length}</p>
              <p>Tokens with market cap: {allTokens.filter(t => t.market_cap_value && t.market_cap_value > 0).length}</p>
              <p>Tokens with price data: {allTokens.filter(t => t.price).length}</p>
              <p>Recent tokens (24h): {allTokens.filter(t => t.created_timestamp > Date.now() - 24 * 60 * 60 * 1000).length}</p>
              {trendingTokens.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Top 3 trending:</p>
                  {trendingTokens.slice(0, 3).map(token => (
                    <p key={token.mint} className="ml-2">
                      {token.symbol}: ${token.market_cap_value?.toLocaleString() || 'N/A'} mcap
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bonding Curve Debug Panel */}
        <BondingCurveDebug 
          tokens={allTokens}
          rawMessages={rawMessages}
          onRefresh={refetchPrices}
        />

        {/* Tab Headers */}
        <div className="flex gap-8 mb-8">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex items-center gap-2 pb-4 border-b-2 transition-all duration-300 hover:scale-105 ${
              activeTab === "new" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="w-3 h-6 bg-primary rounded-sm"></div>
            <span className="text-lg font-semibold">New Tokens</span>
            <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs">
              {newTokens.length}
            </Badge>
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab("trending")}
            className={`flex items-center gap-2 pb-4 border-b-2 transition-all duration-300 hover:scale-105 ${
              activeTab === "trending"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="w-3 h-6 bg-primary rounded-sm"></div>
            <span className="text-lg font-semibold">Trending Tokens</span>
            <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs">
              {trendingTokens.length}
            </Badge>
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab("graduated")}
            className={`flex items-center gap-2 pb-4 border-b-2 transition-all duration-300 hover:scale-105 ${
              activeTab === "graduated"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="w-3 h-6 bg-primary rounded-sm"></div>
            <span className="text-lg font-semibold">Graduated Tokens</span>
            <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs">
              {graduatedTokens.length}
            </Badge>
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Description */}
        <div className="mb-6">
          <p className="text-muted-foreground text-sm">
            {searchQuery.trim() ? `Search results for "${searchQuery}" in ${activeTab} tokens` : getTabDescription(activeTab)}
          </p>
          {searchQuery.trim() && (
            <button
              onClick={clearSearch}
              className="mt-2 text-primary hover:text-primary/80 text-sm underline"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Token Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayTokens.length > 0 ? (
            displayTokens.map((token) => (
              <TokenCard
                key={token.mint}
                token={token}
                priceData={priceData[token.mint]}
                isLoadingPrice={isPriceLoading}
                onOpenDetail={handleOpenDetail}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">
                {searchQuery.trim() 
                  ? `No tokens found matching "${searchQuery}" in ${activeTab} tokens`
                  : isConnected 
                    ? `No ${activeTab} tokens available yet...` 
                    : "Connecting to live feed..."
                }
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                {searchQuery.trim() 
                  ? "Try a different search term or browse all tokens below"
                  : getTabDescription(activeTab)
                }
              </p>
              {searchQuery.trim() && (
                <button
                  onClick={clearSearch}
                  className="mt-4 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/50 transform hover:scale-105 active:scale-95"
                >
                  Clear search and browse all tokens
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Token Detail Modal */}
      <TokenDetailModal
        token={selectedToken}
        priceData={selectedToken ? priceData[selectedToken.mint] : undefined}
        isLoadingPrice={isPriceLoading}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
      />
    </div>
  )
}
