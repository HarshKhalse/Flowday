<div align="center">

# ⚡ FlowDay

### AI-Powered Smart Scheduler for Engineering Students

*Stop letting your day fall apart. FlowDay adapts with you.*

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-5a0fc8?style=flat-square)](https://web.dev/progressive-web-apps/)
[![Claude API](https://img.shields.io/badge/Claude-AI%20Powered-cc785c?style=flat-square)](https://anthropic.com)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)

</div>

---

## The Problem

You have lectures, assignments, labs, projects, and exams all competing for attention. You've tried to-do apps — they require constant manual updates. You've tried timetable apps — they break the moment something unexpected happens. When an unforeseen event disrupts your day, rescheduling everything becomes its own task.

FlowDay is built differently. It understands your schedule in natural language, adapts to changes you speak or type, and keeps your day organized without demanding you to babysit it.

---

## What It Does

**Upload your timetable once.** Take a photo or export a PDF of your college timetable. FlowDay's AI reads it — subject names, timings, room numbers — and builds your entire weekly schedule automatically.

**Talk to it.** Open the AI assistant and say *"Add DSA assignment due Thursday, high priority"* or *"Move my 3 PM session to 5 PM"* or *"Cancel tomorrow's lab."* It understands, acts, and confirms.

**Use your voice.** Tap the mic and speak. No typing required. Works natively in Chrome and Edge.

**Stay in flow.** The built-in Pomodoro timer tracks every focus session against a specific task and logs it to your reports. See exactly where your time goes — by day, week, or month.

**Works offline.** Everything except the AI assistant runs with no internet connection. Your schedule, tasks, timer, and reports are all stored in your browser.

---

## Features at a Glance

| | Feature | What it does |
|---|---------|-------------|
| 📅 | **Today View** | Full day timeline with a live "Now" indicator and priority color coding |
| 📆 | **Week View** | 7-day grid showing all lectures and tasks at once |
| 🗓️ | **Month View** | Calendar view with task density markers per day |
| 🍅 | **Pomodoro Timer** | Focus / short break / long break with auto-advance and session logging |
| 📊 | **Reports** | Weekly bar chart, task-type donut, monthly heatmap, achievements |
| ✅ | **Tasks** | Full task manager with priority filters, search, and direct Pomodoro launch |
| 📤 | **Timetable Upload** | Drag & drop a photo or PDF — AI extracts all lectures automatically |
| 🤖 | **AI Assistant** | Natural language chat for schedule changes, task management, reminders |
| 🎙️ | **Voice Input** | Speak your changes — no typing needed (Chrome/Edge) |
| 🔔 | **Notifications** | Browser push alerts for Pomodoro ends and session completions |
| 💬 | **Daily Quotes** | 30 motivational quotes that rotate every day |
| ⚙️ | **Settings** | Pomodoro config, API key management, data export, clear all |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- npm (comes with Node)
- Chrome or Edge (recommended — required for voice features)

### Local Development

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/flowday.git
cd flowday

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** `npm install` may show deprecation warnings. These come from Vite's internal build tools and don't affect the running app. Run `npm audit fix` (without `--force`) to clean them up.

### Build for Production

```bash
npm run build      # outputs to /dist
npm run preview    # preview the production build locally
```

---

## Deployment (Vercel)

FlowDay deploys to Vercel in under a minute — the same flow as any Vite project.

**Option A — Vercel CLI (fastest)**
```bash
npm install -g vercel
vercel
```
Follow the prompts. Your app gets a live `*.vercel.app` URL instantly.

**Option B — GitHub + Vercel Dashboard (recommended)**

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Vercel auto-detects Vite — no configuration needed
4. Every `git push` to `main` triggers a new deployment automatically

The `vercel.json` in this repo already has the correct build settings and SPA rewrites configured.

---

## Enabling the AI Assistant

By default, the app runs in offline mode with rule-based responses. To unlock full natural language scheduling and timetable image parsing:

1. Get a free API key at [console.anthropic.com](https://console.anthropic.com) → **API Keys**
2. Open FlowDay → **Settings** → paste your key (`sk-ant-...`)
3. Hit **Save Settings** — the AI is now live

> Your API key is stored only in your browser's `localStorage`. It is never sent anywhere except directly to Anthropic's API.

**Without a key,** the AI still responds helpfully using built-in rules for common commands like adding tasks, Pomodoro control, and navigation. Every other feature — Pomodoro, reports, tasks, schedule views — works completely without a key or internet connection.

---

## Voice Commands

Voice input works in Chrome and Edge via the built-in Web Speech API — no library or microphone permission setup beyond the browser prompt.

Tap the 🎙️ mic button anywhere in the app and speak naturally. Examples:

```
"Add OS exam preparation for tomorrow, critical priority"
"Move my 3 PM study block to 5 PM"
"Cancel tomorrow's lab session"
"Start a 25-minute Pomodoro for DBMS project"
"Mark my math assignment as done"
"What's on my schedule today?"
```

---

## Data & Storage

FlowDay stores everything locally in your browser. No account needed, no server, no sync.

| Data | Where | Offline |
|------|-------|---------|
| Tasks | `localStorage` | ✅ Always |
| Schedule & events | `localStorage` | ✅ Always |
| Settings & Pomodoro config | `localStorage` | ✅ Always |
| Focus sessions & logs | `IndexedDB` | ✅ Always |
| Parsed timetable | `IndexedDB` | ✅ Always |
| Claude API key | `localStorage` | ✅ Always |
| AI chat responses | Anthropic API | ❌ Requires internet |
| Cross-device sync | — | ➕ See roadmap |

You can export a full JSON backup from **Settings → Export Data (JSON)** at any time.

---

## Offline & PWA Support

FlowDay is a Progressive Web App. After your first visit, a service worker (powered by Workbox) caches all assets so the app loads and runs with zero internet.

To install it as a native-feeling app:
- **Desktop (Chrome/Edge):** Click the install icon in the address bar
- **Android:** Tap the browser menu → *Add to Home Screen*
- **iOS (Safari):** Tap the Share icon → *Add to Home Screen*

Once installed, FlowDay behaves like a standalone app — no browser chrome, works offline, launches instantly.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite 5 |
| Offline storage | `localStorage` (tasks, settings) + `IndexedDB` via `idb` (sessions) |
| Charts | Chart.js 4 + react-chartjs-2 |
| PWA / Service Worker | vite-plugin-pwa + Workbox |
| Voice Input | Web Speech API (native browser, no external library) |
| AI | Claude API — `claude-sonnet-4-20250514` (chat + vision) |
| Deployment | Vercel |

---

## Project Structure

```
flowday/
├── index.html
├── vite.config.js            ← PWA plugin, service worker config
├── vercel.json               ← Build settings + SPA rewrites
├── package.json
└── src/
    ├── App.jsx               ← Root: page routing, shared Pomodoro state
    ├── main.jsx              ← Entry point, service worker registration
    ├── index.css             ← CSS variables, dark theme, global animations
    │
    ├── components/
    │   ├── Sidebar.jsx       ← Navigation, daily quote, live Pomodoro indicator
    │   ├── TopBar.jsx        ← Page title, view switcher, AI button
    │   └── AIChat.jsx        ← Floating chat panel with voice input
    │
    ├── hooks/
    │   ├── useAI.js          ← Claude API calls + offline rule-based fallback
    │   ├── usePomodoro.js    ← Timer logic, mode switching, IndexedDB logging
    │   └── useVoice.js       ← Web Speech API wrapper (start / stop / errors)
    │
    ├── pages/
    │   ├── TodayView.jsx     ← Schedule timeline, "Now" indicator, widgets
    │   ├── WeekView.jsx      ← 7-day event grid
    │   ├── MonthView.jsx     ← Calendar with task density dots
    │   ├── PomodoroView.jsx  ← Full-page timer with session log
    │   ├── ReportsView.jsx   ← Charts, heatmap, achievements
    │   ├── TasksView.jsx     ← Task CRUD, filters, search, Pomodoro shortcut
    │   ├── UploadView.jsx    ← Drag & drop timetable upload, AI parse preview
    │   └── SettingsView.jsx  ← Profile, Pomodoro config, API key, data tools
    │
    ├── store/
    │   └── storage.js        ← Unified API for localStorage + IndexedDB
    │
    └── utils/
        └── quotes.js         ← 30 daily motivational quotes with rotation
```

---

## Roadmap

Natural next steps if you want to keep building:

- **Google Calendar sync** — push schedule items directly to your calendar
- **Supabase backend** — cross-device sync so your schedule follows you across devices
- **Ollama integration** — run a local LLM (Llama 3, Mistral) so the AI works 100% offline, no API key ever needed
- **Drag and drop** — reorder schedule items by dragging them to new time slots
- **Recurring events** — mark a lecture as repeating every Mon/Wed/Fri automatically
- **Multi-semester support** — save and switch between timetables per semester
- **Smart conflict detection** — AI warns when two tasks overlap or a deadline clashes

---

## Troubleshooting

**Voice input not working**
Voice requires Chrome or Edge. Safari and Firefox do not support the Web Speech API. Make sure you allow microphone access when the browser prompts.

**AI running in offline mode / rule-based responses**
Go to **Settings**, paste your `sk-ant-...` Claude API key, and save. The AI will start using it immediately.

**App not showing latest changes after deploy**
The service worker caches assets aggressively. Hard refresh with `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac) to force reload the latest version.

**`npm install` shows warnings**
Deprecation warnings from `npm install` are from Vite's internal toolchain, not from FlowDay's code. They don't affect the app. Run `npm audit fix` (no `--force`) to clean them up.

---

## License

MIT — use it, fork it, build on it freely.

---

<div align="center">

Built by **Harsh** &nbsp;·&nbsp; Powered by React, Vite & Claude

</div>
