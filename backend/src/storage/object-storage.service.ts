import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

@Injectable()
export class ObjectStorageService implements OnModuleInit {
  private readonly client: S3Client;
  readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>("ASSET_BUCKET") ?? "lifeos-assets";
    this.client = new S3Client({
      region: this.config.get<string>("S3_REGION") ?? "us-east-1",
      endpoint: this.config.get<string>("S3_ENDPOINT"),
      forcePathStyle: this.config.get<string>("S3_FORCE_PATH_STYLE") !== "false",
      credentials: {
        accessKeyId: this.config.get<string>("S3_ACCESS_KEY_ID") ?? "lifeos",
        secretAccessKey:
          this.config.get<string>("S3_SECRET_ACCESS_KEY") ?? "lifeos-secret"
      }
    });
  }

  async onModuleInit() {
    await this.ensureBucket();
  }

  async putObject(params: {
    key: string;
    body: Buffer;
    contentType: string;
    checksum: string;
  }) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
        Metadata: {
          checksum: params.checksum
        }
      })
    );
  }

  async getObject(key: string) {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      })
    );

    return result.Body as Readable;
  }

  async deleteObject(key: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      })
    );
  }

  private async ensureBucket() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }
}
