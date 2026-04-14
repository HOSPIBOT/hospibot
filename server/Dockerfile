FROM node:18-alpine

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

RUN ls -la dist/src/main.js && echo "✅ dist/src/main.js exists"

RUN npm prune --production

EXPOSE 4000

CMD sh -c "npx prisma db push --accept-data-loss 2>&1 | tail -5 && node dist/src/main"
