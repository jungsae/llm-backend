-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "inputData" JSONB NOT NULL,
    "resultData" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_userId_idx" ON "Job"("userId");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_priority_idx" ON "Job"("priority");
