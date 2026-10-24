import { useMemo, useState, type ReactNode } from 'react'
import { PAGE_URL, useStore } from '../store'
import { Chip, PanelHeader, Segmented } from '../components/ui'
import { BarList, DE_EMPHASIS, SERIES, Sparkline, SplitBar, TrafficChart } from './charts'
import { compact, getAnalytics, percent, RANGES, shortDate, type DayPoint, type RangeId } from './data'
import './analytics.css'

type View = 'chart' | 'table'

function Card({
  title,
  count,
  children,
  table,
  className,
}: {
  title: string
  count?: string
  children: ReactNode
  /** When provided, the card gets a Chart/Table switch. */
  table?: ReactNode
  className?: string
}) {
  const [view, setView] = useState<View>('chart')
  return (
    <section className={`a-card${className ? ` ${className}` : ''}`}>
      <div className="a-card__header">
        <PanelHeader title={title} count={count} />
        {table && (
          <Segmented
            label={`${title} view`}
            className="segmented--sm"
            options={[
              { value: 'chart', label: 'Chart' },
              { value: 'table', label: 'Table' },
            ]}
            value={view}
            onChange={setView}
          />
        )}
      </div>
      {view === 'table' && table ? table : children}
    </section>
  )
}

function Delta({ current, previous, points, rangeLabel }: { current: number; previous: number; points?: boolean; rangeLabel: string }) {
  const change = points ? (current - previous) * 100 : previous ? ((current - previous) / previous) * 100 : 0
  const up = change >= 0
  const text = points ? `${up ? '+' : '−'}${Math.abs(change).toFixed(1)} pts` : `${up ? '+' : '−'}${Math.abs(change).toFixed(1)}%`
  return (
    <p className="t-caption delta">
      <span className={up ? 'delta--up' : 'delta--down'}>
        <span aria-hidden>{up ? '▲' : '▼'}</span> {text}
      </span>{' '}
      <span className="t-muted">vs previous {rangeLabel}</span>
    </p>
  )
}

function StatTile({
  label,
  value,
  delta,
  trend,
  color,
}: {
  label: string
  value: string
  delta: ReactNode
  trend: number[]
  color: string
}) {
  return (
    <div className="stat">
      <p className="t-label t-muted">{label}</p>
      <div className="stat__row">
        <p className="stat__value">{value}</p>
        <Sparkline values={trend} color={color} />
      </div>
      {delta}
    </div>
  )
}

