-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "pm";

-- CreateEnum
CREATE TYPE "pm"."ProjectStatus" AS ENUM ('ENQUIRY', 'QUOTED', 'IN_PROGRESS', 'HANDED_OVER', 'UNDER_MAINTENANCE', 'CLOSED');

-- CreateEnum
CREATE TYPE "pm"."SystemType" AS ENUM ('POOL', 'FOUNTAIN', 'RO', 'STP', 'WTP', 'SPARES', 'CONSUMABLES');

-- CreateEnum
CREATE TYPE "pm"."ItemCategory" AS ENUM ('MECHANICAL', 'ELECTRICAL', 'CHEMICAL', 'MEDIA', 'FITTINGS', 'OTHER');

-- CreateEnum
CREATE TYPE "pm"."Role" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "pm"."Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm"."Project" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "pm"."ProjectStatus" NOT NULL DEFAULT 'ENQUIRY',
    "address" TEXT,
    "description" TEXT,
    "budgetValue" DECIMAL(14,2),
    "startDate" DATE,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm"."System" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "pm"."SystemType" NOT NULL,
    "label" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "System_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm"."Item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "pm"."ItemCategory" NOT NULL DEFAULT 'OTHER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm"."Entry" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "itemId" TEXT,
    "customName" TEXT,
    "description" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT,
    "sentOn" DATE NOT NULL,
    "receivedBy" TEXT,
    "rate" DECIMAL(14,2),
    "amount" DECIMAL(14,2),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm"."Expense" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "spentOn" DATE NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "pm"."Role" NOT NULL DEFAULT 'EDITOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Client_name_idx" ON "pm"."Client"("name");

-- CreateIndex
CREATE INDEX "Project_clientId_idx" ON "pm"."Project"("clientId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "pm"."Project"("status");

-- CreateIndex
CREATE INDEX "System_projectId_idx" ON "pm"."System"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_name_key" ON "pm"."Item"("name");

-- CreateIndex
CREATE INDEX "Entry_itemId_idx" ON "pm"."Entry"("itemId");

-- CreateIndex
CREATE INDEX "Entry_systemId_idx" ON "pm"."Entry"("systemId");

-- CreateIndex
CREATE INDEX "Entry_sentOn_idx" ON "pm"."Entry"("sentOn");

-- CreateIndex
CREATE INDEX "Expense_projectId_idx" ON "pm"."Expense"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "pm"."User"("email");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "pm"."AuditLog"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "pm"."Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "pm"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm"."System" ADD CONSTRAINT "System_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pm"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm"."Entry" ADD CONSTRAINT "Entry_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "pm"."System"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm"."Entry" ADD CONSTRAINT "Entry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "pm"."Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm"."Entry" ADD CONSTRAINT "Entry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "pm"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm"."Expense" ADD CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pm"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm"."Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "pm"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Enforce that an entry references EITHER a catalog item OR a free-text custom
-- name, never both and never neither. (customName is only permitted for SPARES
-- / CONSUMABLES systems; that is enforced in the service layer.)
ALTER TABLE "pm"."Entry"
    ADD CONSTRAINT "Entry_item_xor_custom_name"
    CHECK (
        ("itemId" IS NOT NULL AND "customName" IS NULL)
        OR ("itemId" IS NULL AND "customName" IS NOT NULL)
    );
