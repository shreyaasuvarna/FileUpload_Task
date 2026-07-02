import Redis from "ioredis";

export const redisConnection = new Redis("redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

redisConnection.on("error", (err) => {
  console.error("[redis] connection error:", err.message);
});