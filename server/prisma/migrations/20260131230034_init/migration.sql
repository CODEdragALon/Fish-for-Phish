-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentDay" INTEGER NOT NULL DEFAULT 1,
    "score" INTEGER NOT NULL DEFAULT 1000,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "sender" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPhishing" BOOLEAN NOT NULL,
    "phishingType" TEXT,
    "difficultyLevel" INTEGER,
    "indicators" TEXT,
    "isThreaded" BOOLEAN NOT NULL DEFAULT false,
    "threadEmails" TEXT,
    "links" TEXT,
    "hasAttachment" BOOLEAN NOT NULL DEFAULT false,
    "attachmentName" TEXT,
    "hasQrCode" BOOLEAN NOT NULL DEFAULT false,
    "qrCodeUrl" TEXT,
    "hasCalendarInvite" BOOLEAN NOT NULL DEFAULT false,
    "calendarDetails" TEXT,
    CONSTRAINT "Email_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "reportedAsPhishing" BOOLEAN NOT NULL,
    "selectedReasons" TEXT,
    "isCorrect" BOOLEAN NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserResponse_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "totalEmails" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "falsePositives" INTEGER NOT NULL,
    "falseNegatives" INTEGER NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "pointsLost" INTEGER NOT NULL,
    "feedback" TEXT,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Email_sessionId_day_idx" ON "Email"("sessionId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "UserResponse_emailId_key" ON "UserResponse"("emailId");

-- CreateIndex
CREATE INDEX "UserResponse_sessionId_idx" ON "UserResponse"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyResult_sessionId_day_key" ON "DailyResult"("sessionId", "day");
