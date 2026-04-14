FROM node:18-alpine

WORKDIR /app

# Copy server package files (build context is repo root, so reference server/)
COPY server/package*.json ./
COPY server/prisma ./prisma/

# Install dependencies
RUN npm install

# Copy server source only
COPY server/ .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS app
RUN npm run build

# Verify dist was created
RUN ls -la dist/ && echo "✅ dist/main.js exists" || (echo "❌ dist/ not found" && exit 1)

# Remove dev dependencies
RUN npm prune --production

EXPOSE 4000

CMD ["node", "dist/main"]
