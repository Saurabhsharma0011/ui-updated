"use client"

import { useEffect, useRef } from "react"
import { createChart, IChartApi, ColorType, Time } from "lightweight-charts"
import { CandlestickData as APICandlestickData } from "@/hooks/useCandlestickData"

interface MiniChartProps {
  data: APICandlestickData[]
  width?: number
  height?: number
}

export const MiniChart = ({ data, width = 200, height = 100 }: MiniChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create minimal chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'transparent',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: {
        mode: 0, // Disabled
      },
      rightPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: false,
      },
      handleScroll: false,
      handleScale: false,
      width,
      height,
    })

    // Create line series for mini chart (simpler than candlesticks)
    const lineSeries = (chart as any).addLineSeries({
      color: '#10b981',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    chartRef.current = chart

    // Convert candlestick data to line data
    if (data.length > 0) {
      const lineData = data
        .filter(item => {
          const close = parseFloat(item.close)
          return !isNaN(close) && close > 0
        })
        .map(item => ({
          time: item.timestamp as Time,
          value: parseFloat(item.close),
        }))

      if (lineData.length > 0) {
        lineSeries.setData(lineData)
        chart.timeScale().fitContent()
      }
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [data, width, height])

  if (data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-800 rounded"
        style={{ width, height }}
      >
        <span className="text-xs text-slate-500">No data</span>
      </div>
    )
  }

  return (
    <div 
      ref={chartContainerRef}
      className="rounded overflow-hidden"
      style={{ width, height }}
    />
  )
}
