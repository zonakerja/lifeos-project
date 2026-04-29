import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AuthUser } from "../common/types/auth-user";
import { CreateRecordDto } from "./dto/create-record.dto";
import { BulkReplaceRecordsDto } from "./dto/bulk-replace-records.dto";
import { ListRecordsQueryDto } from "./dto/list-records-query.dto";
import { UpdateRecordDto } from "./dto/update-record.dto";
import { RecordsService } from "./records.service";

@UseGuards(JwtAuthGuard)
@Controller("records")
export class RecordsController {
  constructor(private readonly records: RecordsService) {}

  @Get(":type")
  findMany(
    @Param("type") type: string,
    @Query() query: ListRecordsQueryDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.records.findMany(this.records.parseType(type), query, user);
  }

  @Post(":type")
  create(
    @Param("type") type: string,
    @Body() dto: CreateRecordDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.records.create(this.records.parseType(type), dto, user);
  }

  @Post(":type/bulk")
  bulkReplace(
    @Param("type") type: string,
    @Body() dto: BulkReplaceRecordsDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.records.bulkReplace(this.records.parseType(type), dto, user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateRecordDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.records.update(id, dto, user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.records.remove(id, user);
  }
}
