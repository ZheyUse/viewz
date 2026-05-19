import { Worker } from 'bullmq';
import puppeteer from 'puppeteer';
import redis from './lib/redis.js';
import { io } from './server.js';

const worker = new Worker('viewz-sessions', async (job) => {
  const { url, count, delay, sessionId } = job.data;
  console.log(`Processing job ${job.id}: ${count} iterations of ${url}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    for (let i = 1; i <= count; i++) {
      const page = await browser.newPage();
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      } finally {
        await page.close();
      }

      io.to(sessionId).emit('progress', { current: i, total: count, sessionId });

      if (i < count && delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    io.to(sessionId).emit('done', { sessionId, total: count });
    console.log(`Job ${job.id} completed successfully`);
  } catch (error) {
    io.to(sessionId).emit('error', { sessionId, message: error.message });
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}, {
  connection: redis,
  concurrency: parseInt(process.env.MAX_CONCURRENCY) || 3,
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log('ViewZ worker started');