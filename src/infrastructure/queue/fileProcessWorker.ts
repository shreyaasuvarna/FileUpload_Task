import { Worker, Job } from "bullmq";
import { redisConnection } from "../redis/redisClient";
import { QUEUE_NAME } from "./fileProcessingQueue";
import { PrismaFileRepository } from "../db/PrismaFileRepository";

const fileRepository = new PrismaFileRepository();

function simulateProcessing(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 3000));
}

const worker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    const { fileId, founderId } = job.data as { fileId: string; founderId: string };

    console.log(`[worker] processing job ${job.id} - file ${fileId}`);

    await fileRepository.updateStatus(fileId, "PROCESSING");
    await simulateProcessing();
    const updated = await fileRepository.updateStatus(fileId, "PROCESSED");

    await redisConnection.publish(
      "file_processed_events",
      JSON.stringify({ fileId: updated.id, founderId: updated.founderId, status: updated.status })
    );

    console.log(`[worker] finished job ${job.id} - file ${fileId} is now PROCESSED`);
  },
  { connection: redisConnection }
);

worker.on("failed", (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err.message);
});

console.log(`[worker] listening on queue "${QUEUE_NAME}"...`);