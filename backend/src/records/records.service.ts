import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { LifeosRecordType, Prisma, UserRole } from "@prisma/client";
import { AuthUser } from "../common/types/auth-user";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRecordDto } from "./dto/create-record.dto";
import { BulkReplaceRecordsDto } from "./dto/bulk-replace-records.dto";
import { ListRecordsQueryDto } from "./dto/list-records-query.dto";
import { UpdateRecordDto } from "./dto/update-record.dto";

@Injectable()
export class RecordsService {
  constructor(private readonly prisma: PrismaService) {}

  findMany(type: LifeosRecordType, query: ListRecordsQueryDto, user: AuthUser) {
    const userId = this.resolveUserId(user, query.userId);
    const where: Prisma.LifeosRecordWhereInput = {
      type,
      deletedAt: null,
      ...(userId ? { userId } : {})
    };

    if (query.from || query.to) {
      where.date = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {})
      };
    }

    return this.prisma.lifeosRecord.findMany({
      where,
      orderBy: [{ date: "asc" }, { createdAt: "desc" }]
    });
  }

  create(type: LifeosRecordType, dto: CreateRecordDto, user: AuthUser) {
    this.ensureCanWrite(user);

    return this.prisma.lifeosRecord.create({
      data: {
        userId: user.id,
        type,
        title: dto.title,
        date: dto.date ? new Date(dto.date) : undefined,
        payload: dto.payload as Prisma.InputJsonValue
      }
    });
  }

  async update(id: string, dto: UpdateRecordDto, user: AuthUser) {
    this.ensureCanWrite(user);
    const record = await this.findOwnedRecord(id, user);

    return this.prisma.lifeosRecord.update({
      where: { id: record.id },
      data: {
        title: dto.title,
        date: dto.date ? new Date(dto.date) : undefined,
        payload: dto.payload as Prisma.InputJsonValue | undefined
      }
    });
  }

  async remove(id: string, user: AuthUser) {
    this.ensureCanWrite(user);
    const record = await this.findOwnedRecord(id, user);
    await this.prisma.lifeosRecord.update({
      where: { id: record.id },
      data: { deletedAt: new Date() }
    });
    return { success: true };
  }

  async bulkReplace(
    type: LifeosRecordType,
    dto: BulkReplaceRecordsDto,
    user: AuthUser
  ) {
    this.ensureCanWrite(user);
    const now = new Date();
    const items = dto.items ?? [];
    const canWriteForOthers =
      user.role === UserRole.super_admin || user.role === UserRole.admin;

    await this.prisma.$transaction(async (tx) => {
      const validUsers = await tx.user.findMany({
        select: { id: true }
      });
      const validUserIds = new Set(validUsers.map((validUser) => validUser.id));
      const normalizedItems = items.map((item) => {
        const requestedUserId =
          canWriteForOthers && typeof item.userId === "string"
            ? item.userId
            : user.id;
        const itemUserId = validUserIds.has(requestedUserId)
          ? requestedUserId
          : user.id;

        return { item, userId: itemUserId };
      });
      const targetUserIds = Array.from(
        new Set(normalizedItems.map((item) => item.userId))
      );
      if (targetUserIds.length === 0) targetUserIds.push(user.id);

      await tx.lifeosRecord.updateMany({
        where: {
          type,
          userId: { in: targetUserIds },
          deletedAt: null
        },
        data: { deletedAt: now }
      });

      if (items.length > 0) {
        await tx.lifeosRecord.createMany({
          data: normalizedItems.map(({ item, userId }) => {
            return {
              userId,
              type,
              title:
                typeof item.title === "string"
                  ? item.title
                  : typeof item.name === "string"
                    ? item.name
                    : undefined,
              date: this.extractDate(item),
              payload: item as Prisma.InputJsonValue
            };
          })
        });
      }
    });

    return this.findMany(type, {}, user);
  }

  parseType(type: string): LifeosRecordType {
    if (!Object.values(LifeosRecordType).includes(type as LifeosRecordType)) {
      throw new NotFoundException(`Record type '${type}' tidak dikenal.`);
    }
    return type as LifeosRecordType;
  }

  private resolveUserId(user: AuthUser, requestedUserId?: string) {
    if (user.role === UserRole.super_admin || user.role === UserRole.admin) {
      return requestedUserId;
    }
    return user.id;
  }

  private ensureCanWrite(user: AuthUser) {
    if (user.role === UserRole.viewer) {
      throw new ForbiddenException("Viewer tidak memiliki akses tulis.");
    }
  }

  private async findOwnedRecord(id: string, user: AuthUser) {
    const record = await this.prisma.lifeosRecord.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!record) throw new NotFoundException("Record tidak ditemukan.");

    const canAccessAll =
      user.role === UserRole.super_admin || user.role === UserRole.admin;
    if (!canAccessAll && record.userId !== user.id) {
      throw new ForbiddenException("Anda tidak memiliki akses ke record ini.");
    }

    return record;
  }

  private extractDate(item: Record<string, unknown>) {
    const value = item.date ?? item.startDate ?? item.createdAt;
    if (typeof value !== "string") return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
}
