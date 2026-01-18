-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'UTC',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HabitLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `habit` VARCHAR(191) NOT NULL DEFAULT 'pushups',
    `count` INTEGER UNSIGNED NOT NULL,
    `loggedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `source` ENUM('WHATSAPP', 'SYSTEM') NOT NULL DEFAULT 'WHATSAPP',
    `note` VARCHAR(191) NULL,

    INDEX `HabitLog_userId_habit_loggedAt_idx`(`userId`, `habit`, `loggedAt`),
    INDEX `HabitLog_userId_loggedAt_idx`(`userId`, `loggedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Goal` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `habit` VARCHAR(191) NOT NULL,
    `targetCount` INTEGER UNSIGNED NOT NULL,
    `period` ENUM('DAILY', 'WEEKLY') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `Goal_userId_period_active_idx`(`userId`, `period`, `active`),
    UNIQUE INDEX `Goal_userId_habit_period_startDate_key`(`userId`, `habit`, `period`, `startDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reminder` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `habit` VARCHAR(191) NULL,
    `cron` VARCHAR(191) NOT NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'UTC',
    `windowStart` VARCHAR(8) NULL,
    `windowEnd` VARCHAR(8) NULL,
    `lastSentAt` DATETIME(3) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `Reminder_userId_active_idx`(`userId`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HabitLog` ADD CONSTRAINT `HabitLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Goal` ADD CONSTRAINT `Goal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reminder` ADD CONSTRAINT `Reminder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
