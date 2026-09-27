-- CreateTable
CREATE TABLE "PlayerSnapshot" (
    "id" SERIAL NOT NULL,
    "game" TEXT NOT NULL,
    "playerKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerSnapshot_updatedAt_idx" ON "PlayerSnapshot"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSnapshot_game_playerKey_day_key" ON "PlayerSnapshot"("game", "playerKey", "day");

