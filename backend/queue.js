import { Queue } from 'bullmq';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisParts = new URL(redisUrl);

const queue = new Queue('viewz-sessions', {
  connection: {
    host: redisParts.hostname,
    port: parseInt(redisParts.port) || 6379,
    password: redisParts.password || undefined,
    maxRetriesPerRequest: null,
  },
  defaultJobOptions: {
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 86400 },
    attempts: 1,
  },
});

export default queue;