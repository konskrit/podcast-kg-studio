-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN "llmProvider" TEXT,
ADD COLUMN "ttsModel" TEXT,
ADD COLUMN "ttsVoice" TEXT,
ADD COLUMN "encryptedTtsApiKey" TEXT;

-- RenameColumn
ALTER TABLE "UserSettings" RENAME COLUMN "encryptedCloudApiKey" TO "encryptedLlmApiKey";