import { Redis } from "ioredis";

const getRedisHost = () => {
  if (process.env.REDIS_Host) {
    return process.env.REDIS_HOST;
  } throw new Error("REDIS_URL is not set");
};

const getRedisPort = () => {
  if (process.env.REDIS_PORT) {
    return parseInt(process.env.REDIS_PORT, 10);
  }
  throw new Error("REDIS_PORT is not set");
};

const getRedisPassword = () => {
  if (process.env.REDIS_PASSWORD) {
    return process.env.REDIS_PASSWORD;
  }
  throw new Error("REDIS_PASSWORD is not set");
};

export const redis = new Redis({
  password: getRedisPassword(),
  port: getRedisPort(),
  host: getRedisHost(),
});
