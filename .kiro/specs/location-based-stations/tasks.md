# Implementation Plan

- [x] 1. Database schema migration and seed data
  - Create Prisma migration to add Country and Region tables
  - Add country and region fields to User table (nullable initially)
  - Add vehicleType and fuelType fields to User table (nullable initially)
  - Add country and region fields to Station table (nullable initially)
  - Create seed script to populate initial countries and regions with coordinates
  - _Requirements: 1.6, 1.7, 1.8, 1.9, 6.1, 6.6, 6.7, 6.8, 8.1_

- [x] 1.1 Write property test for location data persistence
  - **Property 2: User location persistence**
  - **Validates: Requirements 1.3**

- [x] 2. Implement backend location service
  - Create LocationService class with methods for getting countries and regions
  - Implement country-region validation logic
  - Add API endpoints for /api/locations/countries and /api/locations/countries/:countryId/regions
  - _Requirements: 1.2, 1.5_

- [ ]* 2.1 Write property test for region filtering
  - **Property 1: Region filtering by country**
  - **Validates: Requirements 1.2**

- [ ]* 2.2 Write property test for location validation
  - **Property 4: Country-region combination validation**
  - **Validates: Requirements 1.5**

- [x] 3. Implement distance calculator service
  - Create DistanceCalculator class with Haversine formula implementation
  - Add distance formatting function (1 decimal place in km)
  - Handle edge cases for missing or invalid coordinates
  - _Requirements: 2.3, 7.1, 7.2_

- [ ]* 3.1 Write property test for Haversine accuracy
  - **Property 7: Haversine distance calculation accuracy**
  - **Validates: Requirements 2.3, 7.1**

- [ ]* 3.2 Write property test for distance formatting
  - **Property 21: Distance formatting precision**
  - **Validates: Requirements 7.2**

- [x] 4. Update authentication endpoints for location and vehicle information
  - Modify POST /api/auth/register to require country, region, vehicleType, and fuelType fields
  - Add validation to reject registration with missing location or vehicle data
  - Add validation to ensure vehicleType is one of (Car, Bike, Truck, Other)
  - Add validation to ensure fuelType is one of (Petrol, Diesel, EV, CNG)
  - Create PATCH /api/auth/profile/location endpoint for updating user location
  - Create PATCH /api/auth/profile/vehicle endpoint for updating user vehicle information
  - _Requirements: 1.1, 1.3, 1.4, 1.6, 1.7, 1.8, 1.9_

- [ ]* 4.1 Write property test for registration validation
  - **Property 3: Registration validation rejects missing location**
  - **Validates: Requirements 1.4**

- [ ]* 4.2 Write property test for non-empty location validation
  - **Property 20: Non-empty location validation**
  - **Validates: Requirements 6.4**

- [x] 5. Extend station service with location filtering
  - Modify StationService to filter stations by user's country and region
  - Integrate distance calculation for each station
  - Implement sorting by distance (ascending order)
  - Handle stations without coordinates (place at end of list)
  - _Requirements: 2.1, 2.2, 2.5, 7.5_

- [ ]* 5.1 Write property test for station filtering
  - **Property 5: Station filtering by user region**
  - **Validates: Requirements 2.1**

- [ ]* 5.2 Write property test for station sorting
  - **Property 8: Station sorting by distance**
  - **Validates: Requirements 2.5**

- [ ]* 5.3 Write property test for stations without coordinates
  - **Property 23: Stations without coordinates sorted last**
  - **Validates: Requirements 7.5**

- [ ]* 5.4 Write property test for distance recalculation
  - **Property 22: Distance recalculation on location update**
  - **Validates: Requirements 7.4**

- [x] 6. Update station API endpoints
  - Modify GET /api/stations to accept userId query parameter
  - Add distance calculation and regional filtering to station responses
  - Ensure station details include all required fields (name, address, distance, coordinates, country, region)
  - _Requirements: 2.1, 2.2_

- [ ]* 6.1 Write property test for station display fields
  - **Property 6: Station display includes required fields**
  - **Validates: Requirements 2.2**

- [x] 7. Implement queue service location validation
  - Add validation to prevent users from joining queues at stations outside their region
  - Update queue creation to store station location and user region
  - Modify QR ticket generation to include station identifier and user location
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [ ]* 7.1 Write property test for queue-station association
  - **Property 9: Queue-station association**
  - **Validates: Requirements 3.2**

- [ ]* 7.2 Write property test for QR ticket location data
  - **Property 10: QR ticket contains location data**
  - **Validates: Requirements 3.3**

