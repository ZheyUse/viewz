# How to Use ViewZ

ViewZ is a headless link-opening engine. It opens a URL a specified number of times on a server-side browser, invisible to your machine.

## Prerequisites

- Node.js 20+
- Docker + Docker Compose (for Redis)
- Redis running locally

## Development Setup

### 1. Start Redis

```bash
docker compose up redis -d
```

### 2. Start Backend

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:3001`

### 3. Start Worker

Open a new terminal:

```bash
cd backend
npm run worker
```

The worker processes jobs from the queue and opens URLs with Puppeteer.

### 4. Start Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Using the App

1. Open `http://localhost:5173` in your browser

2. In **Target URL**, enter a public URL (e.g., `https://example.com`)

3. Set **Count** — how many times to open the URL (1–10000)

4. Set **Delay** — milliseconds between each open (0–60000)

5. Click **Proceed**

6. Watch the live progress counter and progress bar

7. When complete, the success modal appears with a "Run Again" button

## Security Notes

The following are blocked and will return an error:
- `localhost`, `127.0.0.1`, `0.0.0.0`
- Private IP ranges: `192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`
- Non-http/https URLs
- Rate limit: 5 requests per minute per IP

## Production Deployment

### Docker Compose

```bash
docker compose up --build
```

This starts all three services:
- Redis on port 6379
- Backend on port 3001
- Frontend on port 80 (mapped to 5173)

### Manual Production

```bash
# Build frontend
cd frontend && npm run build

# Start services
cd backend && npm start
cd backend && npm run worker
```

## Tips

- Start with small counts (10-100) to test
- Higher delays reduce server load and avoid rate limiting on target sites
- The worker runs headless — no browser window opens on the server
- Socket.IO handles real-time progress updates even behind proxies

## Troubleshooting

**Redis connection error**: Make sure Docker is running and the redis service is up (`docker compose up redis -d`)

**Rate limit hit**: Wait 60 seconds — the limit is 5 requests per minute per IP

**Worker not processing jobs**: Check that both `npm run dev` (server) and `npm run worker` are running in separate terminals