import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || '';

const redisClient = new Redis(REDIS_URL);

export default redisClient;
