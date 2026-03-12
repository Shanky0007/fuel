# Fuel Quota Management System - Implementation Summary

## 🎯 Feature Overview

A comprehensive weekly fuel quota tracking system that:
- Tracks fuel consumption by vehicle registration number
- Enforces weekly limits based on vehicle type (Car, Motorcycle, Truck, Bus)
- Prevents queue joining when weekly limit is exceeded
- Allows admins to configure limits for each vehicle type
- Records all fuel purchases automatically

---

## 📊 Database Schema Changes

### New Tables

#### 1. **FuelQuota** - Weekly Limits Configuration
```prisma
model FuelQuota {
  id            String    @id @default(uuid())
  vehicleType   String    @unique // Car, Motorcycle, Truck, Bus
  weeklyLimit   Float     // Weekly fuel limit in liters
  updatedAt     DateTime  @updatedAt
  createdAt     DateTime  @default(now())
}
```

**Default Quotas:**
- Car: 50 liters/week
- Motorcycle: 20 liters/week
- Truck: 200 liters/week
- Bus: 300 liters/week

#### 2. **FuelPurchase** - Consumption Tracking
```prisma
model FuelPurchase {
  id                String    @id @default(uuid())
  vehicleId         String
  registrationNumber String   // For quick lookup
  vehicleType       String    // For quota checking
  fuelAmount        Float     // Amount in liters
  purchaseDate      DateTime  @default(now())
  stationId         String?
  queueId           String?
  
  vehicle           Vehicle   @relation(...)
  
  @@index([registrationNumber, purchaseDate])
  @@index([vehicleType, purchaseDate])
}
```

### Modified Tables

#### **Vehicle** - Added Registration Number
```prisma
model Vehicle {
  ...
  registrationNumber String   @unique  // NEW: Official registration
  ...
  fuelPurchases     FuelPurchase[]    // NEW: Relation
}
```

#### **Queue** - Added Fuel Amount
```prisma
model Queue {
  ...
  fuelAmount    Float?    // NEW: Amount dispensed
  ...
}
```

---

## 🔧 Backend Implementation

### 1. **New Controller: `fuelQuotaController.js`**

#### Endpoints:
- `getAllQuotas()` - Get all fuel quotas
- `updateQuota()` - Update weekly limit for a vehicle type
- `getVehicleConsumption()` - Get consumption for a specific vehicle

### 2. **Updated: `queueController.js`**

#### New Logic in `joinQueue()`:
```javascript
// Check fuel quota before allowing queue join
1. Get vehicle's fuel quota based on type
2. Calculate current week's start (Monday 00:00)
3. Sum all fuel purchases for this vehicle this week
4. If consumed >= weeklyLimit:
   - Return 403 error with details
   - Show consumed amount and limit
5. Otherwise, allow queue join
```

**Error Response Example:**
```json
{
  "error": "Weekly fuel limit exceeded for Car",
  "code": "QUOTA_EXCEEDED",
  "details": {
    "vehicleType": "Car",
    "registrationNumber": "ABC123",
    "weeklyLimit": 50,
    "consumed": 50,
    "remaining": 0,
    "weekStart": "2026-02-03T00:00:00.000Z"
  },
  "message": "Your Car (ABC123) has reached its weekly fuel limit of 50L..."
}
```

### 3. **Updated: `ticketController.js`**

#### New Logic in `completeService()`:
```javascript
// Record fuel purchase when service completes
1. Get fuel amount from request (or use default based on vehicle type)
2. Update queue with fuelAmount
3. Create FuelPurchase record:
   - vehicleId
   - registrationNumber
   - vehicleType
   - fuelAmount
   - stationId
   - queueId
   - purchaseDate (auto)
```

**Default Fuel Amounts (if not specified):**
- Car: 40L
- Motorcycle: 15L
- Truck: 150L
- Bus: 200L

### 4. **Updated: `vehicleController.js`**

#### New Logic in `addVehicle()`:
```javascript
// Require and validate registration number
1. Validate registrationNumber is provided
2. Normalize to uppercase
3. Check if registration number already exists
4. Create vehicle with registrationNumber field
```

### 5. **New Routes: `adminRoutes.js`**

```javascript
// Fuel Quota Management
GET    /api/admin/fuel-quotas
PUT    /api/admin/fuel-quotas
GET    /api/admin/fuel-consumption/:registrationNumber
```

---

## 🔑 Key Features

### 1. **Weekly Limit Enforcement**
- Week starts on Monday at 00:00
- Tracks consumption by registration number
- Prevents queue join if limit exceeded
- Clear error messages with remaining quota

### 2. **Admin Control**
- Admins can set different limits for each vehicle type
- Real-time updates to quotas
- View consumption history for any vehicle

