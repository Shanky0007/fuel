# 🚀 Smart Fuel Station — Project Startup Guide

A step-by-step guide to get the entire **Smart Fuel Station Queue Management System** up and running on your local machine.

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Project Structure](#-project-structure)
- [Port Map](#-port-map)
- [Step 1 — Node.js Setup](#step-1--nodejs-setup)
- [Step 2 — Backend Server](#step-2--backend-server)
- [Step 3 — Mobile App (Expo)](#step-3--mobile-app-expo)
- [Step 4 — Admin Dashboard](#step-4--admin-dashboard)
- [Default Login Credentials](#-default-login-credentials)
- [Quick Start (All-in-One)](#-quick-start-all-in-one)
- [Common Issues & Fixes](#-common-issues--fixes)
- [Stopping All Servers](#-stopping-all-servers)

---

## ✅ Prerequisites

Before starting, make sure you have the following installed:

| Tool | Version | Check Command |
|------|---------|--------------|
| **Node.js** | v22+ (v22.18.0 recommended) | `node -v` |
| **npm** | v11+ | `npm -v` |
| **nvm** | (recommended for Node version management) | `nvm -v` |
| **Git** | Any recent version | `git --version` |

> ⚠️ **Important:** This project requires **Node.js v22+**. Older versions (v18, v20) will cause Vite and Expo to fail. Use `nvm` to switch versions if needed.

---

## 📁 Project Structure

```
sevev_day/
├── backend/              # Express.js API server (Prisma + SQLite)
├── mobile-app/           # Expo React Native app (Customer + Operator)
├── admin-dashboard/      # Vite React admin panel
├── docs/                 # Documentation
├── WORKING_OVERVIEW.md   # How the system works
└── start.md              # This file
```

---

## 🔌 Port Map

| Service | URL | Port |
|---------|-----|------|
| **Backend API** | http://localhost:5000 | `5000` |
| **Mobile App (Web)** | http://localhost:8081 | `8081` |
| **Admin Dashboard** | http://localhost:5174 | `5174` |

> The mobile app includes both **Customer** and **Operator** panels (selected via role on launch).
> All frontend apps connect to the backend at `http://localhost:5000/api`

---

## Step 1 — Node.js Setup

Ensure you're using Node.js v22+. If you have `nvm` installed:

```bash
nvm install 22
nvm use 22
node -v   # Should show v22.x.x
```

If you don't have `nvm`, install it first:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

---

## Step 2 — Backend Server

The backend is an **Express.js** API using **Prisma ORM** with **SQLite** as the database.

### 2.1 Install Dependencies

```bash
cd backend
npm install
```

### 2.2 Set Up Database

Generate the Prisma client and create the database:

```bash
npx prisma generate
npx prisma db push
```

### 2.3 Seed the Database

This creates the initial data (countries, regions, fuel types, fuel quotas, and default admin account):

```bash
npm run seed
```

> This will create:
> - Countries: India, USA, UK, Canada (with regions)
> - Fuel Types: Petrol, Diesel, EV, CNG
> - Fuel Quotas: Car (50L/week), Motorcycle (20L/week), Truck (200L/week), Bus (300L/week)
> - Admin User: `admin@smartfuel.com` / `admin123`

### 2.4 Start the Backend

```bash
npm run dev
```

✅ You should see: **`Server running on port 5000`**

> The backend uses `nodemon` for hot-reload during development. You can verify it's running by visiting: http://localhost:5000/health

### 2.5 Environment Variables

The backend `.env` file is located at `backend/.env`:

```env
DATABASE_URL="file:./dev.db"
PORT=5000
JWT_SECRET=your_jwt_secret_key_here_change_in_production
```

---

## Step 3 — Mobile App (Expo)

The mobile app serves **both Customers and Operators** (selected via a role selection screen on launch).

### 3.1 Install Dependencies

Open a **new terminal**:

```bash
cd mobile-app
npm install
```

### 3.2 Start the Expo Dev Server

**For Web (Browser):**
```bash
npx expo start --web --port 8081
```

**For Android (Expo Go app):**
```bash
npx expo start
```
Then scan the QR code with the **Expo Go** app on your phone.

**For Android/iOS only:**
```bash
npx expo start --android
npx expo start --ios
```

✅ For web, open: **http://localhost:8081**

### 3.3 API Configuration

The mobile app automatically detects the API URL:
- **Web:** Uses `http://localhost:5000/api`
- **Physical Device (Expo Go):** Automatically uses your computer's local network IP

If you're using a physical device and the API isn't connecting, update the fallback IP in `mobile-app/src/config.js`:

```javascript
// Change this to your computer's local IP
return 'http://192.168.1.30:5000/api';
```

Find your IP with:
```bash
hostname -I | awk '{print $1}'
```

---

## Step 4 — Admin Dashboard

The admin dashboard is a **Vite + React** web app for managing stations, operators, and viewing analytics.

### 5.1 Install Dependencies

Open a **new terminal**:

```bash
cd admin-dashboard
npm install
```

### 5.2 Start the Dev Server

```bash
npm run dev -- --port 5174
```

✅ Open: **http://localhost:5174**

---

## 🔑 Default Login Credentials

### Admin Dashboard
| Field | Value |
|-------|-------|
| Email | `admin@smartfuel.com` |
| Password | `admin123` |

### Operators
> Operators are created from the Admin Dashboard (**Operators** page → **Add Operator**).
> You can also register through the Mobile App by selecting the **Operator** role.

### Customers
> Register through the Mobile App's signup screen.

---

## ⚡ Quick Start (All-in-One)

If all dependencies are already installed and the database is seeded, you can start everything at once. Open **3 separate terminals** and run:

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 — Mobile App:**
```bash
cd mobile-app && npx expo start --web --port 8081
```

**Terminal 3 — Admin Dashboard:**
```bash
cd admin-dashboard && npm run dev -- --port 5174
```

### One-Liner (for quick testing)

> ⚠️ This runs all servers in the background. Use the [Stopping All Servers](#-stopping-all-servers) section to stop them.

```bash
cd backend && npm run dev &
cd ../mobile-app && npx expo start --web --port 8081 &
cd ../admin-dashboard && npm run dev -- --port 5174 &
```

---

## 🔧 Common Issues & Fixes

### 1. `EADDRINUSE: address already in use`

A port is already occupied by another process. Kill it:

```bash
# Kill process on a specific port (e.g., 5000)
lsof -ti:5000 | xargs kill -9

# Kill all project ports at once
lsof -ti:5000 | xargs kill -9; lsof -ti:5174 | xargs kill -9; lsof -ti:8081 | xargs kill -9
```

### 2. `Node.js version too old` / Vite or Expo fails to start

```bash
nvm use 22
# Or install it first:
nvm install 22
```

### 3. `Prisma Client not generated`

```bash
cd backend
npx prisma generate
```

### 4. `Database not found / tables missing`

```bash
cd backend
npx prisma db push
npm run seed
```

### 5. `Module not found` errors

```bash
# In whichever project has the error:
rm -rf node_modules package-lock.json
npm install
```

### 6. Mobile App can't connect to backend on physical device

- Make sure your phone and computer are on the **same Wi-Fi network**
- Update the fallback IP in `mobile-app/src/config.js`
- Make sure no firewall is blocking port 5000

### 7. Expo Web `Alert.alert` / Buttons not working

The mobile app uses `Platform.OS` detection to handle differences between web and native. If something works on the phone but not in the browser (or vice versa), this is expected behavior since React Native Web doesn't support all native APIs. The app handles this automatically.

### 8. Database Reset (Start Fresh)

```bash
cd backend
rm -f prisma/dev.db
npx prisma db push
npm run seed
```

---

## 🛑 Stopping All Servers

### Method 1: Kill by port

```bash
lsof -ti:5000 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null
lsof -ti:8081 | xargs kill -9 2>/dev/null
echo "All servers stopped"
```

### Method 2: Kill all Node processes

```bash
killall node 2>/dev/null
echo "All Node processes stopped"
```

### Method 3: Use Ctrl+C

Press `Ctrl+C` in each terminal window where a server is running.

---

## 📝 Typical Workflow

1. **Admin** logs into the Admin Dashboard → creates fuel stations and operator accounts
2. **Operator** logs into the Mobile App (selects Operator role) → gets assigned to a station/region
3. **Customer** registers on the Mobile App → browses nearby stations → joins a queue → gets a QR code ticket
4. **Customer** arrives at station → shows QR code / verification code
5. **Operator** scans QR / enters code → verifies ticket → sees fuel quota → enters fuel amount → completes service
6. **System** tracks weekly fuel quotas per vehicle registration number automatically

---

## 📊 API Endpoints (Reference)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login |
| `/api/stations` | GET | List stations |
| `/api/queue/join` | POST | Join a queue |
| `/api/queue/my-queues` | GET | Get user's queues |
| `/api/tickets/verify` | POST | Verify ticket (QR/code) |
| `/api/tickets/complete` | POST | Complete service |
| `/api/operator/queues` | GET | Get operator's regional queues |
| `/api/admin/stats` | GET | Admin dashboard stats |
| `/health` | GET | Health check |

---

<p align="center">Made with ❤️ for a better fuel station experience</p>
