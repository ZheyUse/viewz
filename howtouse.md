# How to Use ViewZ

ViewZ is a headless link-opening engine. It opens a URL a specified number of times on a server-side browser, invisible to your machine.

## Prerequisites

- Node.js 20+
- Docker Desktop (for Redis)

---

## Setting Up Redis (with Docker)

### Start Redis Container

```powershell
docker run -d -p 6379:6379 --name redis redis:alpine
```

### Verify Redis is Running

```powershell
docker exec redis redis-cli ping
```

Should return: `PONG`

### Start Redis (after reboot)

```powershell
docker start redis
```

### Stop Redis (when done)

```powershell
docker stop redis
```

---

## Development Setup

### 1. Install Dependencies

```bash
npm run install:all
```

This installs backend and frontend dependencies.

### 2. Configure Backend

Create `backend/.env` file:

```env
REDIS_URL=redis://localhost:6379
PORT=3001
FRONTEND_URL=http://localhost:5173
```

---

## Running the App

### Quick Start (Everything)

From the project root:

```bash
npm run start:all
```

This starts:
- Backend API server (port 3001)
- Backend worker (processes jobs)
- Frontend (port 5173)

### Running Separately

**Backend only (server + worker):**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

### Stopping

```bash
npm run stop:all
```

### Restarting

```bash
npm run restart:all
```

---

## Scripts Reference

| Command | What it does |
|---------|-------------|
| `npm run start:all` | Start backend + frontend |
| `npm run stop:all` | Stop everything |
| `npm run restart:all` | Stop then start |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend only |
| `npm run install:all` | Install all dependencies |

---

## Using the App

1. Open `http://localhost:5173` in your browser

2. In **Target URL**, enter a public URL (e.g., `https://example.com`)

3. Set **Count** — how many times to open the URL (1–10000)

4. Set **Delay** — milliseconds between each open (0–60000)

5. Click **Proceed**

6. Watch the live progress counter and progress bar

7. When complete, the success modal appears with a "Run Again" button

---

## Security Notes

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

## Docker Commands Reference

| Command | Description |
|---------|-------------|
| `docker run -d -p 6379:6379 --name redis redis:alpine` | Start Redis container |
| `docker start redis` | Start existing Redis container |
| `docker stop redis` | Stop Redis container |
| `docker exec redis redis-cli ping` | Test Redis connection |
| `docker ps` | List running containers |
| `docker rm redis` | Remove Redis container |

---

## Tips

- Start with small counts (10-100) to test
- Higher delays reduce server load and avoid rate limiting on target sites
- The worker runs headless — no browser window opens anywhere
- Socket.IO handles real-time progress updates