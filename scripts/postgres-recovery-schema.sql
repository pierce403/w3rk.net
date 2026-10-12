-- Empty recovery database only. Matches all eight models in prisma/schema.prisma.
-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "ensName" TEXT,
    "baseName" TEXT,
    "displayName" TEXT NOT NULL,
    "farcasterHandle" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bio" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jobs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "budget" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rate" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."endorsements" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "skillId" TEXT NOT NULL,
    "endorserId" TEXT NOT NULL,

    CONSTRAINT "endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_address_key" ON "public"."users"("address");

-- CreateIndex
CREATE UNIQUE INDEX "skills_userId_name_key" ON "public"."skills"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "endorsements_skillId_endorserId_key" ON "public"."endorsements"("skillId", "endorserId");

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."skills" ADD CONSTRAINT "skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."endorsements" ADD CONSTRAINT "endorsements_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "public"."skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."endorsements" ADD CONSTRAINT "endorsements_endorserId_fkey" FOREIGN KEY ("endorserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "chat_rooms" (
 "id" TEXT PRIMARY KEY, "type" TEXT NOT NULL, "title" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 "jobId" TEXT REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "serviceId" TEXT REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "chat_participants" (
 "id" TEXT PRIMARY KEY, "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "chatRoomId" TEXT NOT NULL REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 UNIQUE("chatRoomId","userId")
);
CREATE TABLE "chat_messages" (
 "id" TEXT PRIMARY KEY,"content" TEXT NOT NULL,"xmtpId" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "chatRoomId" TEXT NOT NULL REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "senderId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
