FROM node:18-bullseye-slim

# Install OpenSSL 1.1 (Prisma requirement — bullseye has it natively)
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

# Generate Prisma client for correct platform (debian/bullseye)
RUN npx prisma generate

RUN npm run build

RUN ls -la dist/src/main.js && echo "✅ dist/src/main.js exists"

RUN npm prune --production

EXPOSE 4000

CMD sh -c "npx prisma db push --accept-data-loss 2>&1 | tail -3 && node dist/src/main"
