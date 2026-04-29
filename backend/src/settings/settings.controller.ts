import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { UpdateAppSettingsDto } from "./dto/update-app-settings.dto";
import { SettingsService } from "./settings.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("settings")
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get("app")
  getAppSettings() {
    return this.settings.getAppSettings();
  }

  @Roles(UserRole.super_admin, UserRole.admin)
  @Patch("app")
  updateAppSettings(@Body() dto: UpdateAppSettingsDto) {
    return this.settings.updateAppSettings(dto);
  }
}
