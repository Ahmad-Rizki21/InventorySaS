-- AlterTable
ALTER TABLE `activitylog` ADD COLUMN `entity` VARCHAR(191) NULL,
    ADD COLUMN `entityId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `ActivityLog_entity_entityId_idx` ON `ActivityLog`(`entity`, `entityId`);
