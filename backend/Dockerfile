FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
ENV NODE_ENV=production PORT=3333 STORAGE_DIR=/app/storage
EXPOSE 3333
# aplica migrations, cria os modelos prontos que faltarem (idempotente) e sobe a API
CMD ["sh", "-c", "npx prisma migrate deploy && (npm run seed || echo 'seed ignorado') && node dist/main/server.js"]
