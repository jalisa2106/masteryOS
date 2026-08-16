# Mastery OS 

<div align="center">
  <img src="https://img.shields.io/badge/version-2.0-blue.svg?style=for-the-badge" alt="Version 2.0" />
  <img src="https://img.shields.io/badge/Next.js-16_App_Router-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel" alt="Deployed on Vercel" />
</div>

<br />

> **Mastery OS** is a Personal Upskilling & Gamified Progress Operating System. Designed for autonomous build agents, disciplined developers, and anyone on a long-form learning journey.

Mastery OS is a portfolio-ready, gamified tracking workspace designed to monitor long-form upskilling across multiple independent roadmaps simultaneously. Built on top of **Next.js 16 (App Router)** and styled with premium, responsive glassmorphism themes, it turns your personal roadmap progression into a visually stunning git contribution graph and interactive dashboard.

---

## 📑 Table of Contents
1. [🚀 Architectural Blueprint](#-architectural-blueprint)
2. [✨ Core Features](#-core-features)
3. [🎮 Gamification & Analytics](#-gamification--analytics)
4. [🖼️ Embeddable Widgets API (SVGs)](#️-embeddable-widgets-api-svgs)
5. [🛠️ Tech Stack](#️-tech-stack)
6. [🔐 Login & Authentication (Generalized)](#-login--authentication-generalized)
7. [💻 Setup and Local Development](#-setup-and-local-development)
8. [☁️ Deployment (Vercel)](#️-deployment-vercel)
9. [📂 Project Structure](#-project-structure)

---

## 🚀 Architectural Blueprint

To deploy cleanly on Vercel's hobby tier without paying for or configuring external databases (like PostgreSQL, MongoDB, or Supabase), Mastery OS uses a **pure, database-free flat-JSON persistence engine**. 

* **Reads**: Performed directly from local `/data/*.json` files bundled at build time or fetched locally.
* **Writes (Multi-Environment Storage Adapter)**:
  * **Development (`NODE_ENV=development`)**: Reads and writes directly to the local disk using the Node.js `fs` module. No network required.
  * **Production (`NODE_ENV=production`)**: Commits updated JSON files back to your GitHub repository using the **GitHub REST API (Contents API)** via a fine-grained Personal Access Token (`GITHUB_TOKEN`).
  * **Write-through Caching**: A 3–5 second in-memory and ephemeral `/tmp` cache prevents redundant commits on rapid UI updates.

**Why this matters:** Every step you complete on your roadmap translates directly into a real Git commit, adding a layer of gamification and visualizing discipline directly on your actual GitHub contribution graph.

---

## ✨ Core Features

### 1. Multi-Roadmap Parser
Drop any Markdown roadmap (e.g., `6Month_Mastery_Roadmap.md` or `web-dev-roadmap.md`) into `/data/roadmap-sources/` and trigger the parser.
* **Stable ID Generation**: Auto-hashes nodes using: `node.id = "node-" + sha1(roadmapId + phaseTitle + weekTitle + rawLineText).slice(0, 10)`.
* **Safe History**: Edits or additions to the source markdown preserve historical progress for unchanged lines. Renamed or deleted tasks have their progress archived safely into `progress.json.archived[]` instead of being permanently deleted.

### 2. Premium Visuals & Motion System
* **AAA Video Game Aesthetic**: Bento-grid layouts, dark-mode-first styling with near-black backgrounds (`#08090c`), elevated panel layers (`#101319`), and glassmorphism depth cues (layered blur, 1px inner border highlight, soft outer glow on hover).
* **Dynamic Palette Engine**: The accent system programmatically derives tailored HSL colors from a user's selected primary hue (`lib/theme/deriveAccentPalette.ts`).
* **Motion & Easing**: Choreographed entrances and micro-interactions utilizing custom bezier curve transitions (e.g., `easeOutExpo`, `easeInOutCubic`).
* **Accessibility-First**: Fully optimized animations that dynamically downgrade to opacity crossfades or instant state changes under `prefers-reduced-motion` settings.

### 3. Programmatic Analytics & Local Insights
* **Visualizations**: Heatmaps, radar charts, velocity graphs, and completion forecasting (calculated using local linear regression).
* **Pearson Correlation Engine**: Programmatically computes relationships between variables (e.g., mood, sleep, productivity, energy) entirely locally (`lib/insights/correlations.ts`).
* **Programmatic Weekly Reports**: Fully local, data-backed reports compiled from tracked metrics—**no external LLM/AI APIs are used**, protecting user privacy and preventing text hallucination.

---

## 🎮 Gamification & Analytics

Mastery OS turns learning into a game:
* **Progress Ring**: A large central ring featuring animated count-ups and gradient strokes based on daily/weekly tasks.
* **Daily Deterministic Quotes**: Quotes type out letter-by-letter, configured to never repeat until the entire quote pool is exhausted.
* **Trophy Catalog**: Steam-like achievements featuring tiered rarities (`common`, `rare`, `epic`, `legendary`). Legendary badges are styled with subtle animated shimmer sweeps. Users can drag, drop, and pin up to 6 badges to their public profile showcase.
* **XP & Leveling System**: Earn XP for completing tasks, hitting daily streaks, and logging journal entries. Watch your Mastery Level rise over time.

---

## 🖼️ Embeddable Widgets API (SVGs)

Mastery OS includes public-facing routes (`/api/public/[userId]/...`) designed specifically for portfolio pages and GitHub profile READMEs. These endpoints return **real-time, cache-controlled SVGs** generated dynamically from your flat JSON data files.

### How to use them on your GitHub / Portfolio
Add the following standard Markdown image tags to any markdown file. Replace `your-domain.com` with your Vercel deployment URL and `your-username` with your exact user ID.

```markdown
<!-- Heatmap Activity Grid -->
![Heatmap](https://your-domain.com/api/public/your-username/badge/heatmap)

<!-- Mastery Stats (Level, XP, Tasks) -->
![Mastery Stats](https://your-domain.com/api/public/your-username/badge/stats)

<!-- Daily Streak -->
![Streak](https://your-domain.com/api/public/your-username/badge/streak)

<!-- Roadmap Completion Progress -->
![Completion](https://your-domain.com/api/public/your-username/badge/completion)

<!-- Mastery Level Badge -->
![Mastery Level](https://your-domain.com/api/public/your-username/badge/masteryLevel)

<!-- Trophy Showcase (Top 3 Recent Achievements) -->
![Showcase](https://your-domain.com/api/public/your-username/badge/showcase)
```

**Privacy Control**: These widgets are strictly controlled via your user `settings.json`. Ensure `settings.publicProfile` is set to `true`, and toggle individual widgets on/off within the `settings.publicWidgets` object. If a widget is turned off, the API returns a 403 Forbidden response.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 16 (App Router) — Leverages Server Components and Edge Runtime for lightning-fast delivery.
* **Language**: TypeScript — Strict typing for AST parsing, component props, and API boundaries.
* **State Management**: Zustand — Minimalist, unopinionated global state management for UI toggles and local caches.
* **Styling & UI**: TailwindCSS 4 + Shadcn/ui + Framer Motion — A powerful triad for building accessible, stunning, and highly animated interfaces.
* **Visualizations**: Recharts + React Flow — Used for rendering analytics dashboards and interactive knowledge graphs.
* **Edge Image Generation**: `@vercel/og` (Satori) — Used for dynamic Open Graph (OG) image generation and complex stat cards.
* **API Client**: Octokit — Powers the GitHub REST API integration for the flat-JSON persistence engine.

---

## 🔐 Login & Authentication (Generalized)

To keep the UI perfectly clean and prevent unauthorized database writes, Mastery OS uses a **headless authentication gate** with zero visual login forms. 

1. **Access Denied Screen**: When you (or anyone else) visits the root URL, you are greeted with an unmounted, generic dashboard DOM.
2. **Developer Console Login**: Access is granted *only* by executing a function exposed to the browser's developer console.

### How to Login
Open your browser developer console (`F12` or `Ctrl+Shift+I`), type the following, and hit Enter:

```javascript
window.getAccess('your-username')
```
*Note: `your-username` must exactly match the folder name you created inside `/data/users/`.*

### Security Hardening
- **JWT Sessions**: The API issues a session cookie signed via SHA-256 HMAC utilizing your `SESSION_SECRET`.
- **Cookie Policies**: Cookies are configured as `httpOnly`, `secure`, and `sameSite=lax`. 
- **Strict Verification**: Private API routes resolve user context *only* from verified JWT payload tokens (ignoring any manipulated URL query parameters). 
- **Path Traversal Protection**: Directory path resolution is protected via a strict user ID whitelist (derived from the `data/users/` directory).

---

## 💻 Setup and Local Development

### 1. Clone the repository
```bash
git clone https://github.com/your-username/mastery-os.git
cd mastery-os
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create your User Profile
Create a directory for your user data (e.g., `data/users/your-username/`). You will need to create initial JSON schemas for `settings.json`, `progress.json`, `journal.json`, etc. (You can duplicate an existing user folder to start).

### 4. Set up environment variables
Create a `.env.local` file in the root directory:
```env
# GitHub token with repository write permissions (for production writes)
GITHUB_TOKEN=your_github_pat_here

# Secret for signing session cookies
SESSION_SECRET=a_secure_long_random_string_here

# Your GitHub Username and Repository Name
GITHUB_OWNER=your-github-username
GITHUB_REPO=mastery-os
```

### 5. Run the development server
```bash
npm run dev
```

Navigate to `http://localhost:3000` and use the `window.getAccess('your-username')` command in your console to log in.

---

## ☁️ Deployment (Vercel)

Mastery OS is fully optimized for Vercel's Hobby tier. 

1. **Push your code to GitHub.**
2. **Import the repository into Vercel.**
3. **Configure Environment Variables**: In your Vercel Project Settings, add the following Environment Variables. **This is critical** for the production storage adapter to write back to your repository:
   * `GITHUB_TOKEN` (Must have `repo` scope)
   * `GITHUB_OWNER` (e.g., `Sp2736`)
   * `GITHUB_REPO` (e.g., `mastery-os`)
   * `SESSION_SECRET` (A strong, random cryptographic string)
4. **Deploy**.

*Because of the write-through cache and Vercel's Edge Network, your app will feel instantaneous, and your Git commit history will reflect your learning journey!*

---

## 📂 Project Structure

```text
├── app/
│   ├── (gate)/                # Access Denied page + headless auth
│   ├── (app)/                 # Authenticated application workspace
│   │   ├── dashboard/         # Main progress ring & today's tasks
│   │   ├── journey/           # Gamification (levels, achievements, catalog)
│   │   ├── daily-review/      # Journaling and Pearson correlations
│   │   ├── retrospective/     # Weekly reflections
│   │   ├── analytics/         # Recharts data visualization suite
│   │   ├── graph/             # React Flow knowledge graph
│   │   └── settings/          # User privacy and widget configuration
│   └── api/
│       ├── auth/session       # Console login handler (JWT Issuer)
│       ├── admin/reparse      # Reparses markdown roadmaps
│       └── public/[userId]/   # README SVG badges & widget APIs
├── components/                # Shared layout & UI bento components
├── lib/
│   ├── storage/               # Multi-env Git-backed JSON storage engine
│   ├── parser/                # Markdown-to-Roadmap AST parser
│   ├── scoring/               # Gamification & XP algorithms
│   ├── insights/              # Pearson correlation & pace forecasting engine
│   └── motion/                # Motion easing, duration tokens, a11y hooks
├── data/                      # Global & user-specific flat JSON databases
└── scripts/                   # Seeding and background parsing scripts
```
