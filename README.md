# Smart Fuel Station Queue Management System

A complete system to eliminate physical waiting lines at fuel stations through virtual queues and QR-based e-tickets.

## 🏗️ System Architecture

- **Backend API**: Node.js/Express with Prisma ORM (SQLite)
- **Mobile App**: React Native (Expo) for customers
- **Operator Panel**: React/Vite web app for station staff
- **Admin Dashboard**: React/Vite web app for administrators

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- For mobile: Expo Go app on your phone OR Android Studio/Xcode

### Installation

Clone the repository and install dependencies for all projects:

```bash
# Clone the repository
git clone https://github.com/VivekSingh0811/Fuel_Queue_System.git
cd Fuel_Queue_System

# Install Backend dependencies
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed  # Seeds the database with initial data
cd ..

# Install Admin Dashboard dependencies
cd admin-dashboard
npm install
cd ..

# Install Operator Panel dependencies
cd operator-panel
npm install
cd ..

# Install Mobile App dependencies
cd mobile-app
npm install
cd ..
```

### Running the Application

#### 1. Start the Backend Server

```bash
cd backend
npm run dev
```
✅ Backend will run on `http://localhost:5000`

#### 2. Start the Admin Dashboard

```bash
cd admin-dashboard
npm run dev
```
✅ Admin dashboard will run on `http://localhost:5173`

#### 3. Start the Operator Panel

```bash
cd operator-panel
npm run dev
```
✅ Operator panel will run on `http://localhost:5174`

#### 4. Start the Mobile App

```bash
cd mobile-app
npm start
```
✅ Mobile app will run on `http://localhost:8081`
- Press `w` for web browser
- Scan QR code with Expo Go app for mobile

## 👥 Test Credentials

### Admin Account
- Email: `admin@smartfuel.com`
- Password: `admin123`
- Access: Operator Panel + Admin Dashboard

### Customer Account (Create via Mobile App)
- Register through the mobile app
- Or use: `vivek@example.com` / `password123` (if already created)

## 📱 Complete User Flow

### Customer Journey:
1. Open mobile app → Register/Login
2. Add a vehicle (license plate, type, fuel type)
3. Browse nearby stations
4. Select station → Join Queue
5. Receive QR ticket with position
6. Arrive at station → Show QR to operator
7. Get fuel → Done!

### Operator Journey:
1. Login to Operator Panel (`http://localhost:5173`)
2. Click "Scan QR" tab
3. Use camera or paste QR data manually
4. Verify customer ticket
5. Switch to "Queue" tab
6. Mark service as complete

### Admin Journey:
1. Login to Admin Dashboard (`http://localhost:5174`)
2. **Overview Tab** - View analytics:
   - Total stations
   - Active queues
   - Vehicles serviced
   - Traffic charts
3. **Stations Tab** - Manage fuel stations:
   - Add new stations with name, location, coordinates
   - Set available fuel types (Petrol, Diesel, EV, CNG)
   - Update station status (Open/Closed/Maintenance)
   - Delete stations
4. **Operators Tab** - Manage staff:
   - Create operator accounts with credentials
   - Assign operators to specific regions
   - Delete operator accounts


## 🗂️ Project Structure

```
sevev_day/
├── backend/              # Node.js API
│   ├── src/
│   │   ├── controllers/  # Business logic
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth & validation
│   │   └── utils/        # JWT helpers
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── seed.js       # Sample data
│   └── package.json
│
├── mobile-app/           # React Native (Expo)
│   ├── src/
│   │   ├── screens/      # Login, Stations, Ticket
│   │   ├── context/      # Auth state
│   │   ├── services/     # API calls
│   │   └── theme/        # Colors & styles
│   └── App.js
│
├── operator-panel/       # React/Vite
│   ├── src/
│   │   ├── pages/        # Login, Dashboard
│   │   ├── components/   # QRScanner, QueueList
│   │   └── services/     # API
│   └── package.json
│
├── admin-dashboard/      # React/Vite
│   ├── src/
│   │   ├── pages/        # Dashboard with charts
│   │   └── services/     # Analytics API
│   └── package.json
│
└── docs/                 # System documentation
    ├── System_Architecture.md
    ├── Database_Schema.md
    ├── API_Endpoints.md
    └── User_Journey.md
```

## 🔑 Key API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Stations
- `GET /api/stations` - List all stations
- `GET /api/stations/:id` - Get station details
- `GET /api/stations/:id/queue` - Get station queue

### Vehicles
- `POST /api/vehicles` - Add vehicle
- `GET /api/vehicles` - List my vehicles
- `DELETE /api/vehicles/:id` - Remove vehicle

### Queue & Tickets
- `POST /api/queue/join` - Join queue (generates QR ticket)
- `GET /api/queue/status` - Get my queue status
- `POST /api/queue/cancel` - Leave queue
- `POST /api/tickets/verify` - Verify QR code (Operator)
- `POST /api/tickets/complete` - Mark complete (Operator)

## 🎨 Features

### Mobile App
- ✨ Vibrant gradient UI (Purple/Pink theme)
- 🎫 QR ticket generation
- 📍 Station locator
- 🚗 Vehicle management
- ⏱️ Real-time queue position

### Operator Panel
- 📷 Camera-based QR scanning
- 📋 Queue management
- ✅ Service completion
- 🎨 Modern card design

### Admin Dashboard
- 📊 Analytics with charts (Recharts)
- 📈 Traffic flow visualization
- ⛽ Fuel distribution pie chart
- 🏢 Station monitoring

## 🛠️ Technologies Used

- **Backend**: Node.js, Express, Prisma, SQLite, JWT, bcrypt, QRCode
- **Mobile**: React Native, Expo, React Navigation, Axios, QRCode
- **Web**: React, Vite, Axios, html5-qrcode, Recharts
- **Styling**: CSS3, Linear Gradients, Flexbox, Grid

## 📝 Development Timeline

- **Day 1**: System Blueprint & Documentation
- **Day 2**: Backend Base Setup
- **Day 3**: Queue & Ticket System Core
- **Day 4**: Customer Mobile Application
- **Day 5**: Gas Station Operator Panel
- **Day 6**: Administrator Dashboard

## 🐛 Troubleshooting

### Backend won't start
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npx prisma generate
npm start
```

### Mobile app camera issues
- Use manual QR input as fallback
- Check camera permissions

### Port already in use
- Backend: Change PORT in `.env`
- Web apps: Vite will auto-increment port

## 📄 License

This is a demonstration project for educational purposes.

---

Built with ❤️ for Smart Fuel Station Management
