# Smart Fuel Queue Management System

A comprehensive fuel station queue management system with admin dashboard, mobile app, and real-time queue tracking.

## 🏗️ Project Structure

```
├── backend/              # Node.js + Express API
├── admin-dashboard/      # React admin web dashboard
└── mobile-app/          # React Native mobile app (Expo)
```

## 🚀 Features

### Admin Dashboard
- Dashboard with analytics and statistics
- Fuel quota management (weekly limits per vehicle type)
- Station management (CRUD operations)
- Operator management
- Live queue monitoring
- Station map view
- Fuel consumption tracking

### Mobile App
- User registration and authentication
- View nearby fuel stations
- Join station queues
- Real-time queue status
- QR code ticket generation
- Profile management
- Vehicle management

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- Prisma ORM
- Turso (libSQL) Database
- JWT Authentication
- Nodemailer for emails

**Admin Dashboard:**
- React + Vite
- Axios for API calls
- CSS3 for styling

**Mobile App:**
- React Native (Expo)
- Expo Router
- AsyncStorage
- React Native Maps

## 📋 Prerequisites

- Node.js 18+ and npm
- Turso CLI (for database)
- Expo CLI (for mobile app)
- ngrok (for mobile app testing)

## ⚙️ Setup Instructions

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Turso database URL and credentials

# Run Prisma migrations
npx prisma generate
npx prisma migrate deploy

# Seed initial data (fuel types, quotas, admin user)
npm run seed

# Start server
npm start
```

Backend runs on `http://localhost:5000`

**Default Admin Credentials:**
- Email: `admin@smartfuel.com`
- Password: `admin123`

### 2. Admin Dashboard Setup

```bash
cd admin-dashboard

# Install dependencies
npm install

# Configure environment
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start dev server
npm run dev
```

Dashboard runs on `http://localhost:5173`

### 3. Mobile App Setup

```bash
cd mobile-app

# Install dependencies
npm install

# Update API URL in src/config.js
# For local testing with ngrok:
# 1. Run: ngrok http 5000
# 2. Copy ngrok URL
# 3. Update NGROK_URL in src/config.js

# Start Expo
npx expo start
```

Scan QR code with Expo Go app to test on device.

## 🗄️ Database Schema

Key models:
- **User** - Customers, operators, and admins
- **Station** - Fuel stations with location and inventory
- **Queue** - Active queue entries
- **Ticket** - QR code tickets for queue entries
- **Vehicle** - User vehicles with registration
- **FuelQuota** - Weekly fuel limits per vehicle type
- **FuelPurchase** - Fuel consumption tracking
- **FuelType** - Available fuel types (Petrol, Diesel, EV, CNG)

## 🌍 Deployment

### Backend (Cloud Run)
```bash
cd backend
gcloud builds submit --tag [REGION]-docker.pkg.dev/[PROJECT]/[REPO]/fuel-backend
gcloud run deploy fuel-backend --image [IMAGE] --region [REGION]
```

### Admin Dashboard (Cloud Run)
```bash
cd admin-dashboard
gcloud builds submit --tag [REGION]-docker.pkg.dev/[PROJECT]/[REPO]/fuel-admin
gcloud run deploy fuel-admin --image [IMAGE] --region [REGION]
```

### Mobile App (EAS Build)
```bash
cd mobile-app
eas build --platform android --profile production
```

## 🔐 Environment Variables

### Backend (.env)
```
DATABASE_URL=libsql://[DATABASE_URL]?authToken=[TOKEN]
PORT=5000
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=https://your-admin-dashboard-url
```

### Admin Dashboard (.env)
```
VITE_API_URL=https://your-backend-url/api
```

### Mobile App (src/config.js)
```javascript
export const API_URL = "https://your-backend-url/api";
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Stations
- `GET /api/stations` - Get all stations
- `GET /api/stations/:id` - Get station details
- `POST /api/admin/stations` - Create station (admin)
- `PUT /api/admin/stations/:id` - Update station (admin)
- `DELETE /api/admin/stations/:id` - Delete station (admin)

### Queue
- `POST /api/queue/join` - Join queue
- `GET /api/queue/status` - Get my queue status
- `POST /api/queue/cancel` - Leave queue
- `GET /api/admin/queues` - Get all queues (admin)

### Fuel Quotas
- `GET /api/admin/fuel-quotas` - Get all quotas
- `PUT /api/admin/fuel-quotas` - Update quota
- `GET /api/admin/fuel-consumption/:registrationNumber` - Check consumption

## 🧪 Testing

### Backend
```bash
cd backend
npm test
```

### Admin Dashboard
```bash
cd admin-dashboard
npm run dev
# Open http://localhost:5173
# Login with admin credentials
```

### Mobile App
```bash
cd mobile-app
npx expo start
# Scan QR with Expo Go app
```

## 📄 License

MIT

## 👥 Contributors

[Your Name/Team]

## 🐛 Known Issues

- Location services may not work in iOS simulator
- Maps require Google Maps API key for production

## 🔮 Future Enhancements

- Push notifications for queue updates
- Payment integration
- Multi-language support
- Advanced analytics and reporting
- Operator mobile app
