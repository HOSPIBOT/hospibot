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

CMD ["node", "dist/src/main"]
