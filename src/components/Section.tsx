import { useId, useState, type ReactNode } from 'react'
import { PanelHeader } from './ui'

type SectionProps = {
  title: string
  count?: string
  /** Mobile: renders as a collapsible card. */
  compact: boolean
  defaultOpen?: boolean
  /** Gap between items on desktop (mobile cards always use 16px). */
  gap: number
  /** Extra line under the desktop header. */
  hint?: string
  children: ReactNode
}

export function Section({ title, count, compact, defaultOpen = true, gap, hint, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()

  if (compact) {
    return (
      <section className="card">
        <PanelHeader title={title} count={count} expanded={open} onToggle={() => setOpen(!open)} controls={bodyId} />
        {open && (
          <div id={bodyId} className="card__body">
            {children}
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="section" style={{ gap }}>
      {hint ? (
        <div className="section__header-group">
          <PanelHeader title={title} count={count} />
          <p className="t-body-s t-muted">{hint}</p>
        </div>
      ) : (
        <PanelHeader title={title} count={count} />
      )}
      {children}
    </section>
  )
}
