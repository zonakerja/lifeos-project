import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";

export const ASSET_EXTRACTION_QUEUE = "asset-extraction";

@Injectable()
export class ExtractionQueueService implements OnModuleDestroy {
  private readonly queue: Queue<{ assetId: string }>;

  constructor(config: ConfigService) {
    const redisPort = Number(config.get<string>("REDIS_PORT") ?? 6380);
    this.queue = new Queue(ASSET_EXTRACTION_QUEUE, {
      connection: {
        host: config.get<string>("REDIS_HOST") ?? "localhost",
        port: Number.isFinite(redisPort) ? redisPort : 6380
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000
        },
        removeOnComplete: 1000,
        removeOnFail: 5000
      }
    });
  }

  async enqueue(assetId: string) {
    await this.queue.add("extract", { assetId }, { jobId: assetId });
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}
