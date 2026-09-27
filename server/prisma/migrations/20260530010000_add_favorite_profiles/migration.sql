CREATE TABLE "FavoriteProfile" (
    "id" SERIAL NOT NULL,
    "shortcutId" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "subtitle" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "FavoriteProfile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FavoriteProfile_userId_game_updatedAt_idx" ON "FavoriteProfile"("userId", "game", "updatedAt");

CREATE UNIQUE INDEX "FavoriteProfile_userId_shortcutId_key" ON "FavoriteProfile"("userId", "shortcutId");

ALTER TABLE "FavoriteProfile" ADD CONSTRAINT "FavoriteProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
