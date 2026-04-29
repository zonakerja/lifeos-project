import { IsArray, IsObject } from "class-validator";

export class BulkReplaceRecordsDto {
  @IsArray()
  @IsObject({ each: true })
  items: Record<string, unknown>[];
}
