# VIEWZ — Agent Build Guide

> **Read this entire document before writing a single line of code.**
> This is the single source of truth for architecture, structure, naming, design, and behavior.
> Assume the React (Vite) frontend and Node.js backend base projects are already initialized.
> Your job is to build on top of them — not scaffold from scratch.

---

## 1. System Overview

**ViewZ** is a headless link-opening engine. A user pastes a URL, sets a repeat count and delay, clicks **Proceed**, and the system silently opens that URL the specified number of times inside a server-side sandboxed headless Chromium — completely invisible to the user's browser. The user watches a real-time progress UI tick from `0 / N` to `N / N`, then sees a success modal.

No tabs open on the user's machine. Ever.

---

## 2. Tech Stack

### Frontend
| Concern | Choice |
|---|---|
| Framework | React 18 (Vite) |
| Styling | Tailwind CSS v3 |
| Real-time | Socket.IO Client |
| HTTP | Axios |
| Fonts | `Space Mono` (display/code feel) + `DM Sans` (body) — load via Google Fonts |
| Animations | Framer Motion |

### Backend
| Concern | Choice |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| Real-time | Socket.IO (server) |
| Job Queue | BullMQ |
| In-memory store | Redis (via `ioredis`) |
| Headless browser | Puppeteer |
| Process manager | `concurrently` (dev), PM2 (prod) |
| Env config | `dotenv` |

### Infrastructure
| Concern | Choice |
|---|---|
| Containerization | Docker + Docker Compose |
| Redis | Official `redis:alpine` Docker image |
| Puppeteer sandbox | Runs inside the Node container with `--no-sandbox` flag (Docker handles isolation) |

---

## 3. File Structure

Assume both `/frontend` and `/backend` root folders already exist with base Vite/Node init files.

```
viewz/
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css                  ← global styles, CSS vars, font imports
│   │   ├── components/
│   │   │   ├── InputPanel.jsx         ← URL + count + delay form
│   │   │   ├── ProgressDisplay.jsx    ← live counter + progress bar
│   │   │   ├── SuccessModal.jsx       ← completion overlay
│   │   │   ├── LogFeed.jsx            ← optional scrolling log of each hit
│   │   │   └── StatusBadge.jsx        ← idle / running / done pill
│   │   ├── hooks/
│   │   │   └── useViewZSocket.js      ← all Socket.IO logic + state
│   │   ├── lib/
│   │   │   └── api.js                 ← axios instance + POST /start
│   │   └── constants/
│   │       └── theme.js               ← color tokens as JS constants
│   └── package.json
│
├── backend/
│   ├── server.js                      ← Express + Socket.IO bootstrap
│   ├── queue.js                       ← BullMQ queue definition
│   ├── worker.js                      ← BullMQ worker + Puppeteer logic
│   ├── routes/
│   │   └── session.js                 ← POST /api/start, GET /api/status/:id
│   ├── lib/
│   │   └── redis.js                   ← ioredis client singleton
│   ├── validators/
│   │   └── urlValidator.js            ← URL sanitization + block-list
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml
└── GUIDE.md                           ← this file
```

---

## 4. App Flow

### Step-by-step

```
[User] fills InputPanel
    URL:    https://example.com
    Count:  1000
    Delay:  500ms

[User] clicks Proceed
    → frontend calls POST /api/start { url, count, delay }
    → frontend opens Socket.IO connection, joins room: sessionId

[Backend: server.js]
    → validates URL via urlValidator.js
    → creates a BullMQ job { url, count, delay, sessionId }
    → responds { sessionId }

[Backend: worker.js — BullMQ Worker]
    loop i = 1 to count:
        → Puppeteer: browser.newPage() → page.goto(url) → page.close()
        → wait `delay` ms
        → emit via Socket.IO: { event: "progress", current: i, total: count, sessionId }

    → on complete: emit { event: "done", sessionId }
    → on error:    emit { event: "error", message, sessionId }

[Frontend: useViewZSocket.js]
    → listens for "progress" → updates counter state
    → listens for "done"     → triggers SuccessModal
    → listens for "error"    → shows error state

[User sees]
    Progress bar: ████████░░░░ 347 / 1000
    On done: SuccessModal overlay
```

### Socket.IO Event Contract

