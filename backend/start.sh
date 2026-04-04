#!/bin/sh

# Copy the pre-built database to /tmp (writable location in Cloud Run)
cp -r /app/prisma /tmp/
export DATABASE_URL="file:/tmp/prisma/dev.db"

# Start the server
node src/server.js
