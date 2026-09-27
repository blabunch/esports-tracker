# --- Build: встановлюємо всі залежності, генеруємо Prisma Client і компілюємо TypeScript
FROM node:22-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# --- Runtime: лише production-залежності і скомпільований код, без root-прав
FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --chown=node:node package.json ./
USER node
EXPOSE 5001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://localhost:5001/api/health || exit 1
# Міграції застосовуються перед стартом, щоб схема БД завжди відповідала коду
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
