-- Apply only to an isolated original five-table recovery database before importing post-cutover chat data.
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
