# ViewZ — Headless Link-Opening Engine

ViewZ is a headless link-opening engine. A user pastes a URL, sets a repeat count and delay, clicks **Proceed**, and the system silently opens that URL the specified number of times inside a server-side sandboxed headless browser — completely invisible to the user's machine. No tabs open on the user's machine. Ever.

---

## Tech Stack

### Frontend
- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS v3
- **Real-time:** Socket.IO Client
- **HTTP:** Axios
- **Fonts:** Space Mono (display/code) + DM Sans (body)
- **Animations:** Framer Motion

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Real-time:** Socket.IO (server)
- **Job Queue:** BullMQ
- **In-memory store:** Redis (via ioredis)
- **Headless browser:** Puppeteer

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Redis:** Official `redis:alpine` Docker image

---

## Prerequisites

- Node.js 20+
- Docker Desktop (for Redis)

---

## Quick Start

### 1. Install Dependencies

```bash
npm run install:all
```

This installs both backend and frontend dependencies.

### 2. Start Redis

```powershell
docker run -d -p 6379:6379 --name redis redis:alpine
```

Verify Redis is running:
```powershell
docker exec redis redis-cli ping
```
Should return: `PONG`

### 3. Configure Backend

Create `backend/.env` file:

```env
REDIS_URL=redis://localhost:6379
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 4. Run the Application

```bash
npm run start:all
```

This starts:
- Backend API server (port 3001)
- Backend worker (processes jobs)
- Frontend (port 5173)

---

## Available Scripts

| Command | What it does |
|---------|--------------|
| `npm run start:all` | Start backend + frontend |
| `npm run stop:all` | Stop everything |
| `npm run restart:all` | Stop then start |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend only |
| `npm run install:all` | Install all dependencies |

### Backend Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start server with hot reload |
| `npm run worker` | Start worker with hot reload |
| `npm run start` | Start server (production) |
| `npm run start:all` | Start server + worker + worker in parallel |

---

## Using the App

1. Open `http://localhost:5173` in your browser

2. In **Target URL**, enter a public URL (e.g., `https://example.com`)

3. Set **Count** — how many times to open the URL (1–10000)

4. Set **Delay** — milliseconds between each open (0–60000)

5. Click **Proceed** — button is disabled while running

6. Watch the live progress counter and progress bar

7. When complete, the success modal appears with a "Run Again" button

---

## Project Structure

```
viewz/
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── InputPanel.jsx
│   │   │   ├── ProgressDisplay.jsx
│   │   │   ├── SuccessModal.jsx
│   │   │   ├── LogFeed.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── hooks/
│   │   │   └── useViewZSocket.js
│   │   ├── lib/
│   │   │   └── api.js
│   │   └── constants/
│   │       └── theme.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── server.js
│   ├── queue.js
│   ├── worker.js
│   ├── routes/
│   │   └── session.js
│   ├── lib/
│   │   └── redis.js
│   ├── validators/
│   │   └── urlValidator.js
│   └── package.json
│
├── docker-compose.yml
└── package.json
```

---

## API Endpoints

### POST /api/start

Start a new session.

**Request Body:**
```json
{
  "url": "https://example.com",
  "count": 100,
  "delay": 500
}
```

**Response:**
```json
{
  "sessionId": "uuid-v4",
  "queued": true
}
```

### GET /api/status/:id

Check session status.

### GET /health

Health check endpoint. Returns `{ "status": "ok" }`

---

## Socket.IO Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `join` | client → server | `{ sessionId }` |
| `progress` | server → client | `{ current, total, sessionId }` |
| `done` | server → client | `{ sessionId, total }` |
| `error` | server → client | `{ sessionId, message }` |

---

## Docker Commands

| Command | Description |
|---------|------------|
| `docker run -d -p 6379:6379 --name redis redis:alpine` | Start Redis container |
| `docker start redis` | Start existing Redis container |
| `docker stop redis` | Stop Redis container |
| `docker exec redis redis-cli ping` | Test Redis connection |
| `docker ps` | List running containers |
| `docker rm redis` | Remove Redis container |

---

## Docker Compose

Run everything with Docker:

```bash
docker compose up -d
```

This starts:
- Redis on port 6379
- Backend API on port 3001
- Frontend on port 5173

To stop:
```bash
docker compose down
```

---

## Security

The following are blocked and will return an error:
- `localhost`, `127.0.0.1`, `0.0.0.0`
- Private IP ranges: `192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`
- Non-http/https URLs
- Rate limit: 5 requests per minute per IP

---

## Troubleshooting

### Redis connection error
- Make sure Docker Desktop is running
- Check container: `docker ps`
- Restart if needed: `docker restart redis`

### Nothing happens after clicking Proceed
- Make sure `npm run start:all` shows no errors
- Check both backend and frontend terminals

### Rate limit hit
- Wait 60 seconds — the limit is 5 requests per minute per IP

---

## Tips

- Start with small counts (10–100) to test
- Higher delays reduce server load and avoid rate limiting on target sites
- The worker runs headless — no browser window opens anywhere
- Socket.IO handles real-time progress updates