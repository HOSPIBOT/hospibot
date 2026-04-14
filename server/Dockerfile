FROM node:18-bullseye-slim

RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install deps including prisma binary
RUN npm install

# Generate Prisma client (skip checksum if blocked)
RUN PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate

COPY . .

RUN npm run build

RUN ls -la dist/src/main.js && echo "✅ dist/src/main.js exists"

RUN npm prune --production

EXPOSE 4000

CMD sh -c "echo 'Running prisma db push...' && PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma db push --accept-data-loss && echo 'Database ready!' && node dist/src/main"
