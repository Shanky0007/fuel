#!/bin/bash

# Setup Google Cloud Scheduler for SQLite Cloud Keep-Alive
# This script creates a cron job that pings your database every 2 minutes

echo "Setting up Google Cloud Scheduler for database keep-alive..."

# Configuration
PROJECT_ID="project-ad965005-a3d0-4fa1-b99"
REGION="asia-south1"
JOB_NAME="fuel-db-keepalive"
API_URL="https://fuel-backend-175700686095.asia-south1.run.app/api/health/db-ping"
SCHEDULE="*/2 * * * *"  # Every 2 minutes

# Check if job already exists
if gcloud scheduler jobs describe $JOB_NAME --location=$REGION &> /dev/null; then
    echo "Job already exists. Updating..."
    gcloud scheduler jobs update http $JOB_NAME \
        --location=$REGION \
        --schedule="$SCHEDULE" \
        --uri="$API_URL" \
        --http-method=GET
else
    echo "Creating new cron job..."
    gcloud scheduler jobs create http $JOB_NAME \
        --location=$REGION \
        --schedule="$SCHEDULE" \
        --uri="$API_URL" \
        --http-method=GET \
        --description="Keep SQLite Cloud database alive by pinging every 2 minutes"
fi

echo ""
echo "✅ Cron job setup complete!"
echo ""
echo "Job Details:"
echo "  Name: $JOB_NAME"
echo "  Schedule: Every 2 minutes"
echo "  URL: $API_URL"
echo "  Region: $REGION"
echo ""
echo "To view the job:"
echo "  gcloud scheduler jobs describe $JOB_NAME --location=$REGION"
echo ""
echo "To manually trigger the job:"
echo "  gcloud scheduler jobs run $JOB_NAME --location=$REGION"
echo ""
echo "To view logs:"
echo "  gcloud scheduler jobs logs $JOB_NAME --location=$REGION"
echo ""