/** Collapse the range into 12 buckets for tile sparklines. */
function buckets(days: DayPoint[], pick: (d: DayPoint[]) => number) {
  const size = Math.max(1, Math.floor(days.length / 12))
  const out: number[] = []
  for (let i = days.length; i > 0; i -= size) out.unshift(pick(days.slice(Math.max(0, i - size), i)))
  return out.slice(-12)
}
const total = (key: 'views' | 'clicks' | 'visitors') => (ds: DayPoint[]) => ds.reduce((n, d) => n + d[key], 0)

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="a-table-wrap">
      <table className="a-table">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} scope="col" className={i ? 'num' : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={j ? 'num' : undefined}>
                  {typeof c === 'number' ? c.toLocaleString('en-IN') : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AnalyticsPage() {
  const { profile } = useStore()
  const [range, setRange] = useState<RangeId>('30d')
  const data = useMemo(() => getAnalytics(range, profile.links, profile.socials), [range, profile.links, profile.socials])
  const rangeLabel = RANGES.find((r) => r.value === range)!.label
  const { totals, previous } = data

  const topLink = [...data.links].sort((a, b) => b.clicks - a.clicks)[0]
  const peak = data.days.reduce((best, d) => (d.views > best.views ? d : best), data.days[0])
  const peakIsSpike = peak.date.getTime() === data.spikeDate.getTime()
  const mobileShare = data.devices[0].value / (data.devices[0].value + data.devices[1].value)
  const linkClicksTotal = data.links.reduce((n, l) => n + l.clicks, 0)
  const socialTotal = data.socials.reduce((n, s) => n + s.value, 0)

  return (
    <main className="analytics">
      <header className="analytics__header">
        <div>
          <h1 className="analytics__title">Analytics</h1>
          <p className="t-body-s t-muted">
            {PAGE_URL} · {shortDate(data.days[0].date)} – {shortDate(data.days[data.days.length - 1].date)}
          </p>
        </div>
        <div className="analytics__filters">
          <Segmented label="Date range" className="analytics__range" options={RANGES} value={range} onChange={setRange} />
          <span title="No tracking is wired up yet — these numbers are generated in the browser.">
            <Chip>Sample data</Chip>
          </span>
        </div>
      </header>

      <div className="stats">
        <StatTile
          label="Page views"
          value={compact(totals.views)}
          color={SERIES.views.color}
          trend={buckets(data.days, total('views'))}
          delta={<Delta current={totals.views} previous={previous.views} rangeLabel={rangeLabel} />}
        />
        <StatTile
          label="Link clicks"
          value={compact(totals.clicks)}
          color={SERIES.clicks.color}
          trend={buckets(data.days, total('clicks'))}
          delta={<Delta current={totals.clicks} previous={previous.clicks} rangeLabel={rangeLabel} />}
        />
        <StatTile
          label="Click-through rate"
          value={percent(totals.ctr)}
          color="#ffffff"
          trend={buckets(data.days, (ds) => total('clicks')(ds) / total('views')(ds))}
          delta={<Delta current={totals.ctr} previous={previous.ctr} points rangeLabel={rangeLabel} />}
        />
        <StatTile
          label="Unique visitors"
          value={compact(totals.visitors)}
          color="#ffffff"
          trend={buckets(data.days, total('visitors'))}
          delta={<Delta current={totals.visitors} previous={previous.visitors} rangeLabel={rangeLabel} />}
        />
      </div>

      <Card
        title="Traffic"
        className="a-card--wide"
        table={
          <Table
            head={['Date', 'Page views', 'Link clicks', 'CTR']}
            rows={[...data.days].reverse().map((d) => [shortDate(d.date), d.views, d.clicks, percent(d.clicks / d.views)])}
          />
        }
      >
        <TrafficChart days={data.days} />
        <p className="a-insight t-body-s">
          Busiest day: <strong>{shortDate(peak.date)}</strong> with {peak.views.toLocaleString('en-IN')} views
          {peakIsSpike ? ', the day the workshop recap was shared.' : '.'}
        </p>
      </Card>

      <div className="a-grid">
        <Card
          title="Link performance"
          count={String(data.links.length)}
          table={
            <Table
              head={['Link', 'Clicks', 'CTR']}
              rows={data.links.map((l, i) => [`${String(i + 1).padStart(2, '0')} ${l.title}${l.visible ? '' : ' (hidden)'}`, l.clicks, percent(l.ctr)])}
            />
          }
        >
          <BarList
            color={SERIES.clicks.color}
            total={linkClicksTotal}
            unit="clicks"
            data={data.links.map((l, i) => ({
              key: l.id,
              value: l.clicks,
              note: `${percent(l.ctr)} click-through`,
              label: (
                <>
                  <span className="t-numeral bar-row__index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="bar-row__text">{l.title}</span>
                  {!l.visible && <span className="tag-hidden">Hidden</span>}
                </>
              ),
            }))}
          />
          {topLink && (
            <p className="a-insight t-body-s">
              <strong>{topLink.title}</strong> gets {percent(linkClicksTotal ? topLink.clicks / linkClicksTotal : 0, 0)} of link clicks. Links
              higher up the page get tapped more.
            </p>
          )}
        </Card>

        <Card
          title="Traffic sources"
          table={<Table head={['Source', 'Views', 'Share']} rows={data.sources.map((s) => [s.label, s.value, percent(s.value / totals.views)])} />}
        >
          <BarList
            color={SERIES.views.color}
            total={totals.views}
            unit="views"
            data={data.sources.map((s) => ({ key: s.label, label: s.label, value: s.value }))}
          />
        </Card>

        <Card
          title="Top locations"
          table={<Table head={['City', 'Visitors', 'Share']} rows={data.locations.map((s) => [s.label, s.value, percent(s.value / totals.visitors)])} />}
        >
          <BarList
            color={SERIES.views.color}
            total={totals.visitors}
            unit="visitors"
            data={data.locations.map((s) => ({ key: s.label, label: s.label, value: s.value }))}
          />
        </Card>

        <Card
          title="Social icon clicks"
          count={String(data.socials.length)}
          table={<Table head={['Platform', 'Clicks', 'Share']} rows={data.socials.map((s) => [s.label, s.value, percent(socialTotal ? s.value / socialTotal : 0)])} />}
        >
          {data.socials.length ? (
            <BarList
              color={SERIES.clicks.color}
              total={socialTotal}
              unit="clicks"
              data={data.socials.map((s) => ({ key: s.id, label: s.label, value: s.value }))}
            />
          ) : (
            <p className="t-body-s t-muted">Add a social link in the editor to start counting icon clicks.</p>
          )}
        </Card>
        <Card title="Devices" className="a-card--span">
          <SplitBar
            parts={[
              { label: 'Mobile', value: data.devices[0].value, color: SERIES.views.color },
              { label: 'Desktop', value: data.devices[1].value, color: DE_EMPHASIS },
            ]}
          />
          <p className="a-insight t-body-s">
            {percent(mobileShare, 0)} of visitors are on a phone. Keep link titles short so they fit on one line.
          </p>
        </Card>
      </div>
    </main>
  )
}
