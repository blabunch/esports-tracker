ALTER TABLE "SearchHistory" DROP CONSTRAINT IF EXISTS "SearchHistory_userId_fkey";

ALTER TABLE "SearchHistory"
ADD CONSTRAINT "SearchHistory_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "SearchHistory_userId_createdAt_idx" ON "SearchHistory"("userId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "SearchHistory_userId_game_query_key" ON "SearchHistory"("userId", "game", "query");
