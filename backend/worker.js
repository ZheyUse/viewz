import { Worker } from 'bullmq';
import puppeteer from 'puppeteer';

// Random user agents to mimic different browsers/devices
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.2088.76',
];

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisParts = new URL(redisUrl);
const serverUrl = process.env.SERVER_URL || 'http://localhost:3001';

// Random delay between min and max
function randomDelay(minMs, maxMs) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Simulate human-like mouse movement (quick)
async function simulateHumanBehavior(page) {
  const viewport = page.viewport();
  if (!viewport) return;

  const { width, height } = viewport;

  // Quick random scroll
  const scrollActions = randomDelay(1, 3);
  for (let i = 0; i < scrollActions; i++) {
    const scrollAmount = randomDelay(100, 400);
    await page.evaluate((amount) => {
      window.scrollBy(0, amount);
    }, scrollAmount);
    await new Promise(r => setTimeout(r, randomDelay(200, 500)));
  }

  // Quick mouse movement
  const mouseMoves = randomDelay(2, 4);
  for (let i = 0; i < mouseMoves; i++) {
    const x = randomDelay(100, width - 100);
    const y = randomDelay(100, height - 100);
    await page.mouse.move(x, y);
    await new Promise(r => setTimeout(r, randomDelay(100, 300)));
  }

  // Short watch pause
  await new Promise(r => setTimeout(r, randomDelay(500, 1500)));
}

// Inject script to hide webdriver flag
function hideAutomationFlags(page) {
  page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
    window.chrome = { runtime: {} };
  });
}

// Connect to server
const { io: socketClient } = await import('socket.io-client');
const io = socketClient(serverUrl, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
});

io.on('connect', () => {
  console.log('[Worker] Connected to Socket.IO server');
});

const worker = new Worker('viewz-sessions', async (job) => {
  const { url, count, delay, sessionId } = job.data;
  console.log(`[Worker] Starting: ${count} views of ${url}`);

  let browser;
  const userAgent = randomPick(USER_AGENTS);

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--no-first-run',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
      ],
    });

    for (let i = 1; i <= count; i++) {
      const page = await browser.newPage();

      try {
        await page.setUserAgent(userAgent);
        hideAutomationFlags(page);
        await page.setViewport({
          width: randomPick([1920, 1366, 1536, 1440]),
          height: randomPick([1080, 768, 864, 900]),
        });

        // Navigate with random wait
        await page.goto(url, {
          waitUntil: randomPick(['networkidle2', 'domcontentloaded', 'load']),
          timeout: randomDelay(15000, 30000),
        });

        // Quick human behavior simulation
        await simulateHumanBehavior(page);

      } catch (err) {
        console.log(`[Worker] Page load warning: ${err.message.split('\n')[0]}`);
      } finally {
        await page.close();
      }

      // Emit progress
      io.emit('progress', { current: i, total: count, sessionId });

      // Delay between visits (quick but human-like)
      if (i < count) {
        const humanDelay = delay + randomDelay(500, 1000);
        await new Promise((resolve) => setTimeout(resolve, humanDelay));
      }
    }

    io.emit('done', { sessionId, total: count });
    console.log(`[Worker] Job ${job.id} completed!`);
  } catch (error) {
    io.emit('error', { sessionId, message: error.message });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}, {
  connection: {
    host: redisParts.hostname,
    port: parseInt(redisParts.port) || 6379,
    password: redisParts.password || undefined,
    maxRetriesPerRequest: null,
  },
  concurrency: 1,
});

worker.on('active', (job) => console.log(`[Worker] Job ${job.id} running`));
worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} done`));
worker.on('failed', (job, err) => console.error(`[Worker] Job failed: ${err.message}`));

console.log('[Worker] ViewZ started');

process.on('SIGTERM', async () => {
  io.disconnect();
  await worker.close();
  process.exit(0);
});