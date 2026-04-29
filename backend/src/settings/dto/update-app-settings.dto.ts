import { IsOptional, IsString } from "class-validator";

export class UpdateAppSettingsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  navSub?: string;

  @IsOptional()
  @IsString()
  loginSub?: string;

  @IsOptional()
  @IsString()
  motto?: string;

  @IsOptional()
  @IsString()
  welcomeTitle?: string;

  @IsOptional()
  @IsString()
  welcomeSub?: string;

  @IsOptional()
  @IsString()
  footerText?: string;
}
