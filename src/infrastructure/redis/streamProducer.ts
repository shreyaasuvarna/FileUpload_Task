import { redisConnection } from "./redisClient";

const STREAM_KEY = "file_processing_stream";

export async function publishFileUploadedEvent(fileId: string, founderId: string): Promise<void> {
  await redisConnection.xadd(
    STREAM_KEY,
    "*",
    "fileId", fileId,
    "founderId", founderId
  );
  console.log(`[stream] published event for file ${fileId}`);
}