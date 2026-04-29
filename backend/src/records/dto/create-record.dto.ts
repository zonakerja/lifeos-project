import { IsISO8601, IsObject, IsOptional, IsString } from "class-validator";

export class CreateRecordDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsObject()
  payload: Record<string, unknown>;
}
