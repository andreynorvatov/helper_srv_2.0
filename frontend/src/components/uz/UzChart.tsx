import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import type { TooltipItem } from 'chart.js'
import type { UzStep } from '../../types'
import { fmt } from '../../utils/uzCalculator'

// chart.js 4.x требует явной регистрации контроллеров, шкал и элементов
Chart.register(...registerables)

interface UzChartProps {
  steps: UzStep[]
  registry: number
  resolvedTheme: 'light' | 'dark'
}

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || hex === 'transparent') return 'rgba(0,0,0,0)'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export default function UzChart({ steps, registry, resolvedTheme }: UzChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rateData: Array<{ x: number; y: number }> = []
    const cumData: Array<{ x: number; y: number }> = []
    let time = 0

    steps.forEach((s) => {
      rateData.push({ x: time, y: s.start })
      time += s.min
      rateData.push({ x: time, y: s.stop })
      cumData.push({ x: time, y: s.uzCumulative })
    })

    const rateColor = getCSSVar('--chart-rate')
    const cumColor = getCSSVar('--chart-cum')
    const registryColor = getCSSVar('--chart-registry')
    const gridColor = getCSSVar('--chart-grid') || 'rgba(0,0,0,0.06)'

    const config = {
      type: 'line' as const,
      data: {
        datasets: [
          {
            label: 'УЗ rate',
            data: rateData,
            borderColor: rateColor,
            borderWidth: 2,
            fill: false,
            tension: 0,
            pointRadius: 3,
            pointBackgroundColor: rateColor,
            yAxisID: 'y',
            order: 2,
          },
          {
            label: 'УЗ нарастающим итогом',
            data: cumData,
            borderColor: cumColor,
            backgroundColor: hexToRgba(cumColor, 0.08),
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: cumColor,
            yAxisID: 'y1',
            order: 1,
          },
          {
            label: 'Реестр УЗ',
            data: [
              { x: 0, y: registry },
              { x: Math.max(time || 1, 1), y: registry },
            ],
            borderColor: registryColor,
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0,
            yAxisID: 'y1',
            order: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest' as const,
          intersect: false,
        },
        scales: {
          x: {
            type: 'linear' as const,
            title: {
              display: true,
              text: 'Время, мин',
              font: { weight: 'bold' as const, size: 13 },
            },
            min: 0,
            grid: { color: gridColor },
            ticks: { stepSize: 5 },
          },
          xHours: {
            type: 'linear' as const,
            position: 'top' as const,
            title: {
              display: true,
              text: 'Время, ч',
              font: { weight: 'bold' as const, size: 13 },
            },
            min: 0,
            grid: { drawOnChartArea: false },
            ticks: {
              callback: (value: number | string) => (Number(value) / 60).toFixed(1),
              stepSize: 5,
            },
          },
          y: {
            type: 'linear' as const,
            title: {
              display: true,
              text: 'УЗ rate',
              font: { weight: 'bold' as const, size: 13 },
            },
            beginAtZero: true,
            position: 'left' as const,
            grid: { color: gridColor },
            ticks: {
              callback: (value: number | string) => Number(value).toLocaleString('ru-RU'),
            },
          },
          y1: {
            type: 'linear' as const,
            title: {
              display: true,
              text: 'УЗ cumulative',
              font: { weight: 'bold' as const, size: 13 },
            },
            position: 'right' as const,
            grid: { drawOnChartArea: false },
            ticks: {
              callback: (value: number | string) => {
                const v = Number(value)
                if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M'
                if (v >= 1000) return (v / 1000).toFixed(0) + 'K'
                return v.toLocaleString('ru-RU')
              },
            },
          },
        },
        plugins: {
          legend: {
            position: 'top' as const,
            labels: {
              usePointStyle: true,
              padding: 16,
              font: { size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx: TooltipItem<'line'>) => {
                const dsLabel = ctx.dataset.label || ''
                const x = ctx.parsed.x ?? 0
                const y = ctx.parsed.y ?? 0
                const h = (x / 60).toFixed(1)
                if (dsLabel === 'Реестр УЗ') {
                  return dsLabel + ': ' + fmt(y)
                }
                if (dsLabel === 'УЗ rate') {
                  return 'Время ' + x + ' мин (' + h + ' ч) → rate: ' + fmt(y) + ' УЗ/мин'
                }
                return dsLabel + ': ' + fmt(y) + ' УЗ (время ' + x + ' мин / ' + h + ' ч)'
              },
            },
          },
        },
      },
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      if (chartRef.current) {
        chartRef.current.data = config.data
        chartRef.current.update('none')
      } else {
        chartRef.current = new Chart(ctx, config)
      }
    } catch (err) {
      console.error('[UzChart] Ошибка создания графика:', err)
    }

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [steps, registry, resolvedTheme])

  return (
    <div className="relative h-[260px] w-full sm:h-[380px]">
      <canvas ref={canvasRef} />
    </div>
  )
}