- [ ]* 7.3 Write property test for cross-region prevention
  - **Property 11: Cross-region queue prevention**
  - **Validates: Requirements 3.4**

- [ ]* 7.4 Write property test for queue location recording
  - **Property 12: Queue entry records location**
  - **Validates: Requirements 3.5**

- [ ] 8. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Update mobile app registration flow
  - Create dark mode theme configuration file with colors, spacing, and shadows
  - Add country selection dropdown to registration screen with dark mode styling
  - Add region selection dropdown (populated based on selected country) with dark mode styling
  - Add vehicle type selection dropdown with options (Car, Bike, Truck, Other) with dark mode styling
  - Add fuel type selection dropdown with options (Petrol, Diesel, EV, CNG) with dark mode styling
  - Implement validation to require country, region, vehicle type, and fuel type before completing registration
  - Update registration API call to include location and vehicle data
  - Apply dark mode theme consistently across all registration screens
  - Ensure WCAG AA contrast compliance for all text and interactive elements
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 1.8, 1.9, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 10. Update mobile app station list screen
  - Modify station list to display distance for each station with dark mode card styling
  - Show station address, region, and status with appropriate dark mode colors
  - Implement sorting by distance (nearest first)
  - Display "Distance unavailable" for stations without coordinates
  - Add pull-to-refresh to update distances
  - Apply card-based layout with rounded corners, shadows, and spacing
  - Use dark background colors and ensure text contrast for readability
  - Add smooth transitions and animations for card interactions
  - _Requirements: 2.1, 2.2, 2.5, 7.2, 7.3, 9.1, 9.2, 9.3, 9.4, 9.7_

- [x] 11. Update mobile app queue joining flow
  - Add validation before joining queue to check station is in user's region
  - Display error message if user attempts to join queue at out-of-region station with dark mode styling
  - Ensure QR ticket displays station and location information with dark mode design
  - Style all modals and dialogs with dark mode theme
  - Add visual feedback for button presses and interactions
  - _Requirements: 3.1, 3.3, 3.4, 9.1, 9.2, 9.3, 9.4_

- [x] 12. Add operator region assignment
  - Add assignedRegion field to User model for operators
  - Create admin interface to assign regions to operators
  - Update operator authentication to load assigned region
  - _Requirements: 4.1_

- [x] 13. Update operator panel with regional filtering
  - Filter all station and queue data by operator's assigned region
  - Display user location (country and region) in queue entries
  - Add validation to QR scanning to verify ticket is from operator's region
  - Show error message when operator attempts to process out-of-region ticket
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 13.1 Write property test for operator filtering
  - **Property 13: Operator regional filtering**
  - **Validates: Requirements 4.1, 4.5**

- [ ]* 13.2 Write property test for operator ticket validation
  - **Property 14: Operator ticket region validation**
  - **Validates: Requirements 4.2, 4.4**

- [ ]* 13.3 Write property test for queue display location
  - **Property 15: Queue display includes user location**
  - **Validates: Requirements 4.3**

- [ ] 14. Update admin dashboard with geographic filters
  - Add country filter dropdown to dashboard
  - Add region filter dropdown (populated based on selected country)
  - Implement filtering of all analytics data by selected geography
  - Update metrics to show country and region groupings
  - Add map view showing station locations in selected area
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 14.1 Write property test for admin country aggregation
  - **Property 16: Admin country aggregation**
  - **Validates: Requirements 5.2**

- [ ]* 14.2 Write property test for admin region filtering
  - **Property 17: Admin region filtering**
  - **Validates: Requirements 5.3**

- [ ]* 14.3 Write property test for analytics grouping
  - **Property 18: Analytics grouping by geography**
  - **Validates: Requirements 5.4**

- [ ]* 14.4 Write property test for map filtering
  - **Property 19: Map displays filtered stations**
  - **Validates: Requirements 5.5**

- [ ] 15. Data migration for existing records
  - Create migration script to add default country and region to existing users
  - Create migration script to add default vehicle type and fuel type to existing users
  - Update existing stations with location data (admin input or default values)
  - Verify all existing queue entries remain valid
  - Add prompt for users with default location or vehicle data to update their information
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 16. Make location and vehicle fields required
  - Update Prisma schema to make country, region, vehicleType, and fuelType non-nullable
  - Run final migration to enforce non-null constraints
  - Update all validation to enforce non-empty values
  - _Requirements: 6.4, 6.6_
  - _Requirements: 6.4_

- [ ] 17. Final checkpoint - End-to-end testing
  - Ensure all tests pass, ask the user if questions arise.
