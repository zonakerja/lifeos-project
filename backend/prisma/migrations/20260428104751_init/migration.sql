-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'admin', 'member', 'viewer');

-- CreateEnum
CREATE TYPE "LifeosRecordType" AS ENUM ('agenda_type', 'routine', 'schedule', 'todo', 'completion', 'free_note', 'ai_note', 'list', 'para_project', 'para_area', 'para_task', 'para_activity', 'para_resource', 'para_archive', 'archive_classification', 'archive_jra', 'archive_physical_reference', 'archive_borrowing', 'archive_disposition', 'archive_move_log');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'member',
    "phone" TEXT,
    "address" TEXT,
    "apiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "name" TEXT NOT NULL DEFAULT 'LifeOS',
    "navSub" TEXT NOT NULL DEFAULT 'Integrated Edition',
    "loginSub" TEXT NOT NULL DEFAULT 'Ultimate',
    "motto" TEXT NOT NULL DEFAULT 'Design Your Life, Manage Your Resources',
    "welcomeTitle" TEXT NOT NULL DEFAULT 'Selamat Datang',
    "welcomeSub" TEXT NOT NULL DEFAULT 'Silakan masuk menggunakan User ID dan Password Anda.',
    "footerText" TEXT NOT NULL DEFAULT '© 2026 LifeOS System',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifeosRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LifeosRecordType" NOT NULL,
    "title" TEXT,
    "date" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LifeosRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "LifeosRecord_userId_type_idx" ON "LifeosRecord"("userId", "type");

-- CreateIndex
CREATE INDEX "LifeosRecord_userId_type_date_idx" ON "LifeosRecord"("userId", "type", "date");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifeosRecord" ADD CONSTRAINT "LifeosRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
