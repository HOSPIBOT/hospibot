FROM node:18-bullseye-slim

RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

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

# Run db push (create/update tables) then start server
CMD sh -c "echo 'Running prisma db push...' && npx prisma db push --accept-data-loss && echo 'Database ready!' && node dist/src/main"