| Event name | Direction | Payload |
|---|---|---|
| `join` | client → server | `{ sessionId }` |
| `progress` | server → client | `{ current, total, sessionId }` |
| `done` | server → client | `{ sessionId, total }` |
| `error` | server → client | `{ sessionId, message }` |

---

## 5. Backend Implementation Notes

### `server.js`
- Bootstrap Express on `PORT` from `.env` (default `3001`)
- Attach Socket.IO to the same HTTP server with CORS `origin: process.env.FRONTEND_URL`
- On `connection`, listen for `join` event and add socket to room `sessionId`
- Import and expose `io` instance so `worker.js` can emit to rooms

### `queue.js`
- Create a single BullMQ `Queue` named `"viewz-sessions"` using the ioredis connection from `lib/redis.js`
- Export the queue instance

### `worker.js`
- Create a BullMQ `Worker` consuming `"viewz-sessions"`
- Inside the processor function:
  - Launch `puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })`
  - Loop `count` times with `delay` ms gap using `setTimeout` wrapped in a Promise
  - After each iteration emit `progress` via Socket.IO room `sessionId`
  - On loop completion emit `done`
  - Always call `browser.close()` in a `finally` block
- Set BullMQ concurrency to `3` maximum simultaneous jobs

### `validators/urlValidator.js`
- Reject if not a valid URL (`new URL(input)` throws)
- Block: `localhost`, `127.x.x.x`, `192.168.x.x`, `10.x.x.x`, `0.0.0.0`, `file://` scheme
- Allow only `http:` and `https:` schemes
- Export a single `validateUrl(url): { valid: boolean, reason?: string }` function

### `routes/session.js`
- `POST /api/start` — validate body `{ url, count, delay }`, call `validateUrl`, add job to queue, return `{ sessionId, queued: true }`
- `count` max: `10000`, min: `1`
- `delay` max: `60000`ms, min: `0`ms
- `sessionId` = `crypto.randomUUID()`

---

## 6. Frontend Implementation Notes

### `useViewZSocket.js` (custom hook)
Returns: `{ status, current, total, error, startSession }`

- `status`: `"idle" | "running" | "done" | "error"`
- `startSession(url, count, delay)`: calls `api.js` POST, then connects socket, joins room
- Cleans up socket on unmount

### `InputPanel.jsx`
- Three inputs: URL (text), Count (number, 1–10000), Delay ms (number, 0–60000)
- Proceed button disabled while `status === "running"`
- On submit calls `startSession` from hook

### `ProgressDisplay.jsx`
- Only renders when `status !== "idle"`
- Large monospace counter: `347 / 1000`
- Animated progress bar beneath it
- `LogFeed` scrolling list underneath (optional, shows each hit timestamp)

### `SuccessModal.jsx`
- Full-screen overlay, appears when `status === "done"`
- Shows: `✓ Link opened {total} times successfully`
- Button: `Run Again` → resets state to idle

---

## 7. Design System

### Color Tokens

```css
/* index.css — paste at top */
:root {
  --clr-bg:         #0a0a0a;       /* near-black page background */
  --clr-surface:    #111111;       /* card / panel surface */
  --clr-border:     #1e1e1e;       /* subtle borders */
  --clr-accent:     #39ff14;       /* light green — neon lime */
  --clr-accent-dim: #1a7a0a;       /* muted green for secondary states */
  --clr-text:       #ffffff;       /* primary text */
  --clr-muted:      #6b6b6b;       /* secondary / placeholder text */
  --clr-error:      #ff4444;       /* error state */
  --clr-success:    #39ff14;       /* same as accent */
}
```

### Typography

```css
/* Load in index.html <head> */
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">

/* Usage */
font-family: 'Space Mono', monospace;    /* counters, labels, logo, code */
font-family: 'DM Sans', sans-serif;      /* body copy, inputs, descriptions */
```

