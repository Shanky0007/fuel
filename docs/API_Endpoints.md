# High-Level API Endpoints

## 1. Authentication
*   `POST /api/auth/register` - Register a new user (Customer).
*   `POST /api/auth/login` - Login for all roles.
*   `GET /api/auth/me` - Get current user profile.

## 2. Stations
*   `GET /api/stations` - List all stations (with optional location filter).
*   `GET /api/stations/:id` - Get details of a specific station.
*   `GET /api/stations/:id/queue` - Get current queue status/length for a station.

## 3. Vehicles
*   `POST /api/vehicles` - Add a new vehicle.
*   `GET /api/vehicles` - List my vehicles.
*   `DELETE /api/vehicles/:id` - Remove a vehicle.

## 4. Queue & Booking
*   `POST /api/queue/join` - Join a queue (requires station_id, vehicle_id).
    *   *Returns ticket details.*
*   `GET /api/queue/status` - Get my current active queue position.
*   `POST /api/queue/cancel` - Leave the queue.

## 5. Tickets (Operator)
*   `POST /api/tickets/verify` - Verify a QR code (Operator only).
*   `POST /api/tickets/complete` - Mark servicing as done (Operator only).

## 6. Admin
*   `GET /api/admin/dashboard` - Aggregate stats.
*   `POST /api/admin/stations` - Create/Update station.
```
