import express from 'express';
import rateLimit from 'express-rate-limit';
import { validateUrl } from '../validators/urlValidator.js';
import queue from '../queue.js';

const router = express.Router();

const startLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many requests. Please try again later.' },
});

router.post('/start', startLimiter, async (req, res) => {
  const { url, count, delay } = req.body;

  const validation = validateUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  const parsedCount = parseInt(count, 10);
  if (isNaN(parsedCount) || parsedCount < 1 || parsedCount > 10000) {
    return res.status(400).json({ error: 'Count must be between 1 and 10000' });
  }

  const parsedDelay = parseInt(delay, 10);
  if (isNaN(parsedDelay) || parsedDelay < 0 || parsedDelay > 60000) {
    return res.status(400).json({ error: 'Delay must be between 0 and 60000ms' });
  }

  const sessionId = crypto.randomUUID();

  await queue.add('view-session', {
    url,
    count: parsedCount,
    delay: parsedDelay,
    sessionId,
  });

  res.json({ sessionId, queued: true });
});

router.get('/status/:id', async (req, res) => {
  res.json({ sessionId: req.params.id, status: 'processing' });
});

export default router;