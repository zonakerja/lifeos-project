import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ObjectStorageModule } from "../storage/object-storage.module";
import { ExtractionQueueService } from "./extraction-queue.service";
import { ExtractionWorkerService } from "./extraction-worker.service";

@Module({
  imports: [PrismaModule, ObjectStorageModule],
  providers: [ExtractionQueueService, ExtractionWorkerService],
  exports: [ExtractionQueueService]
})
export class ExtractionModule {}
