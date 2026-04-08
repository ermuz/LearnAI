-- CreateTable
CREATE TABLE `Job` (
    `id` VARCHAR(191) NOT NULL,
    `instruction` TEXT NOT NULL,
    `type` ENUM('cron', 'every', 'at') NOT NULL DEFAULT 'cron',
    `cron` VARCHAR(100) NULL,
    `everyMs` INTEGER NULL,
    `at` DATETIME(3) NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `lastRun` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
