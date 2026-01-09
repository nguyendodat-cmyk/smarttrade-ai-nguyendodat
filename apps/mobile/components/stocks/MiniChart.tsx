/**
 * SmartTrade AI v1.3.0 - Theme-Aware Mini Chart
 * Minimal sparkline chart with gradient fill
 */

import React, { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import { useTheme } from '@/context/ThemeContext'

interface MiniChartProps {
  data: number[]
  width?: number
  height?: number
  positive?: boolean
  showArea?: boolean
  strokeWidth?: number
}

export function MiniChart({
  data,
  width = 60,
  height = 32,
  positive = true,
  showArea = true,
  strokeWidth = 1.5,
}: MiniChartProps) {
  const { theme } = useTheme()

  const strokeColor = positive ? theme.semantic.positive : theme.semantic.negative

  const chartData = useMemo(() => {
    if (!data || data.length < 2) return null

    const gradientId = `gradient-${positive ? 'up' : 'down'}-${Math.random().toString(36).substr(2, 9)}`

    // Normalize data to fit in the chart area
    const minValue = Math.min(...data)
    const maxValue = Math.max(...data)
    const range = maxValue - minValue || 1
    const padding = 2

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2)
      const y = padding + (1 - (value - minValue) / range) * (height - padding * 2)
      return { x, y }
    })

    // Create SVG path for line
    const linePath = points.reduce((path, point, index) => {
      return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`)
    }, '')

    // Create SVG path for area fill
    const areaPath = linePath + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

    return { gradientId, linePath, areaPath }
  }, [data, width, height, positive])

  if (!chartData) {
    return <View style={[styles.container, { width, height }]} />
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={chartData.gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={strokeColor} stopOpacity={0.25} />
            <Stop offset="1" stopColor={strokeColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Area fill */}
        {showArea && (
          <Path
            d={chartData.areaPath}
            fill={`url(#${chartData.gradientId})`}
          />
        )}

        {/* Line */}
        <Path
          d={chartData.linePath}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  )
}

// Sparkline variant - thinner, no area fill
export function Sparkline({
  data,
  width = 80,
  height = 24,
  positive = true,
}: Omit<MiniChartProps, 'showArea'>) {
  return (
    <MiniChart
      data={data}
      width={width}
      height={height}
      positive={positive}
      showArea={false}
      strokeWidth={1}
    />
  )
}

// Volume bars chart
export function VolumeChart({
  data,
  width = 60,
  height = 20,
}: {
  data: number[]
  width?: number
  height?: number
}) {
  const { theme } = useTheme()

  if (!data || data.length === 0) {
    return <View style={[styles.container, { width, height }]} />
  }

  const maxValue = Math.max(...data)
  const barWidth = (width - data.length + 1) / data.length
  const gap = 1

  return (
    <View style={[styles.container, styles.volumeContainer, { width, height }]}>
      {data.map((value, index) => {
        const barHeight = (value / maxValue) * height
        return (
          <View
            key={index}
            style={[
              styles.volumeBar,
              {
                width: barWidth,
                height: barHeight,
                marginLeft: index > 0 ? gap : 0,
                backgroundColor: theme.text.tertiary,
              },
            ]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  volumeBar: {
    borderRadius: 1,
    opacity: 0.5,
  },
})

export default MiniChart
