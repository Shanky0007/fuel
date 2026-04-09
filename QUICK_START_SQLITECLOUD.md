# Quick Start: SQLite Cloud Setup

## What You Need
1. Your SQLite Cloud connection string (from the dashboard after creating the project)
2. About 10 minutes

## Step-by-Step Instructions

### 1. Install SQLite Cloud Driver

```bash
cd backend
npm install @sqlitecloud/drivers
```

### 2. Update backend/.env

Replace the DATABASE_URL line with your SQLite Cloud connection string:

```env
DATABASE_URL="sqlitecloud://your-host.sqlite.cloud:8860/fuel?apikey=your-api-key"
PORT=5000
JWT_SECRET="supersecret_jwt_key_123"
EMAIL_USER=tarinagarwal@gmail.com
EMAIL_PASSWORD=uiulzisyqvllitdh
FRONTEND_URL=https://fuel-admin-175700686095.asia-south1.run.app
```

### 3. Push Schema and Seed Data

```bash
cd backend
npx prisma db push
npx prisma db seed
```

### 4. Test Locally (Optional)

```bash
npm start
```

Visit http://localhost:5000/health/db-ping to verify database connection.

### 5. Deploy to Cloud Run

```bash
cd backend

# Build
gcloud builds submit --tag asia-south1-docker.pkg.dev/project-ad965005-a3d0-4fa1-b99/fuel-repo/fuel-backend:latest

# Deploy with new DATABASE_URL
gcloud run deploy fuel-backend \
  --image asia-south1-docker.pkg.dev/project-ad965005-a3d0-4fa1-b99/fuel-repo/fuel-backend:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --update-env-vars DATABASE_URL="sqlitecloud://your-host.sqlite.cloud:8860/fuel?apikey=your-api-key"
```

### 6. Setup Cron Job (Choose ONE option)

#### Option A: Google Cloud Scheduler (Recommended)

```bash
gcloud scheduler jobs create http fuel-db-keepalive \
  --schedule="*/2 * * * *" \
  --uri="https://fuel-backend-175700686095.asia-south1.run.app/api/health/db-ping" \
  --http-method=GET \
  --location=asia-south1
```

#### Option B: Cron-job.org (Free, Easy)

1. Go to https://cron-job.org/en/signup.php
2. Sign up (free)
3. Click "Create Cronjob"
4. Fill in:
   - **Title:** Fuel DB Keep-Alive
   - **URL:** `https://fuel-backend-175700686095.asia-south1.run.app/api/health/db-ping`
   - **Schedule:** Custom - `*/2 * * * *` (every 2 minutes)
5. Save

#### Option C: UptimeRobot (Free, 5-min intervals)

1. Go to https://uptimerobot.com/signUp
2. Sign up (free)
3. Add New Monitor:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Fuel DB Keep-Alive
   - **URL:** `https://fuel-backend-175700686095.asia-south1.run.app/api/health/db-ping`
   - **Monitoring Interval:** 5 minutes
4. Create Monitor

### 7. Verify Everything Works

Test the endpoints:

```bash
# Basic health check
curl https://fuel-backend-175700686095.asia-south1.run.app/health

# Database ping
curl https://fuel-backend-175700686095.asia-south1.run.app/api/health/db-ping

# Detailed health
curl https://fuel-backend-175700686095.asia-south1.run.app/health/detailed
```

Expected response from `/api/health/db-ping`:
```json
{
  "status": "OK",
  "database": "connected",
  "timestamp": "2026-04-03T...",
  "stats": {
    "users": 1,
    "stations": 0
  }
}
```

### 8. Test Admin Dashboard

1. Go to https://fuel-admin-175700686095.asia-south1.run.app
2. Login with `admin@smartfuel.com` / `admin123`
3. Everything should work as before!

## Troubleshooting

### "Connection refused" error
- Check your SQLite Cloud connection string is correct
- Verify the API key is valid
- Make sure you deployed with the correct DATABASE_URL

### "Database not found" error
- Run `npx prisma db push` to create the schema
- Run `npx prisma db seed` to add initial data

### Cron job not working
- Test the endpoint manually first
- Check Cloud Scheduler logs: `gcloud scheduler jobs logs fuel-db-keepalive --location=asia-south1`
- Verify the URL is correct

## Free Tier Limits

SQLite Cloud Free Tier:
- ✅ 1 GB storage (plenty for your app)
- ✅ 30 concurrent connections
- ✅ 100 MB data sync/month
- ⚠️ Stops after 12h inactivity (that's why we need the cron job)

## Cost Estimate

- SQLite Cloud: **$0/month** (free tier)
- Google Cloud Scheduler: **~$0.10/month** (first 3 jobs free)
- Cron-job.org: **$0/month** (free)
- UptimeRobot: **$0/month** (free)

**Total: $0-0.10/month** 🎉

## Next Steps

After migration:
1. Monitor your SQLite Cloud dashboard for usage
2. Check cron job is running (should see requests every 2 minutes)
3. Rebuild mobile APK if needed
4. Celebrate! 🎉 Your database is now online and persistent!
