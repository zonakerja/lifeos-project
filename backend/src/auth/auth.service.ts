import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { User } from "@prisma/client";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() }
    });

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException("Email atau password salah.");
    }

    return this.createSession(user);
  }

  async refresh(refreshToken: string) {
    const records = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    for (const record of records) {
      if (await argon2.verify(record.tokenHash, refreshToken)) {
        await this.prisma.refreshToken.update({
          where: { id: record.id },
          data: { revokedAt: new Date() }
        });
        return this.createSession(record.user);
      }
    }

    throw new UnauthorizedException("Refresh token tidak valid.");
  }

  async logout(refreshToken: string) {
    const records = await this.prisma.refreshToken.findMany({
      where: { revokedAt: null }
    });

    for (const record of records) {
      if (await argon2.verify(record.tokenHash, refreshToken)) {
        await this.prisma.refreshToken.update({
          where: { id: record.id },
          data: { revokedAt: new Date() }
        });
        break;
      }
    }

    return { success: true };
  }

  private async createSession(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>("JWT_REFRESH_SECRET") ?? "dev-refresh-secret",
      expiresIn: 7 * 24 * 60 * 60
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await argon2.hash(refreshToken),
        expiresAt
      }
    });

    return {
      user: this.toPublicUser(user),
      accessToken,
      refreshToken
    };
  }

  private toPublicUser(user: User) {
    const { passwordHash, ...publicUser } = user;
    void passwordHash;
    return publicUser;
  }
}
