# TyagiHub — Complete Project Documentation

**Brand:** Tyagi MultiTech  
**Platform:** TyagiHub  
**Domain:** tyagihub.in  
**Stack:** Jekyll + HTML5 + CSS3 + Vanilla JS  
**Status:** Phase 1 — Frontend Architecture Complete

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Architecture](#project-architecture)
3. [Folder Structure](#folder-structure)
4. [Design System](#design-system)
5. [Pages & Sections](#pages--sections)
6. [SEO Structure](#seo-structure)
7. [Performance](#performance)
8. [Font Setup](#font-setup)
9. [Deployment Guide](#deployment-guide)
10. [Future Backend Integration](#future-backend-integration)
11. [Security Rules](#security-rules)

---

## Quick Start

### Prerequisites
- Ruby 3.x
- Bundler gem: `gem install bundler`

### Local Development
```bash
# 1. Install dependencies
bundle install

# 2. Serve locally (hot reload)
bundle exec jekyll serve --livereload

# 3. Open browser
# http://localhost:4000
```

### Build for Production
```bash
bundle exec jekyll build
# Output: _site/ folder (upload this to any static host)
```

---

## Project Architecture

### Why Jekyll?
- Static site — works on GitHub Pages, Netlify, Vercel, VPS, Nginx/Apache
- No runtime server needed for core content
- Liquid templating for reusable layouts/includes
- Simple migration path to Node.js backend later

### Architecture Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Framework | Jekyll | Static-first, GitHub Pages native |
| CSS | Pure CSS with Custom Properties | No build step, portable, fast |
| JS | Vanilla ES6+ | Zero dependencies, max performance |
| Fonts | Local woff2 files | No CDN, works offline |
| Icons | SVG inline / Emoji | No icon library needed |
| Analytics | None | Privacy-first |
| Tracking | None | No external scripts |

### Design System Approach
- CSS Custom Properties (variables) for all tokens
- BEM-lite naming convention
- Mobile-first responsive grid
- Dark theme default with light theme ready via `[data-theme="light"]`

---

## Folder Structure

```
tyagihub/
│
├── _config.yml              # Jekyll configuration
├── _layouts/
│   ├── default.html         # Main layout (navbar + footer)
│   └── post.html            # Blog post layout
│
├── _includes/
│   ├── navbar.html          # Top navigation bar
│   ├── mobile-nav.html      # Mobile slide menu
│   ├── footer.html          # Site footer
│   └── seo-meta.html        # SEO meta tags helper
│
├── _posts/                  # Blog posts (Markdown)
│   └── 2024-01-15-example.md
│
├── assets/
│   ├── css/
│   │   ├── main.css         # Full design system
│   │   └── fonts.css        # @font-face declarations
│   ├── js/
│   │   └── main.js          # All JS modules
│   ├── fonts/               # Local woff2 font files (see FONTS-README.txt)
│   ├── images/
│   │   ├── logo.svg
│   │   └── favicon.svg
│   ├── icons/               # Custom SVG icons
│   ├── vendor/              # Future: local copies of libraries
│   └── videos/              # Future: video assets
│
├── index.html               # Homepage
├── 404.html                 # Error page
├── robots.txt
├── site.webmanifest
├── Gemfile
│
├── about/index.html
├── learn/index.html
├── editor/index.html
├── tools/index.html
├── stock/index.html
├── apps/index.html
├── shield/index.html
├── blog/index.html
└── docs/index.html
```

---

## Design System

### Color Tokens (`assets/css/main.css`)

| Variable | Value | Use |
|----------|-------|-----|
| `--clr-bg` | `#0a0c10` | Page background |
| `--clr-accent` | `#f5a623` | Brand amber/saffron |
| `--clr-accent-2` | `#ff7c3a` | Hover accent |
| `--clr-learn` | `#3ecfcf` | Learn section |
| `--clr-editor` | `#a78bfa` | Editor section |
| `--clr-tools` | `#f5a623` | Tools section |
| `--clr-stock` | `#34d399` | Stock section |
| `--clr-apps` | `#60a5fa` | Apps section |
| `--clr-shield` | `#f87171` | Shield section |

### Typography Scale
- `--font-display`: SpaceGrotesk (headings)
- `--font-body`: Outfit (body text)
- `--font-mono`: JetBrainsMono (code)

### Key CSS Classes

```css
/* Layout */
.container      /* max-width wrapper */
.grid-2/3/4     /* responsive grids */
.flex-center    /* flex center */

/* Typography */
.text-hero      /* hero heading */
.text-accent    /* amber text */
.section-label  /* uppercase label */

/* Components */
.btn-primary    /* amber CTA button */
.btn-outline    /* bordered button */
.service-card   /* platform cards */
.tool-card      /* horizontal tool cards */
.blog-card      /* blog preview cards */
.app-card       /* app listing cards */

/* Animation */
.reveal         /* scroll reveal base */
.reveal-delay-N /* staggered delays */
```

---

## Pages & Sections

### Homepage (`index.html`)

10 sections in order:
1. **Hero** — Title, subtitle, CTA buttons, stats bar
2. **Search** — Global search bar with quick tags
3. **Service Cards** — 6 platform cards (Learn, Editor, Tools, Stock, Apps, Shield)
4. **Featured Tools** — 8 tool quick-links
5. **Featured Learning** — 3 course cards
6. **Featured Stock** — 4 asset categories
7. **Latest Apps** — 4 Android apps
8. **Shield Section** — Cybersecurity awareness
9. **Blog Preview** — 3 recent posts
10. **CTA Banner** — Final call to action

### Sub-pages
| Page | File | Purpose |
|------|------|---------|
| Learn | `learn/index.html` | Course listings |
| Editor | `editor/index.html` | Design tool intro |
| Tools | `tools/index.html` | Tool directory |
| Stock | `stock/index.html` | Asset browser |
| Apps | `apps/index.html` | App downloads |
| Shield | `shield/index.html` | Security hub |
| Blog | `blog/index.html` | Post listing |
| Docs | `docs/index.html` | Documentation |
| About | `about/index.html` | Company page |

---

## SEO Structure

### URL Structure
```
/tools/pdf-compressor/
/tools/background-remover/
/learn/gk-quiz/
/learn/maths-practice/
/apps/diagx/
/blog/post-title/
/shield/scam-alerts/
```

### Meta Tags (in `_layouts/default.html`)
- `<title>` with page + site name
- `<meta name="description">`
- `<meta name="keywords">`
- OpenGraph (`og:title`, `og:description`, `og:image`, `og:url`)
- Twitter Card (`twitter:card`, `twitter:title`, etc.)
- JSON-LD structured data (Organization schema)
- Canonical URLs

### Sitemap
`jekyll-sitemap` plugin auto-generates `/sitemap.xml`

### Robots
`/robots.txt` — allows all crawlers, links to sitemap

---

## Performance

### What's Optimized
- **No external requests** — all assets local
- **System font fallback** — works before custom fonts load
- **IntersectionObserver** — scroll reveal, lazy loading, counter animation
- **Debounced scroll** — navbar scroll listener is debounced
- **CSS transitions** — hardware-accelerated (transform, opacity only)
- **`font-display: swap`** — text visible before custom fonts
- **`defer` JS loading** — scripts don't block HTML parse
- **No jQuery** — pure vanilla JS, ~7KB total JS

### Performance Budget Target
- First Contentful Paint: < 1.2s
- Largest Contentful Paint: < 2.5s
- Total Blocking Time: < 100ms
- Cumulative Layout Shift: < 0.1

---

## Font Setup

Fonts are **not included** in the repo (file size).  
Download and place in `/assets/fonts/`:

```
Outfit-Regular.woff2
Outfit-Medium.woff2
Outfit-SemiBold.woff2
Outfit-Bold.woff2

SpaceGrotesk-Regular.woff2
SpaceGrotesk-Medium.woff2
SpaceGrotesk-SemiBold.woff2
SpaceGrotesk-Bold.woff2

JetBrainsMono-Regular.woff2
JetBrainsMono-Medium.woff2
```

**Download from:** https://gwfh.mranftl.com/fonts  
*(Google Fonts Helper — generates local woff2 files)*

Without fonts, the site falls back gracefully to system sans-serif.

---

## Deployment Guide

### GitHub Pages
```bash
# 1. Create repo: tyagimultitech/tyagihub
# 2. Push code
git init
git add .
git commit -m "Initial TyagiHub frontend"
git remote add origin https://github.com/TyagiMultiTech/tyagihub.git
git push -u origin main

# 3. GitHub Settings → Pages → Source: main branch
# 4. Custom domain: tyagihub.in
```

### Nginx (VPS)
```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name tyagihub.in www.tyagihub.in;

    root /var/www/tyagihub/_site;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA-style fallback
    error_page 404 /404.html;

    location / {
        try_files $uri $uri/ $uri.html =404;
    }
}
```

### Cloudflare (Recommended)
1. Deploy `_site/` to Cloudflare Pages
2. Connect custom domain `tyagihub.in`
3. Enable: Brotli, HTTP/2, Auto Minify

---

## Future Backend Integration

### Planned Architecture
```
tyagihub.in          → Static Jekyll frontend (current)
api.tyagihub.in      → Node.js Express backend (future)
auth.tyagihub.in     → Authentication service (future)
cdn.tyagihub.in      → Asset CDN (future)
admin.tyagihub.in    → Admin dashboard (future)
```

### Backend Hook Points
All future backend integration points are marked in code with:
```js
// [BACKEND-HOOK]: description
```

Key locations:
- `assets/js/main.js` — `API` object (stub, flip `ENABLED` flag)
- `_includes/navbar.html` — Sign In button (connect to auth.tyagihub.in)
- `SearchBar` module — connect to `GET /api/v1/search?q=`
- `Toast` system — ready to display API responses

### API Client (pre-built stub)
```js
// In main.js — flip ENABLED to true when backend is ready
const API = {
  get:  (endpoint) => fetch(`https://api.tyagihub.in/v1${endpoint}`),
  post: (endpoint, body) => fetch(...)
};
```

### Authentication Flow (future)
```
1. User clicks Sign In → redirect to auth.tyagihub.in/login
2. Auth server issues JWT token
3. Token stored in httpOnly cookie
4. Frontend reads user data from /api/v1/me
5. Navbar updates to show user avatar
```

### Comments System (future)
```
Option A: Build custom with Node.js + MongoDB
Option B: Use Disqus-alternative (self-hosted Isso)
Backend hook: POST /api/v1/comments
```

---

## Security Rules

✅ No external CDN links  
✅ No Google Analytics  
✅ No Facebook Pixel  
✅ No hidden telemetry  
✅ No exposed API keys  
✅ No user data collected (Phase 1)  
✅ robots.txt blocks admin paths  
✅ CSP-ready HTML structure  

### Recommended CSP Header (add to Nginx/Cloudflare)
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self';
  style-src 'self';
  font-src 'self';
  img-src 'self' data:;
  connect-src 'self' https://api.tyagihub.in;
```

---

## Contact & Credits

**Brand:** Tyagi MultiTech  
**Platform:** TyagiHub  
**Built with:** Jekyll, HTML5, CSS3, Vanilla JS  
**License:** Proprietary — Tyagi MultiTech  
**Made in:** Meerut, Uttar Pradesh, India 🇮🇳
