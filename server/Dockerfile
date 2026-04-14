FROM node:18-alpine

WORKDIR /app

# Build context is server/ directory
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

RUN ls -la dist/src/main.js && echo "✅ dist/src/main.js exists"

RUN npm prune --production

EXPOSE 4000

# Run migrations then start
CMD sh -c "npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss && node dist/src/main"