### Tailwind Config Extension

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      bg:         '#0a0a0a',
      surface:    '#111111',
      border:     '#1e1e1e',
      accent:     '#39ff14',
      'accent-dim':'#1a7a0a',
      muted:      '#6b6b6b',
      error:      '#ff4444',
    },
    fontFamily: {
      mono: ['"Space Mono"', 'monospace'],
      sans: ['"DM Sans"', 'sans-serif'],
    },
  },
}
```

### Visual Language Rules

- **Background**: `#0a0a0a` — no gradients, no textures. Pure black depth.
- **Cards/panels**: `#111111` with `1px solid #1e1e1e` border. `border-radius: 2px` — sharp, not rounded. Brutalist precision.
- **Accent `#39ff14`**: Used ONLY on: active progress bar fill, Proceed button, success state, the `Z` in the ViewZ logo. Nowhere else.
- **Progress bar**: thin (`4px` height), accent-colored fill on a `#1e1e1e` track. No rounded ends.
- **Buttons**: Proceed = solid accent background + black text + `font-mono`. All caps. No border-radius or 2px max. Hover: slight opacity drop.
- **Inputs**: `bg-surface`, `border border-border`, white text, `font-mono` for the URL field, `font-sans` for number fields. On focus: `border-accent` glow via `box-shadow: 0 0 0 1px #39ff14`.
- **Counter text**: `font-mono text-6xl font-bold text-white` for the number, `text-muted` for the ` / total` part.
- **Logo**: `VIEW` in white `font-mono` + `Z` in accent `#39ff14`. No icon. Text only.
- **SuccessModal**: full-screen `bg-black/90` backdrop. Center card with a large `✓` in accent green, white headline, muted sub-copy.
- **Animations**: Progress bar fill uses a CSS `transition: width 200ms ease`. Counter increments with a subtle `scale(1.05)` pulse via Framer Motion on each tick. Modal entrance: fade + `translateY(8px)` lift. No bounces, no springs.

---

## 8. Environment Variables

### `backend/.env.example`
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
MAX_CONCURRENCY=3
```

### `frontend/.env.example`
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
```

---

## 9. Docker Compose

```yaml
# docker-compose.yml
version: '3.9'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - REDIS_URL=redis://redis:6379
      - FRONTEND_URL=http://localhost:5173
    depends_on:
      - redis
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### `backend/Dockerfile`
```dockerfile
FROM node:20-alpine
RUN apk add --no-cache chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["node", "server.js"]
```

---

## 10. Security Rules (Agent Must Enforce)

1. **Never** allow `file://`, `ftp://`, or any non-http(s) scheme through the validator.
2. **Block all private/internal IPs** in `urlValidator.js` — no SSRF.
3. **Rate limit** `POST /api/start` to max `5 requests per minute per IP` using `express-rate-limit`.
4. **Cap job size**: `count` hard max `10000`, `delay` hard max `60s`.
5. **Puppeteer must always run** with `--no-sandbox --disable-setuid-sandbox` inside Docker.
6. **Never expose** the Redis connection string or internal service URLs to the frontend.
7. **Job TTL**: BullMQ jobs should auto-remove after `24h` (`removeOnComplete: { age: 86400 }`, `removeOnFail: { age: 86400 }`).

---

## 11. Package Dependencies (install these)

### Frontend
```bash
npm install axios socket.io-client framer-motion
npm install -D tailwindcss postcss autoprefixer
```

### Backend
```bash
npm install express socket.io bullmq ioredis puppeteer dotenv express-rate-limit cors uuid
npm install -D nodemon concurrently
```

---

## 12. Dev Scripts

### `backend/package.json`
```json
"scripts": {
  "dev": "nodemon server.js",
  "worker": "nodemon worker.js",
  "start": "node server.js"
}
```

### `frontend/package.json`
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

**To run in dev:** Start Redis via Docker (`docker compose up redis -d`), then run `npm run dev` in both `frontend/` and `backend/`. Run the worker separately: `npm run worker` inside `backend/`.

---

## 13. Agent Checklist Before Declaring Done

- [ ] `urlValidator.js` blocks private IPs and non-http(s) schemes
- [ ] Socket.IO rooms are scoped to `sessionId` — no broadcast to all clients
- [ ] Puppeteer `browser.close()` is called in `finally` — no leaked processes
- [ ] Progress events fire once per iteration, not in bulk
- [ ] `SuccessModal` shows the actual `total` count from the server `done` event
- [ ] `Proceed` button is disabled and shows a spinner while `status === "running"`
- [ ] Tailwind accent color `#39ff14` is used **only** in the designated places listed in Section 7
- [ ] `Space Mono` font renders on counter, logo, URL input, and button labels
- [ ] All `.env` values are read from environment — no hardcoded URLs in source
- [ ] Docker Compose `backend` service depends on `redis` and restarts on failure