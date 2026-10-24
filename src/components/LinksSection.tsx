import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import { hasProtocol, LIMITS, useStore, type LinkItem } from '../store'
import { Button, IconButton, TextField, Toggle } from './ui'
import { Section } from './Section'
import { useToast } from './Toast'
import gripIcon from '../assets/icons/grip.svg'
import moreIcon from '../assets/icons/more.svg'
import linkIcon from '../assets/icons/link.svg'
import trashIcon from '../assets/icons/trash.svg'
import plusIcon from '../assets/icons/plus.svg'

function urlError(url: string) {
  if (!url.trim()) return 'Add a URL so people can open this link.'
  if (!hasProtocol(url)) return 'Add https:// — warna link nahi chalega.'
  return undefined
}

type LinkRowProps = {
  link: LinkItem
  index: number
  total: number
  expanded: boolean
  urlTouched: boolean
  canDuplicate: boolean
  onExpand: (open: boolean) => void
  onTouchUrl: () => void
  onDelete: () => void
  onMove: (to: number) => void
  dragProps: {
    onDragStart: () => void
    onDragEnd: () => void
    onDragOver: (e: DragEvent) => void
    onDrop: () => void
  }
  dragging: boolean
}

function LinkRow({
  link,
  index,
  total,
  expanded,
  urlTouched,
  canDuplicate,
  onExpand,
  onTouchUrl,
  onDelete,
  onMove,
  dragProps,
  dragging,
}: LinkRowProps) {
  const { dispatch } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const number = String(index + 1).padStart(2, '0')
  const error = urlTouched ? urlError(link.url) : undefined

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const onHandleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault()
      onMove(index - 1)
    } else if (e.key === 'ArrowDown' && index < total - 1) {
      e.preventDefault()
      onMove(index + 1)
    }
  }

  const askDelete = () => {
    setMenuOpen(false)
    onExpand(true)
    setConfirmDelete(true)
  }

  return (
    <li
      className={`link-row${expanded ? ' link-row--expanded' : ''}${dragging ? ' link-row--dragging' : ''}${link.visible ? '' : ' link-row--hidden'}`}
      onDragOver={dragProps.onDragOver}
      onDrop={dragProps.onDrop}
    >
      <div className="link-row__row">
        <button
          type="button"
          className="link-row__handle"
          draggable
          aria-label={`Reorder “${link.title}”. Use arrow keys to move.`}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move'
            dragProps.onDragStart()
          }}
          onDragEnd={dragProps.onDragEnd}
          onKeyDown={onHandleKeyDown}
        >
          <img src={gripIcon} alt="" width={20} height={20} />
        </button>
        <span className="t-numeral link-row__index">{number}</span>
        <button type="button" className="link-row__content" aria-expanded={expanded} onClick={() => onExpand(!expanded)}>
          <span className="link-row__title">{link.title || 'Untitled link'}</span>
          <span className="t-caption t-muted link-row__url">{link.url || 'No URL yet'}</span>
        </button>
        <Toggle
          checked={link.visible}
          label={`Show “${link.title}” on page`}
          onChange={(visible) => dispatch({ type: 'link', id: link.id, patch: { visible } })}
        />
        <div className="menu-anchor" ref={menuRef}>
          <IconButton icon={moreIcon} label="More actions" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} />
          {menuOpen && (
            <div className="menu" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onExpand(true)
                }}
              >
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!canDuplicate}
                onClick={() => {
                  setMenuOpen(false)
                  dispatch({ type: 'duplicateLink', id: link.id })
                }}
              >
                Duplicate
              </button>
              <button type="button" role="menuitem" className="menu__danger" onClick={askDelete}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="link-row__form">
          <TextField
            label="Title"
            counter={`${link.title.length}/${LIMITS.linkTitle}`}
            helper="Keep it short — buttons truncate at one line."
            value={link.title}
            maxLength={LIMITS.linkTitle}
            onChange={(e) => dispatch({ type: 'link', id: link.id, patch: { title: e.target.value } })}
          />
          <TextField
            label="URL"
            leadingIcon={linkIcon}
            inputMode="url"
            value={link.url}
            error={error}
            errorAction={
              link.url.trim() && !hasProtocol(link.url) ? (
                <button
                  type="button"
                  className="field__fix"
                  onClick={() => dispatch({ type: 'link', id: link.id, patch: { url: `https://${link.url.trim()}` } })}
                >
                  Fix
                </button>
              ) : undefined
            }
            onChange={(e) => dispatch({ type: 'link', id: link.id, patch: { url: e.target.value } })}
            onBlur={onTouchUrl}
          />
          <div className="link-row__actions">
            {confirmDelete ? (
              <>
                <span className="t-body-s">Delete this link?</span>
                <div className="link-row__confirm">
                  <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={onDelete}>
                    Delete
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" icon={trashIcon} onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
                <Button
                  onClick={() => {
                    onTouchUrl()
                    if (!urlError(link.url)) onExpand(false)
                  }}
                >
                  Done
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

export function LinksSection({ compact }: { compact: boolean }) {
  const { profile, dispatch } = useStore()
  const toast = useToast()
  const { links } = profile
  // Desktop opens on the last link with its URL already validated, as in the design.
  const [expandedId, setExpandedId] = useState<string | null>(compact ? null : (links[3]?.id ?? null))
  const [touched, setTouched] = useState<Set<string>>(() => new Set(compact || !links[3] ? [] : [links[3].id]))
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const full = links.length >= LIMITS.links

  const deleteLink = (link: LinkItem, index: number) => {
    dispatch({ type: 'removeLink', id: link.id })
    setExpandedId(null)
    toast({
      message: `Deleted “${link.title}”`,
      duration: 5000,
      action: { label: 'Undo', onClick: () => dispatch({ type: 'restoreLink', link, index }) },
    })
  }

  const addLink = () => {
    dispatch({ type: 'addLink' })
  }

  // Open the freshly added link for editing.
  const prevCount = useRef(links.length)
  useEffect(() => {
    if (links.length > prevCount.current) setExpandedId(links[links.length - 1].id)
    prevCount.current = links.length
  }, [links])

  const limitNote = `${links.length} of ${LIMITS.links} used${full ? ' — a focused page converts better.' : ''}`

  return (
    <Section
      title="Links"
      count={`${links.length}/${LIMITS.links}`}
      compact={compact}
      gap={12}
      hint="Drag to reorder · toggle to hide without deleting"
    >
      <ol className="link-list">
        {links.map((link, index) => (
          <LinkRow
            key={link.id}
            link={link}
            index={index}
            total={links.length}
            expanded={expandedId === link.id}
            urlTouched={touched.has(link.id)}
            canDuplicate={!full}
            onExpand={(open) => setExpandedId(open ? link.id : null)}
            onTouchUrl={() => setTouched((prev) => new Set(prev).add(link.id))}
            onDelete={() => deleteLink(link, index)}
            onMove={(to) => dispatch({ type: 'moveLink', from: index, to })}
            dragging={dragIndex === index}
            dragProps={{
              onDragStart: () => setDragIndex(index),
              onDragEnd: () => setDragIndex(null),
              onDragOver: (e) => {
                if (dragIndex === null) return
                e.preventDefault()
                if (dragIndex !== index) {
                  dispatch({ type: 'moveLink', from: dragIndex, to: index })
                  setDragIndex(index)
                }
              },
              onDrop: () => setDragIndex(null),
            }}
          />
        ))}
      </ol>

      {compact ? (
        <Button size="l" block icon={plusIcon} disabled={full} onClick={addLink}>
          {full ? `Add link · ${links.length} of ${LIMITS.links} used` : 'Add link'}
        </Button>
      ) : (
        <div className="add-link">
          <Button icon={plusIcon} disabled={full} onClick={addLink} aria-describedby="add-link-note">
            Add link
          </Button>
          <p id="add-link-note" className="t-caption t-muted">
            {limitNote}
          </p>
        </div>
      )}
    </Section>
  )
}
