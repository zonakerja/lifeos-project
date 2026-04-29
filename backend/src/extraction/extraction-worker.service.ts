import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AssetExtractionStatus, AssetStatus } from "@prisma/client";
import { Job, Worker } from "bullmq";
import { ObjectStorageService } from "../storage/object-storage.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ExtractionWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExtractionWorkerService.name);
  private worker?: Worker<{ assetId: string }>;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly storage: ObjectStorageService
  ) {}

  onModuleInit() {
    const redisPort = Number(this.config.get<string>("REDIS_PORT") ?? 6380);
    const concurrency = Number(
      this.config.get<string>("EXTRACTION_CONCURRENCY") ?? 2
    );
    this.worker = new Worker(
      "asset-extraction",
      async (job) => this.extract(job),
      {
        concurrency: Number.isFinite(concurrency) && concurrency > 0 ? concurrency : 2,
        connection: {
          host: this.config.get<string>("REDIS_HOST") ?? "localhost",
          port: Number.isFinite(redisPort) ? redisPort : 6380
        }
      }
    );

    this.worker.on("failed", (job, error) => {
      this.logger.error(
        `Extraction job ${job?.id ?? "unknown"} failed: ${error.message}`
      );
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private async extract(job: Job<{ assetId: string }>) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: job.data.assetId }
    });
    if (!asset) return;

    await this.prisma.asset.update({
      where: { id: asset.id },
      data: { status: AssetStatus.extracting }
    });
    await this.prisma.assetExtraction.update({
      where: { assetId: asset.id },
      data: {
        status: AssetExtractionStatus.extracting,
        startedAt: new Date(),
        error: null
      }
    });

    try {
      const extractedText = await this.extractText(asset.objectKey, asset.mimeType);
      const status =
        extractedText === null
          ? AssetExtractionStatus.unsupported
          : AssetExtractionStatus.completed;

      await this.prisma.assetExtraction.update({
        where: { assetId: asset.id },
        data: {
          status,
          extractedText,
          summary: extractedText ? this.createSummary(extractedText) : null,
          metadata: {
            mimeType: asset.mimeType,
            extractedCharacters: extractedText?.length ?? 0
          },
          completedAt: new Date()
        }
      });
      await this.prisma.asset.update({
        where: { id: asset.id },
        data: { status: AssetStatus.ready }
      });
    } catch (error) {
      await this.prisma.assetExtraction.update({
        where: { assetId: asset.id },
        data: {
          status: AssetExtractionStatus.failed,
          error: error instanceof Error ? error.message : "Unknown extraction error",
          completedAt: new Date()
        }
      });
      await this.prisma.asset.update({
        where: { id: asset.id },
        data: { status: AssetStatus.failed }
      });
      throw error;
    }
  }

  private async extractText(objectKey: string, mimeType: string) {
    if (!this.isPlainText(mimeType)) return null;

    const stream = await this.storage.getObject(objectKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString("utf8");
  }

  private isPlainText(mimeType: string) {
    return (
      mimeType.startsWith("text/") ||
      mimeType === "application/json" ||
      mimeType === "application/xml" ||
      mimeType === "application/yaml"
    );
  }

  private createSummary(text: string) {
    return text.replace(/\s+/g, " ").trim().slice(0, 500);
  }
}
