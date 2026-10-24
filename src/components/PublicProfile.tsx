import type { CSSProperties, ReactNode } from 'react'
import { toHref, type Profile, type SocialId } from '../store'
import { resolveTheme, themeStyle } from '../theme'
import logoBadge from '../assets/img/logo-badge.png'
import stickerTail from '../assets/icons/sticker-tail.svg'
import shareIcon from '../assets/icons/share.svg'
import mapPin from '../assets/icons/map-pin.svg'
import chevronRight from '../assets/icons/chevron-right.svg'
import instagram from '../assets/icons/social-instagram.svg'
import linkedin from '../assets/icons/social-linkedin.svg'
import youtube from '../assets/icons/social-youtube.svg'
import whatsapp from '../assets/icons/social-whatsapp.svg'
import globe from '../assets/icons/social-globe.svg'
import './PublicProfile.css'

const SOCIALS: { id: SocialId; label: string; icon: string }[] = [
  { id: 'instagram', label: 'Instagram', icon: instagram },
  { id: 'linkedin', label: 'LinkedIn', icon: linkedin },
  { id: 'youtube', label: 'YouTube', icon: youtube },
  { id: 'whatsapp', label: 'WhatsApp community', icon: whatsapp },
  { id: 'website', label: 'Website', icon: globe },
]

const DEVANAGARI = /[ऀ-ॿ]/

/**
 * Glyph icons are recoloured per theme (the Figma "Glyph stroke"), so they are
 * drawn through a CSS mask of the exported SVG rather than an <img>.
 */
function Glyph({ src, size, width = size, height = size, className }: { src: string; size?: number; width?: number; height?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`pp-glyph${className ? ` ${className}` : ''}`}
      style={{ width, height, maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` } as CSSProperties}
    />
  )
}

/** Devanagari words switch to Teko; Latin caps inside them (e.g. "AI") take the primary text colour. */
function Kicker({ text }: { text: string }) {
  const parts = text.split(/(\s+)/)
  return (
    <p className="pp-kicker">
      {parts.map((word, i) => {
        if (!DEVANAGARI.test(word)) return <span key={i}>{word}</span>
        return (
          <span key={i} className="pp-kicker__deva">
            {word.split(/([A-Z]+)/).map((run, j) =>
              /^[A-Z]+$/.test(run) ? (
                <span key={j} className="pp-kicker__latin">
                  {run}
                </span>
              ) : (
                run
              ),
            )}
          </span>
        )
      })}
    </p>
  )
}

/** Enter in the Name field inserts the break; otherwise the first word sits on line one. */
function splitName(name: string): [string, string] {
  const trimmed = name.trim()
  if (trimmed.includes('\n')) {
    const [first, ...rest] = trimmed.split('\n')
    return [first, rest.join(' ')]
  }
  const space = trimmed.indexOf(' ')
  return space === -1 ? [trimmed, ''] : [trimmed.slice(0, space), trimmed.slice(space + 1)]
}

type LinkTagProps = { href: string; interactive: boolean; children: ReactNode; className: string; 'aria-label'?: string }

function LinkTag({ href, interactive, children, ...rest }: LinkTagProps) {
  return interactive ? (
    <a href={href} target="_blank" rel="noreferrer" {...rest}>
      {children}
    </a>
  ) : (
    <span {...rest}>{children}</span>
  )
}

type PublicProfileProps = {
  profile: Profile
  /** Links are inert inside the editor preview. */
  interactive?: boolean
  className?: string
}

export function PublicProfile({ profile, interactive = false, className }: PublicProfileProps) {
  const { look } = profile
  const [line1, line2] = splitName(profile.name)
  const links = profile.links.filter((l) => l.visible && l.title.trim())
  const socials = SOCIALS.filter((s) => profile.socials[s.id].trim())

  return (
    <div
      className={`pp pp--btn-${look.buttonStyle} pp--headline-${look.headline}${className ? ` ${className}` : ''}`}
      style={themeStyle(resolveTheme(look))}
    >
      <div className="pp__glow pp__glow--primary" />
      <div className="pp__glow pp__glow--secondary" />

      <div className="pp__topbar">
        <img src={logoBadge} alt="The Design Square" width={56} height={56} className="pp__logo" />
        <button type="button" className="pp__square-btn" aria-label="Share" tabIndex={interactive ? 0 : -1}>
          <Glyph src={shareIcon} size={24} />
        </button>
      </div>

      <div className="pp__hero">
        <div className="pp__avatar-cluster">
          <div className="pp__avatar">
            {profile.photo && <img src={profile.photo} alt={profile.name.replace('\n', ' ')} />}
          </div>
          <div className="pp__sticker">
            <span className="pp__sticker-bubble">गपशप</span>
            <Glyph src={stickerTail} width={38} height={12} className="pp__sticker-tail" />
          </div>
        </div>

        <div className="pp__intro">
          <div className="pp__identity">
            {profile.tagline.trim() && <Kicker text={profile.tagline} />}
            <h1 className="pp__name">
              <span>{line1}</span>
              {line2 && <span className="pp__name-accent">{line2}</span>}
            </h1>
          </div>
          {profile.bio.trim() && <p className="pp__bio">{profile.bio}</p>}
          {profile.location && (
            <p className="pp__location">
              <Glyph src={mapPin} size={16} />
              {profile.location}
            </p>
          )}
          <div className="pp__pillars">
            {profile.pillars.map((pillar, i) => (
              <span key={pillar} className={`pp__chip${i === profile.pillars.length - 1 ? ' pp__chip--neon' : ''}`}>
                {pillar}
              </span>
            ))}
          </div>
        </div>
      </div>

      {links.length > 0 && (
        <div className="pp__links">
          {links.map((link) => (
            <LinkTag key={link.id} interactive={interactive} href={toHref(link.url)} className="pp__link">
              <span className="pp__link-label">{link.title}</span>
              <Glyph src={chevronRight} size={24} />
            </LinkTag>
          ))}
        </div>
      )}

      {socials.length > 0 && (
        <div className="pp__social">
          {socials.map((s) => (
            <LinkTag key={s.id} interactive={interactive} href={toHref(profile.socials[s.id])} className="pp__square-btn" aria-label={s.label}>
              <Glyph src={s.icon} size={24} />
            </LinkTag>
          ))}
        </div>
      )}

      <footer className="pp__footer">
        <p className="pp__tagline">Sab kuch, ek Square mein.</p>
        <p className="pp__made">Made with LinkUp</p>
      </footer>
    </div>
  )
}
