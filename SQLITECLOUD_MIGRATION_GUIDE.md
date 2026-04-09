# SQLite Cloud Migration Guide

## Overview
This guide will help you migrate from local SQLite to SQLite Cloud and set up a cron job to keep the database alive on the free tier.

## Step 1: Create SQLite Cloud Project

1. Go to https://sqlitecloud.io/
2. Sign up / Log in
3. Create a new project with these settings:
   - **Project Type:** Free
   - **Project name:** fuel
   - **Region:** Asia Pacific
   - **Label:** Development

4. After creation, you'll get a connection string like:
   ```
   sqlitecloud://your-host.sqlite.cloud:8860/fuel?apikey=your-api-key
   ```

## Step 2: Install SQLite Cloud Driver

```bash
cd backend
npm install @sqlitecloud/drivers
```

## Step 3: Update Environment Variables

Update `backend/.env`:

```env
# SQLite Cloud Configuration
DATABASE_URL="sqlitecloud://your-host.sqlite.cloud:8860/fuel?apikey=your-api-key"

# Keep these existing values
PORT=5000
JWT_SECRET="supersecret_jwt_key_123"
EMAIL_USER=tarinagarwal@gmail.com
EMAIL_PASSWORD=uiulzisyqvllitdh
FRONTEND_URL=https://fuel-admin-175700686095.asia-south1.run.app
```

## Step 4: Update Prisma Schema

The schema is already compatible! SQLite Cloud uses the same SQLite syntax.

## Step 5: Migrate Your Data

### Option A: Push Schema to SQLite Cloud (Recommended for new setup)

```bash
cd backend
npx prisma db push
npx prisma db seed
```

### Option B: Copy Existing Data (If you have important data)

1. Export your local database:
```bash
sqlite3 backend/prisma/dev.db .dump > backup.sql
```

2. Import to SQLite Cloud using their web interface or CLI

## Step 6: Create Keep-Alive Endpoint

This endpoint will be called by a cron job to prevent the free tier from sleeping.

The endpoint is already created in `backend/src/routes/healthRoutes.js`

## Step 7: Set Up Cron Job (Free Options)

### Option A: Google Cloud Scheduler (Recommended - Already on GCP)

```bash
# Create a Cloud Scheduler job that runs every 2 minutes
gcloud scheduler jobs create http fuel-db-keepalive \
  --schedule="*/2 * * * *" \
  --uri="https://fuel-backend-175700686095.asia-south1.run.app/api/health/db-ping" \
  --http-method=GET \
  --location=asia-south1
```

### Option B: Cron-job.org (Free, No Setup Required)

1. Go to https://cron-job.org/
2. Sign up for free
3. Create a new cron job:
   - **Title:** Fuel DB Keep-Alive
   - **URL:** https://fuel-backend-175700686095.asia-south1.run.app/api/health/db-ping
   - **Schedule:** Every 2 minutes (*/2 * * * *)
   - **Method:** GET

### Option C: UptimeRobot (Free, 5-minute intervals)

1. Go to https://uptimerobot.com/
2. Sign up for free
3. Add new monitor:
   - **Monitor Type:** HTTP(s)
   - **URL:** https://fuel-backend-175700686095.asia-south1.run.app/api/health/db-ping
   - **Monitoring Interval:** 5 minutes (free tier)

## Step 8: Deploy Updated Backend

```bash
cd backend

# Build and push
gcloud builds submit --tag asia-south1-docker.pkg.dev/project-ad965005-a3d0-4fa1-b99/fuel-repo/fuel-backend:latest

# Deploy
gcloud run deploy fuel-backend \
  --image asia-south1-docker.pkg.dev/project-ad965005-a3d0-4fa1-b99/fuel-repo/fuel-backend:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="your-sqlitecloud-connection-string"
```

## Step 9: Verify Everything Works

1. Test the health endpoint:
```bash
curl https://fuel-backend-175700686095.asia-south1.run.app/health
```

2. Test the DB ping endpoint:
```bash
curl https://fuel-backend-175700686095.asia-south1.run.app/api/health/db-ping
```

3. Test the admin dashboard login

## Important Notes for Free Tier

### SQLite Cloud Free Tier Limits:
- **Storage:** 1 GB
- **vCPU:** 0.5 vCPUs
- **RAM:** 0.5 GB
- **Data Sync:** 100 MB/month
- **Connections:** 30 max concurrent
- **Cold Starts:** Stopped after 12h of inactivity

### Why You Need a Cron Job:
The free tier stops after 12 hours of inactivity. A cron job hitting your database every 2 minutes keeps it alive and prevents cold starts.

### Cost Considerations:
- SQLite Cloud Free: $0/month
- Google Cloud Scheduler: ~$0.10/month (first 3 jobs free)
- Cron-job.org: Free
- UptimeRobot: Free

## Troubleshooting

### Connection Issues
If you get connection errors:
1. Check your API key is correct
2. Verify the host URL
3. Ensure your IP isn't blocked (SQLite Cloud free tier allows all IPs)

### Migration Issues
If data doesn't migrate:
1. Check Prisma schema is compatible
2. Run `npx prisma generate` after schema changes
3. Use `npx prisma db push --force-reset` to reset and recreate

### Performance Issues
If queries are slow:
1. Add indexes to frequently queried fields
2. Consider upgrading from free tier if you exceed limits
3. Optimize your queries

## Rollback Plan

If something goes wrong, you can quickly rollback:

1. Change `DATABASE_URL` back to `file:./dev.db`
2. Redeploy backend
3. Your local database is still intact

## Next Steps

After migration:
1. Monitor your database usage in SQLite Cloud dashboard
2. Set up alerts for connection limits
3. Consider upgrading if you hit free tier limits
4. Backup your database regularly
