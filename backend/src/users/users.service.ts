import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { User } from "@prisma/client";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "asc" }
    });
    return users.map((user) => this.toPublicUser(user));
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User tidak ditemukan.");
    return this.toPublicUser(user);
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() }
    });
    if (existing) throw new ConflictException("Email sudah digunakan.");

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash: await argon2.hash(dto.password),
        role: dto.role,
        phone: dto.phone,
        address: dto.address
      }
    });

    return this.toPublicUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);

    const data = {
      name: dto.name,
      email: dto.email?.toLowerCase(),
      role: dto.role,
      phone: dto.phone,
      address: dto.address,
      passwordHash: dto.password ? await argon2.hash(dto.password) : undefined
    };

    const user = await this.prisma.user.update({
      where: { id },
      data
    });

    return this.toPublicUser(user);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  private toPublicUser(user: User) {
    const { passwordHash, ...publicUser } = user;
    void passwordHash;
    return publicUser;
  }
}
