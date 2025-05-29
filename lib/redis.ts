import { Redis } from 'ioredis';

function getRedisHost() {
  if (process.env.REDIS_HOST) {
    return process.env.REDIS_HOST;
  }
  throw new Error('REDIS_URL is not set');
}

function getRedisPort() {
  if (process.env.REDIS_PORT) {
    return parseInt(process.env.REDIS_PORT, 10);
  }
  throw new Error('REDIS_PORT is not set');
}

function getRedisPassword() {
  if (process.env.REDIS_PASSWORD) {
    return process.env.REDIS_PASSWORD;
  }
  throw new Error('REDIS_PASSWORD is not set');
}

export const redis = new Redis({
  password: getRedisPassword(),
  port: getRedisPort(),
  host: getRedisHost(),
});
