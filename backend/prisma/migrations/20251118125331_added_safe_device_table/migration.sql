-- AlterTable
ALTER TABLE "AIProfile" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "AIProfile_id_seq";

-- AlterTable
ALTER TABLE "Chat" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Chat_id_seq";

-- AlterTable
ALTER TABLE "ChatMember" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "ChatMember_id_seq";

-- AlterTable
ALTER TABLE "Model" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Model_id_seq";

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Project_id_seq";

-- AlterTable
ALTER TABLE "ProjectFolder" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "ProjectFolder_id_seq";

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Session_id_seq";

-- AlterTable
ALTER TABLE "Thread" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Thread_id_seq";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "User_id_seq";

-- AlterTable
ALTER TABLE "UserChatProject" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "UserChatProject_id_seq";

-- AlterTable
ALTER TABLE "UserOAuth" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "UserOAuth_id_seq";

-- CreateTable
CREATE TABLE "SafeDevice" (
    "id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafeDevice_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SafeDevice" ADD CONSTRAINT "SafeDevice_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
