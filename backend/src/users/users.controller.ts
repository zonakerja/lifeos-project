import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles(UserRole.super_admin, UserRole.admin)
  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Roles(UserRole.super_admin, UserRole.admin)
  @Get(":id")
  findById(@Param("id") id: string) {
    return this.users.findById(id);
  }

  @Roles(UserRole.super_admin)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Roles(UserRole.super_admin)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Roles(UserRole.super_admin)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.users.remove(id);
  }
}
