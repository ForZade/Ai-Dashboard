/*
  Warnings:

  - Added the required column `roles` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roles" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "TwoFA" (
    "id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TwoFA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupCode" (
    "id" BIGINT NOT NULL,
    "twofa_id" BIGINT NOT NULL,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BackupCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TwoFA_user_id_key" ON "TwoFA"("user_id");

-- AddForeignKey
ALTER TABLE "TwoFA" ADD CONSTRAINT "TwoFA_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupCode" ADD CONSTRAINT "BackupCode_twofa_id_fkey" FOREIGN KEY ("twofa_id") REFERENCES "TwoFA"("id") ON DELETE CASCADE ON UPDATE CASCADE;
