FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL deps (including devDeps needed for build)
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
