FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies (including Prisma CLI for runtime migrations)
# The glob helps if package-lock isn't strictly there
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy all source files
COPY . .

# Generate Prisma Client and build the Next.js app 
# (Requires no DB connection at build phase)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build

# Set production environment state
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# The startup command runs when Zeabur boots the container.
# 1. Pushes the schema to the remote Zeabur PostgreSQL DB (Requires DATABASE_URL injected by Zeabur UI)
# 2. Boots the actual Next.js web application
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && npm run start"]
