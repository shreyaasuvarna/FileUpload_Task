import { Queue } from "bullmq";
import { redisConnection } from "../redis/redisClient";

export const QUEUE_NAME = "file_processing_queue";

export const fileProcessingQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
});