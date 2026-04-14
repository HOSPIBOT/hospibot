FROM node:18-alpine

WORKDIR /app

# Build context is server/ directory
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

RUN ls -la dist/ && echo "dist built OK"

RUN npm prune --production

EXPOSE 4000

CMD ["node", "dist/main"]