### 3. **Automatic Tracking**
- Fuel purchases recorded automatically on service completion
- Denormalized data for fast lookups
- Indexed for performance

### 4. **Registration Number as Identifier**
- Unique across all vehicles
- Normalized to uppercase
- Used for quota tracking
- Required during vehicle registration

---

## 📱 Frontend Updates Needed

### 1. **Mobile App - Vehicle Registration**
- Add "Registration Number" field to AddVehicleScreen
- Update vehicle type dropdown to match backend:
  - Car
  - Motorcycle
  - Truck
  - Bus
- Show error if registration number already exists

### 2. **Mobile App - Queue Join**
- Handle QUOTA_EXCEEDED error
- Display user-friendly message:
  ```
  ⛽ Weekly Limit Reached
  
  Your Car (ABC123) has consumed 50L this week.
  Weekly limit: 50L
  
  Please try again next Monday.
  ```

### 3. **Admin Dashboard - Fuel Quota Page**
- New tab: "Fuel Quotas"
- Table showing all vehicle types and their limits
- Edit functionality for each limit
- Save button to update quotas

### 4. **Operator Panel - Service Completion**
- Optional: Add fuel amount input field
- Default to standard amounts if not provided
- Show confirmation with fuel amount

---

## 🧪 Testing Scenarios

### Scenario 1: Normal Flow
1. User adds vehicle with registration number
2. User joins queue (first time this week)
3. Gets fuel (40L recorded)
4. Can join again (10L remaining for Car)

### Scenario 2: Quota Exceeded
1. User has consumed 50L this week
2. Tries to join queue
3. Gets error: "Weekly limit exceeded"
4. Cannot join until next Monday

### Scenario 3: Admin Updates Quota
1. Admin increases Car limit from 50L to 60L
2. Users with 50L consumed can now join queue
3. New limit applies immediately

### Scenario 4: Multiple Vehicles
1. User has 2 cars (different registration numbers)
2. Each tracked separately
3. One can exceed limit while other is fine

---

## 📊 Database Queries

### Check Weekly Consumption
```javascript
const weekStart = getMonday(); // Start of current week
const purchases = await prisma.fuelPurchase.findMany({
  where: {
    registrationNumber: "ABC123",
    purchaseDate: { gte: weekStart }
  }
});
const total = purchases.reduce((sum, p) => sum + p.fuelAmount, 0);
```

### Get Quota for Vehicle Type
```javascript
const quota = await prisma.fuelQuota.findUnique({
  where: { vehicleType: "Car" }
});
```

---

## 🚀 API Examples

### 1. Add Vehicle (Now Requires Registration Number)
```http
POST /api/vehicles
Authorization: Bearer <token>
Content-Type: application/json

{
  "licensePlate": "ABC-1234",
  "registrationNumber": "ABC123",
  "type": "Car",
  "fuelTypeId": "<uuid>"
}
```

### 2. Update Fuel Quota (Admin Only)
```http
PUT /api/admin/fuel-quotas
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "vehicleType": "Car",
  "weeklyLimit": 60
}
```

### 3. Get Vehicle Consumption
```http
GET /api/admin/fuel-consumption/ABC123
Authorization: Bearer <admin-token>

Response:
{
  "registrationNumber": "ABC123",
  "weekStart": "2026-02-03T00:00:00.000Z",
  "totalConsumed": 40,
  "purchases": [...]
}
```

### 4. Complete Service (Records Purchase)
```http
POST /api/tickets/complete
Authorization: Bearer <operator-token>
Content-Type: application/json

{
  "queueId": "<uuid>",
  "fuelAmount": 40  // Optional
}
```

---

## ⚠️ Important Notes

1. **Week Calculation**: Weeks start on Monday at 00:00:00
2. **Registration Number**: Always stored in UPPERCASE
3. **Fuel Amount**: If not provided, uses defaults based on vehicle type
4. **Quota Check**: Happens BEFORE queue join, not during
5. **Database Reset**: Existing vehicles need registration numbers added

---

## 🎨 Next Steps

1. ✅ Backend implementation complete
2. ⏳ Update mobile app registration screen
3. ⏳ Add quota exceeded error handling in mobile app
4. ⏳ Create admin fuel quota management page
5. ⏳ Optional: Add fuel amount input in operator panel

---

## 📝 Migration Notes

**Database was reset** because:
- Added required `registrationNumber` field to Vehicle table
- Existing vehicles didn't have this field
- Fresh start ensures data integrity

**To restore data:**
- Re-create stations via admin dashboard
- Users need to re-register and add vehicles with registration numbers

---

**Implementation Status: Backend Complete ✅**
**Next: Frontend Updates Required**
