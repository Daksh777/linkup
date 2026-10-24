# LinkUp · Page Editor

A link-in-bio editor built from the [LinkUp Figma UI kit](https://www.figma.com/design/j3eNGI7yppUQvRP4L5ZdfB/LinkUp---Link-in-Bio-Editor---Profile-UI-Kit--Neon-Brand-System--%7C-The-design-Square--Community-?node-id=5-2943) (frame **02 · Page Editor**). It covers the desktop (≥1200px) and mobile layouts.

## Stack

React 19, TypeScript, Vite, and plain CSS. The design tokens live in `src/index.css`.

## Run

```sh
npm install
npm run dev      # http://localhost:5173
npm run build
```

## What works

- **Profile:** upload or remove the photo; Name, Tagline and Bio have live counters. Pressing Enter in Name sets where the two-tone headline breaks.
- **Links (max 4):** drag the grip to reorder (arrow keys also work). The toggle hides a link without deleting it. The ⋯ menu has edit, duplicate and delete. Each link expands to edit inline. URLs are checked on blur, with a one-tap "Fix" that adds `https://`. Deleting asks for confirmation, then lets you undo for 5 s.
- **Social icons:** an empty field hides that icon on the page.
- **Look & feel:** 4 themes (Neon Night, Lime Lead, Full-bleed Lime, AI Blue), 3 button styles, 3 button shapes, and a Straight or Lean 8° headline.
- **Live preview:** renders the same `PublicProfile` component as the real page, in a Mobile or Desktop frame. On mobile it shows a scaled-down peek card.
- **Autosave:** saves to `localStorage` 600 ms after the last edit; the top bar shows "Saving…" then "All changes saved".
- **Preview / Publish:** Preview opens a full-screen view with working links. Publish only shows a confirmation toast (there's no backend).

## Analytics (`#analytics`)

This tab shows how link analytics would look. It is **frontend-only and uses sample data**: `src/analytics/data.ts` generates 180 days of traffic from a fixed seed, so the numbers don't change between reloads. To use real data, replace `getAnalytics()` with an API call that returns the same shape.

- **Date range** (7 / 30 / 90 days) applies to every number on the page.
- **Stat tiles:** views, link clicks, click-through rate, and unique visitors, each with a trend sparkline and the change vs the previous period.
- **Traffic chart:** daily views and clicks on one axis, with a crosshair tooltip you can also move with the arrow keys.
- **Link performance** uses the links from the editor, so renaming, reordering or hiding a link shows up here.
- **Also included:** traffic sources, devices, top locations, and social icon clicks.
- Every chart has a **Table** view. The chart colors are slightly adjusted brand hues that passed color-blind and contrast checks on the dark background.

## Structure

```
src/
  store.tsx                 profile state, reducer, autosave
  components/
    ui.tsx / ui.css         Button, IconButton, PanelHeader, TextField, Toggle, Segmented, Chip
    PublicProfile.tsx/.css  the public page (themes as CSS variables)
    Section.tsx             desktop section / collapsible mobile card
    ProfileSection, LinksSection, SocialSection, LookSection
    Preview.tsx             live preview, mobile peek, full-screen overlay
    Bars.tsx                Topbar + mobile BottomBar
    Toast.tsx
  analytics/
    data.ts                 seeded sample data + formatters
    charts.tsx              TrafficChart, BarList, SplitBar, Sparkline (hand-rolled SVG/CSS)
    AnalyticsPage.tsx       the dashboard
  assets/                   icons and images exported from Figma
```
