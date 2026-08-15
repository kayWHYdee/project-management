-- CreateEnum
CREATE TYPE "pm"."PhotoReceived" AS ENUM ('YES_CHACHU', 'YES_PRANAV', 'NO');

-- CreateTable
CREATE TABLE "pm"."Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Technician',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm"."Visit" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "systemId" TEXT,
    "purpose" TEXT,
    "visitDate" DATE NOT NULL,
    "hours" DECIMAL(5,2),
    "photoReceived" "pm"."PhotoReceived" NOT NULL DEFAULT 'NO',
    "createdById" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Employee_name_idx" ON "pm"."Employee"("name");

-- CreateIndex
CREATE INDEX "Visit_projectId_idx" ON "pm"."Visit"("projectId");

-- CreateIndex
CREATE INDEX "Visit_employeeId_idx" ON "pm"."Visit"("employeeId");

-- CreateIndex
CREATE INDEX "Visit_visitDate_idx" ON "pm"."Visit"("visitDate");

-- AddForeignKey
ALTER TABLE "pm"."Visit" ADD CONSTRAINT "Visit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pm"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm"."Visit" ADD CONSTRAINT "Visit_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "pm"."Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm"."Visit" ADD CONSTRAINT "Visit_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "pm"."System"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm"."Visit" ADD CONSTRAINT "Visit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "pm"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
