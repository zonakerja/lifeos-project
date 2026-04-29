import { PrismaClient, UserRole } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  await prisma.appSettings.upsert({
    where: { id: "global" },
    create: {},
    update: {}
  });

  await prisma.user.upsert({
    where: { email: "admin@lifeos.com" },
    create: {
      name: "Super Admin",
      email: "admin@lifeos.com",
      passwordHash: await argon2.hash("123"),
      role: UserRole.super_admin,
      phone: "08123456789",
      address: "Jakarta"
    },
    update: {}
  });

  await prisma.user.upsert({
    where: { email: "viewer@lifeos.com" },
    create: {
      name: "Tamu Viewer",
      email: "viewer@lifeos.com",
      passwordHash: await argon2.hash("123"),
      role: UserRole.viewer
    },
    update: {}
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
