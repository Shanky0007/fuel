FROM node:20-slim
WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate

# Run migrations to create the database file during build
RUN npx prisma migrate deploy || true
RUN npx prisma db seed || true

# Make start script executable
RUN chmod +x start.sh

EXPOSE 5000
CMD ["./start.sh"]
