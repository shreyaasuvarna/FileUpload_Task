import { redisConnection } from "./redisClient";
import { fileProcessingQueue } from "../queue/fileProcessingQueue";

const STREAM_KEY = "file_processing_stream";
const GROUP_NAME = "file_processing_group";
const CONSUMER_NAME = "consumer_1";

async function ensureConsumerGroup(): Promise<void> {
  try {
    await redisConnection.xgroup("CREATE", STREAM_KEY, GROUP_NAME, "$", "MKSTREAM");
    console.log(`[consumer] created consumer group "${GROUP_NAME}"`);
  } catch (err: any) {
    if (!String(err.message).includes("BUSYGROUP")) throw err;
  }
}

async function runConsumerLoop(): Promise<void> {
  await ensureConsumerGroup();
  console.log(`[consumer] listening on "${STREAM_KEY}"...`);

  while (true) {
    const response = await redisConnection.xreadgroup(
      "GROUP", GROUP_NAME, CONSUMER_NAME,
      "COUNT", 10,
      "BLOCK", 5000,
      "STREAMS", STREAM_KEY, ">"
    );

    if (!response) continue; // no new events within 5s, loop again

    const [, entries] = response[0] as any;

    for (const [entryId, fields] of entries) {
      const data: Record<string, string> = {};
      for (let i = 0; i < fields.length; i += 2) {
        data[fields[i]] = fields[i + 1];
      }

      console.log(`[consumer] received event ${entryId}:`, data);

      await fileProcessingQueue.add("process-file", {
        fileId: data.fileId,
        founderId: data.founderId,
      });

      await redisConnection.xack(STREAM_KEY, GROUP_NAME, entryId);
    }
  }
}

runConsumerLoop();