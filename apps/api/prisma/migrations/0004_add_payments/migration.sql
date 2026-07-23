-- CreateTable
CREATE TABLE "pm"."Payment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "receivedOn" DATE NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_projectId_idx" ON "pm"."Payment"("projectId");

-- AddForeignKey
ALTER TABLE "pm"."Payment" ADD CONSTRAINT "Payment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pm"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm"."Payment" ADD CONSTRAINT "Payment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "pm"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

