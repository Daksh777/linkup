import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { compact, percent, shortDate, type DayPoint } from './data'

/* Chart palette — validated (dark surface #141414): lightness band, chroma, CVD ΔE 11.5, contrast. */
export const SERIES = {
  views: { label: 'Page views', color: '#6670ff' },
  clicks: { label: 'Link clicks', color: '#f81ab5' },
} as const
export const DE_EMPHASIS = '#6e6e6e'
const SURFACE = '#141414'
const GRID = '#2a2a2a'

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

function niceMax(value: number) {
  if (value <= 0) return 10
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value / 4)! * magnitude
  return Math.ceil(value / step) * step
}

/* ---------- Line chart: views + clicks over time ---------- */

type SeriesKey = keyof typeof SERIES
const KEYS: SeriesKey[] = ['views', 'clicks']

export function TrafficChart({ days, height = 260 }: { days: DayPoint[]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)

  const margin = { top: 12, right: 96, bottom: 28, left: 40 }
  const plotW = Math.max(0, width - margin.left - margin.right)
  const plotH = height - margin.top - margin.bottom
  const yMax = niceMax(Math.max(...days.map((d) => d.views)))
  const x = (i: number) => margin.left + (days.length === 1 ? plotW / 2 : (i / (days.length - 1)) * plotW)
  const y = (v: number) => margin.top + plotH - (v / yMax) * plotH
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax)
  const xTickCount = Math.min(days.length, width < 480 ? 3 : 6)
  const xTicks = Array.from({ length: xTickCount }, (_, i) => Math.round((i / (xTickCount - 1 || 1)) * (days.length - 1)))

  const path = (key: SeriesKey) => days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join('')

  // End labels — nudge apart only if they would overlap.
  const last = days[days.length - 1]
  let endY = KEYS.map((k) => y(last[k]))
  if (Math.abs(endY[0] - endY[1]) < 18) {
    const mid = (endY[0] + endY[1]) / 2
    endY = endY[0] < endY[1] ? [mid - 9, mid + 9] : [mid + 9, mid - 9]
  }

  const onPointer = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - box.left) / box.width
    setActive(Math.max(0, Math.min(days.length - 1, Math.round(ratio * (days.length - 1)))))
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const step = e.key === 'ArrowRight' ? 1 : -1
    setActive((i) => Math.max(0, Math.min(days.length - 1, (i ?? days.length - 1) + step)))
  }

  const point = active !== null ? days[active] : null
  // Sit the tooltip beside the crosshair (flipping near the right edge) so it never hides the point.
  const TIP_W = 160
  const tipLeft =
    active === null ? 0 : x(active) + 12 + TIP_W <= width ? x(active) + 12 : Math.max(0, x(active) - 12 - TIP_W)

  return (
    <div className="chart" ref={ref}>
      <div className="chart__legend">
        {KEYS.map((k) => (
          <span key={k} className="legend-item t-caption">
            <span className="legend-line" style={{ background: SERIES[k].color }} />
            {SERIES[k].label}
          </span>
        ))}
      </div>
      {width > 0 && (
        <div className="chart__plot">
          <svg width={width} height={height} role="img" aria-label="Daily page views and link clicks">
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={margin.left} x2={margin.left + plotW} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
                <text x={margin.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="chart__tick">
                  {compact(t)}
                </text>
              </g>
            ))}
            {xTicks.map((i) => (
              <text
                key={i}
                x={x(i)}
                y={height - 8}
                textAnchor={i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'}
                className="chart__tick"
              >
                {shortDate(days[i].date)}
              </text>
            ))}
            <path d={`${path('views')}L${x(days.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill={SERIES.views.color} opacity={0.1} />
            {KEYS.map((k) => (
              <path key={k} d={path(k)} fill="none" stroke={SERIES[k].color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            ))}
            {KEYS.map((k, j) => (
              <g key={k}>
                <circle cx={x(days.length - 1)} cy={y(last[k])} r={4} fill={SERIES[k].color} stroke={SURFACE} strokeWidth={2} />
                <text x={x(days.length - 1) + 12} y={endY[j]} dy="0.32em" className="chart__end-label">
                  <tspan className="chart__end-value">{compact(last[k])}</tspan>
                  <tspan dx={4}>{k}</tspan>
                </text>
              </g>
            ))}
            {point && active !== null && (
              <g pointerEvents="none">
                <line x1={x(active)} x2={x(active)} y1={margin.top} y2={margin.top + plotH} stroke="#9a9a9a" strokeWidth={1} />
                {KEYS.map((k) => (
                  <circle key={k} cx={x(active)} cy={y(point[k])} r={4} fill={SERIES[k].color} stroke={SURFACE} strokeWidth={2} />
                ))}
              </g>
            )}
            <rect
              x={margin.left}
              y={margin.top}
              width={plotW}
              height={plotH}
              fill="transparent"
              tabIndex={0}
              aria-label="Chart cursor. Use left and right arrow keys to read daily values."
              className="chart__hit"
              onPointerMove={onPointer}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(days.length - 1)}
              onBlur={() => setActive(null)}
              onKeyDown={onKey}
            />
          </svg>
          {point && (
            <div className="chart-tip" style={{ left: tipLeft, top: margin.top, width: TIP_W, transform: 'none' }}>
              <p className="chart-tip__title">{shortDate(point.date)}</p>
              {KEYS.map((k) => (
                <p key={k} className="chart-tip__row">
                  <span className="legend-line" style={{ background: SERIES[k].color }} />
                  <strong>{point[k].toLocaleString('en-IN')}</strong>
                  <span>{SERIES[k].label.toLowerCase()}</span>
                </p>
              ))}
              <p className="chart-tip__row chart-tip__row--plain">
                <strong>{percent(point.clicks / point.views)}</strong>
                <span>click-through</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------- Horizontal bar list ---------- */

export type BarDatum = { key: string; label: ReactNode; value: number; note?: string }

export function BarList({ data, color, total, unit }: { data: BarDatum[]; color: string; total: number; unit: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <ul className="bar-list">
      {data.map((d) => (
        <li key={d.key} className="bar-row" tabIndex={0}>
          <div className="bar-row__label t-body-s">{d.label}</div>
          <div className="bar-row__track">
            <span className="bar-row__bar" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
            <span className="bar-row__value">{d.value.toLocaleString('en-IN')}</span>
          </div>
          <div className="chart-tip bar-row__tip" role="tooltip">
            <p className="chart-tip__row">
              <strong>{d.value.toLocaleString('en-IN')}</strong>
              <span>{unit}</span>
            </p>
            <p className="chart-tip__row chart-tip__row--plain">
              <strong>{percent(total ? d.value / total : 0)}</strong>
              <span>of total</span>
            </p>
            {d.note && <p className="chart-tip__row chart-tip__row--plain">{d.note}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}

/* ---------- Part-to-whole split (two parts: highlight one, grey the other) ---------- */

export function SplitBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((n, p) => n + p.value, 0) || 1
  return (
    <div className="split">
      <div className="split__bar" role="img" aria-label={parts.map((p) => `${p.label} ${percent(p.value / total, 0)}`).join(', ')}>
        {parts.map((p) => (
          <span key={p.label} className="split__seg" style={{ flexGrow: p.value, background: p.color }} title={`${p.label}: ${p.value.toLocaleString('en-IN')}`} />
        ))}
      </div>
      <ul className="split__legend">
        {parts.map((p) => (
          <li key={p.label}>
            <span className="legend-swatch" style={{ background: p.color }} />
            <span className="t-body-s">{p.label}</span>
            <strong className="split__pct">{percent(p.value / total, 0)}</strong>
            <span className="t-caption t-muted">{p.value.toLocaleString('en-IN')}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Sparkline (stat tiles) ---------- */

export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 96
  const h = 32
  const pad = 5
  const max = Math.max(...values)
  const min = Math.min(...values)
  const x = (i: number) => pad + (i / (values.length - 1 || 1)) * (w - pad * 2)
  const y = (v: number) => pad + (h - pad * 2) * (1 - (v - min) / (max - min || 1))
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const lastI = values.length - 1
  return (
    <svg width={w} height={h} aria-hidden className="sparkline">
      <path d={d} fill="none" stroke={DE_EMPHASIS} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(lastI)} cy={y(values[lastI])} r={4} fill={color} stroke={SURFACE} strokeWidth={2} />
    </svg>
  )
}
