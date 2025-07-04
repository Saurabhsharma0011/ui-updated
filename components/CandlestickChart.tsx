"use client"

import { useEffect, useRef, useState, memo } from "react"
import type { IChartApi, ISeriesApi, CandlestickData, Time } from "lightweight-charts"
import { CandlestickData as APICandlestickData } from "@/hooks/useCandlestickData"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react"

interface CandlestickChartProps {
  data: APICandlestickData[]
  isLoading?: boolean
  onRefresh?: () => void
  tokenSymbol?: string
}

const CandlestickChartComponent = ({ data, isLoading, onRefresh, tokenSymbol }: CandlestickChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const [isChartReady, setIsChartReady] = useState(false)

  const [chartStats, setChartStats] = useState<{
    currentPrice: number
    priceChange: number
    priceChangePercent: number
    volume24h: number
    high24h: number
    low24h: number
  } | null>(null)

  // Memoize data conversion to avoid re-running on every render
  const convertToChartData = (apiData: APICandlestickData[]): CandlestickData[] => {
    return apiData
      .map(item => ({
        time: item.timestamp as Time,
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
      }))
      .sort((a, b) => (a.time as number) - (b.time as number))
  }

  const calculateStats = (chartData: CandlestickData[], fullApiData: APICandlestickData[]) => {
    if (chartData.length === 0) return null

    const latest = chartData[chartData.length - 1]
    const first = chartData[0]
    
    const currentPrice = latest.close
    const openPrice = first.open
    const priceChange = currentPrice - openPrice
    const priceChangePercent = openPrice !== 0 ? ((priceChange / openPrice) * 100) : 0
    
    const high24h = Math.max(...chartData.map(d => d.high))
    const low24h = Math.min(...chartData.map(d => d.low))
    const volume24h = fullApiData.reduce((sum, d) => sum + parseFloat(d.volume), 0)

    return {
      currentPrice,
      priceChange,
      priceChangePercent,
      volume24h,
      high24h,
      low24h,
    }
  }

  useEffect(() => {
    if (!chartContainerRef.current || typeof window === 'undefined') {
      return
    }

    let chart: IChartApi;
    let series: ISeriesApi<'Candlestick'>;

    // Dynamically import lightweight-charts
    import('lightweight-charts').then(({ createChart, ColorType }) => {
      if (!chartContainerRef.current) return;

      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#000000' },
          textColor: '#22c55e',
        },
        grid: {
          vertLines: { color: '#1a5e1a' },
          horzLines: { color: '#1a5e1a' },
        },
        crosshair: {
          mode: 1, // Magnet
        },
        rightPriceScale: {
          borderColor: '#166534',
          precision: 8, // Increase precision for low-priced tokens
        },
        timeScale: {
          borderColor: '#166534',
          timeVisible: true,
          secondsVisible: true,
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
      });

      series = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      chartRef.current = chart;
      seriesRef.current = series;
      setIsChartReady(true); // Signal that the chart is ready

      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.resize(chartContainerRef.current.clientWidth, 400);
        }
      };

      window.addEventListener('resize', handleResize);

      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    }).catch(err => console.error('Failed to load lightweight-charts', err));

  }, []); // Run only once on component mount

  useEffect(() => {
    // Only update data if the chart is ready and the series exists
    if (isChartReady && seriesRef.current) {
      if (data.length > 0) {
        const chartData = convertToChartData(data);
        if (chartData.length > 0) {
          seriesRef.current.setData(chartData);
          const stats = calculateStats(chartData, data);
          setChartStats(stats);
          chartRef.current?.timeScale().fitContent();
        } else {
          // Handle case where all data is filtered out
          seriesRef.current.setData([]);
          setChartStats(null);
        }
      } else {
        // Clear chart if data is empty
        seriesRef.current.setData([]);
        setChartStats(null);
      }
    }
  }, [data, isChartReady]); // Rerun when data or chart readiness changes

  const formatPrice = (price: number) => {
    if (price < 0.000001) return `$${price.toExponential(2)}`
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(2)}`
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`
    return `$${volume.toFixed(0)}`
  }

  return (
    <div className="w-full bg-black rounded-lg p-4">
      {/* Chart Header with Stats */}
      {chartStats && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-green-400 text-xs uppercase tracking-wide">Current Price</p>
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-lg">{formatPrice(chartStats.currentPrice)}</p>
                <div className={`flex items-center gap-1 ${chartStats.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {chartStats.priceChange >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {chartStats.priceChange >= 0 ? '+' : ''}{chartStats.priceChangePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-green-400 text-xs uppercase tracking-wide">24h Volume</p>
              <p className="text-white font-semibold">{formatVolume(chartStats.volume24h)}</p>
            </div>
            <div>
              <p className="text-green-400 text-xs uppercase tracking-wide">24h High</p>
              <p className="text-white font-semibold">{formatPrice(chartStats.high24h)}</p>
            </div>
            <div>
              <p className="text-green-400 text-xs uppercase tracking-wide">24h Low</p>
              <p className="text-white font-semibold">{formatPrice(chartStats.low24h)}</p>
            </div>
          </div>
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="bg-transparent border-slate-600 text-slate-400 hover:bg-slate-800"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      )}

      {/* Chart Container */}
      <div className="relative w-full h-[400px]">
        {isLoading && (
            <div className="absolute inset-0 bg-slate-900 bg-opacity-80 flex items-center justify-center z-10">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" />
                    <p className="text-slate-400">Loading chart data...</p>
                </div>
            </div>
        )}
        <div 
          ref={chartContainerRef} 
          className="w-full h-full bg-slate-900 rounded border border-slate-800"
          style={{ visibility: isChartReady ? 'visible' : 'hidden' }} // Hide until ready
        />
        {!isLoading && data.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400 mb-2">No chart data available</p>
                    <p className="text-slate-500 text-sm mb-4">
                        {tokenSymbol ? `Waiting for ${tokenSymbol} price data...` : 'Waiting for price data...'}
                    </p>
                    {onRefresh && (
                        <Button
                            onClick={onRefresh}
                            variant="outline"
                            size="sm"
                            className="bg-transparent border-slate-600 text-slate-400 hover:bg-slate-800"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh Data
                        </Button>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Chart Footer */}
      <div className="mt-2 text-xs text-slate-500 text-center">
        {tokenSymbol && `${tokenSymbol} • `}OHLC Candlestick Chart • Data from MEVX • {data.length} candles
      </div>
    </div>
  )
}

export const CandlestickChart = memo(CandlestickChartComponent);
