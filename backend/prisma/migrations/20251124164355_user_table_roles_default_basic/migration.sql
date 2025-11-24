/*
  Warnings:

  - The values [BASIC,SPECIAL,PREMIUM] on the enum `RolesType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RolesType_new" AS ENUM ('basic', 'special', 'premium');
ALTER TABLE "User" ALTER COLUMN "roles" TYPE "RolesType_new" USING ("roles"::text::"RolesType_new");
ALTER TYPE "RolesType" RENAME TO "RolesType_old";
ALTER TYPE "RolesType_new" RENAME TO "RolesType";
DROP TYPE "public"."RolesType_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "roles" SET DEFAULT 'basic';
