# Deployment Steps to Fix CORS and APK Issues

## ✅ Fixes Applied

### 1. Backend CORS Configuration
- **File:** `backend/src/server.js`
- **Change:** Added `ngrok-skip-browser-warning` to allowed headers
- **Impact:** Fixes CORS errors for both admin dashboard and mobile app

### 2. Mobile App Permissions
- **File:** `mobile-app/app.json`
- **Change:** Added Android permissions (INTERNET, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, ACCESS_NETWORK_STATE)
- **Impact:** Prevents app crashes on startup due to missing permissions

### 3. Removed Unnecessary Headers
- **Files:** 
  - `admin-dashboard/src/services/api.js`
  - `mobile-app/src/services/api.js`
  - `mobile-app/src/services/operatorApi.js`
- **Change:** Removed `ngrok-skip-browser-warning` header (cleaner approach)
- **Impact:** Prevents future CORS issues, cleaner production code

---

## 🚀 Deployment Instructions

### Step 1: Deploy Backend to Cloud Run

```bash
cd backend

# Build and push Docker image
gcloud builds submit --tag asia-south1-docker.pkg.dev/project-ad965005-a3d0-4fa1-b99/fuel-repo/fuel-backend:latest

# Deploy to Cloud Run
gcloud run deploy fuel-backend \
  --image asia-south1-docker.pkg.dev/project-ad965005-a3d0-4fa1-b99/fuel-repo/fuel-backend:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

### Step 2: Deploy Admin Dashboard to Cloud Run

```bash
cd admin-dashboard

# Build and push Docker image
gcloud builds submit --tag asia-south1-docker.pkg.dev/project-ad965005-a3d0-4fa1-b99/fuel-repo/fuel-admin:latest

# Deploy to Cloud Run
gcloud run deploy fuel-admin \
  --image asia-south1-docker.pkg.dev/project-ad965005-a3d0-4fa1-b99/fuel-repo/fuel-admin:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

### Step 3: Rebuild Mobile App APK

```bash
cd mobile-app

# Build APK with EAS
eas build --platform android --profile production

# Or for preview build
eas build --platform android --profile preview
```

**Note:** The build will take 10-15 minutes. You'll get a download link when complete.

---

## 🧪 Testing Instructions

### Test Admin Dashboard
1. Open: https://fuel-admin-175700686095.asia-south1.run.app
2. Login with: `admin@smartfuel.com` / `admin123`
3. Should login successfully without CORS errors

### Test Mobile APK
1. Download the new APK from EAS build
2. Install on Android device
3. App should open without crashing
4. Login should work without errors
5. Location features should request permissions properly

---

## 🔍 Verification Checklist

- [ ] Backend deployed successfully
- [ ] Admin dashboard deployed successfully
- [ ] Admin dashboard login works (no CORS errors)
- [ ] Mobile APK built successfully
- [ ] Mobile app opens without crashing
- [ ] Mobile app can make API calls
- [ ] Location permissions requested properly

---

## 🐛 If Issues Persist

### Admin Dashboard Still Shows CORS Error
- Clear browser cache and hard refresh (Ctrl+Shift+R)
- Check browser console for exact error message
- Verify backend deployment completed successfully

### APK Still Crashes
- Check Android Logcat for crash logs: `adb logcat`
- Ensure you installed the NEW build (check version/timestamp)
- Try uninstalling old app completely before installing new one

### API Calls Fail
- Verify backend is running: https://fuel-backend-175700686095.asia-south1.run.app/health
- Check if database needs reseeding (SQLite resets on container restart)

---

## 📝 Notes

- Backend uses SQLite in `/tmp` - data resets on container restart
- For production, migrate to Cloud SQL for persistent storage
- All services are publicly accessible (--allow-unauthenticated)
- CORS now allows all origins for development convenience
