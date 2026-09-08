# ── Build ────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build
WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npm run prisma:generate

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

# ── Runtime (Render free = 512Mi hard limit) ─────────────────────────
FROM node:22-bookworm-slim
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
  && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

RUN useradd --system --uid 10001 --create-home appuser \
  && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080
CMD ["node", "dist/main.js"]
