import { Queue } from 'bullmq';
import redis from './lib/redis.js';

const queue = new Queue('viewz-sessions', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 86400 },
    attempts: 1,
  },
});

export default queue;