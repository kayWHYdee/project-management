-- CreateTable
CREATE TABLE "pm"."Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "pm"."Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "pm"."Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "pm"."Session"("expiresAt");

-- AddForeignKey
ALTER TABLE "pm"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pm"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

