# CLAUDE.md — The Node

## Project Overview

**The Node** is a static HTML landing page for an intimate community platform aimed at product marketing leaders (PMMs). It features a minimal, elegant design with no build tooling, dependencies, or backend.

The repository contains exactly three meaningful files:

| File | Purpose |
|------|---------|
| `index.html` | The complete landing page (HTML + embedded CSS, 80 lines) |
| `Golden-Gate-Bridge.jpg` | Hero image asset displayed in the page |
| `.DS_Store` | macOS system file (should be ignored; not meaningful) |

---

## Architecture

This is a **zero-dependency static site**:

- No JavaScript frameworks or libraries
- No build tools (Webpack, Vite, Parcel, etc.)
- No package manager (no `package.json`)
- No backend or API
- No database
- All CSS is embedded in a single `<style>` block inside `index.html`
- One external dependency: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) font via Google Fonts CDN

The page can be opened directly in a browser or served by any static file host with zero configuration.

---

## Design System

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Brand primary | `#992921` | Logo, headings, buttons, highlights |
| Brand hover | `#6f1f19` | Button hover state |
| Accent/border | `#c3d6de` | Borders, section dividers, image box |
| Background | `#FFFAF5` | Page background (warm off-white) |
| Body text | `#555` / `#666` | Paragraph text, nav links |
| Heading text | `#333` | H1, H2 headings |

### Typography
- **Font family:** Space Grotesk (weights 400, 500, 600, 700)
- **H1:** 68px / weight 700 / line-height 1.1 (desktop); 48px (mobile)
- **H2:** 42px / weight 700
- **H3 (feature titles):** 16px / weight 700 / uppercase / letter-spacing 1px
- **Body:** 17px / line-height 1.8
- **Small:** 13–14px / uppercase / letter-spacing

### Layout
- Desktop: 2-column hero grid (`1fr 1fr`), 3-column features grid (`repeat(3, 1fr)`)
- Mobile breakpoint: `max-width: 1024px` — single column for both sections
- Base horizontal padding: `60px` (desktop), `40px` (mobile)

### CSS Conventions
- All styles live in a single `<style>` tag in `<head>` — do not introduce external stylesheets unless there is a compelling reason
- Simple, flat class names: `.header`, `.hero`, `.features`, `.feature`, `.cta`, `.image-box`, `.logo`, `.nav`, `.highlight`
- No IDs used for styling
- No inline styles
- CSS reset at top: `* { margin: 0; padding: 0; box-sizing: border-box; }`

---

## Page Sections

1. **Header** (`.header`) — Logo left, nav links right
2. **Hero** (`.hero`) — H1 headline + body copy + CTA button on the left; image on the right
3. **Features** (`.features`) — Three `.feature` cards side by side
4. **CTA** (`.cta`) — Centered closing call-to-action with second button

---

## Development Workflow

### Running Locally
No build step required. Open the file directly:

```bash
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

Or serve with any static file server:

```bash
npx serve .              # using Node/npm if available
python3 -m http.server   # using Python
```

### Making Changes
1. Edit `index.html` directly — HTML and CSS are co-located
2. Refresh the browser to see changes
3. Test at both desktop (>1024px) and mobile (<1024px) widths

### Deploying
This site can be deployed to any static hosting platform with zero configuration:
- **GitHub Pages** — push to `gh-pages` branch or configure Pages in repo settings
- **Netlify** — drag-and-drop the folder or connect the repo
- **Vercel** — `vercel deploy` from the repo root
- **AWS S3** — upload files to an S3 bucket with static website hosting enabled

---

## Code Conventions

- Keep all HTML and CSS in `index.html` unless the file grows significantly
- Preserve the existing flat, readable class-naming style
- Do not introduce JavaScript unless specifically requested — the page is intentionally static
- Do not add external CSS frameworks (Bootstrap, Tailwind, etc.) without explicit approval
- Maintain the existing color palette and design language for any additions
- The `.DS_Store` file is committed by mistake — add a `.gitignore` if modifying the repo to prevent future macOS system files from being tracked

---

## Known Issues / Tech Debt

- `.DS_Store` is tracked in git. A `.gitignore` should be added containing:
  ```
  .DS_Store
  ```
- The `<button>` elements have no `href` or form action — they are non-functional placeholders
- No `<meta>` description or Open Graph tags for social sharing
- No favicon
- Navigation links (About, Dinners, Community) are `<span>` elements with no `href` — they are visual placeholders only
- No accessibility attributes (e.g., `aria-label`) on the CTA buttons

---

## Git Conventions

- Commit messages are short and descriptive (e.g., "Update index.html", "New golden gate bridge photo")
- All development has occurred on `master` (single developer, no branching strategy enforced)
- There is no PR or code review process currently in use
