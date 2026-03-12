# End-to-End User Journey

## 1. Customer Journey
1.  **Onboarding**: User downloads app -> Registers with Name/Phone -> Logs in.
2.  **Vehicle Setup**: User adds a vehicle (e.g., "Honda City", Car, Petrol).
3.  **Discovery**: User views map/list of nearby stations. Selects "Station A".
4.  **Booking**: User sees "Current Wait Time: 15 mins". Clicks "Join Queue".
5.  **Ticket**: System generates a QR Ticket. App displays "Position #5".
6.  **Waiting**: User travels to station. App updates position (#4... #3...).
7.  **Arrival**: User arrives. Shows QR code to Operator.
8.  **Fueling**: Operator scans QR. Status -> "Servicing". User gets fuel.
9.  **Completion**: Operator marks done. Status -> "Completed". User leaves.

## 2. Operator Journey
1.  **Login**: Operator logs into Web Panel at the station.
2.  **Dashboard**: Sees "5 Vehicles in Queue".
3.  **Action**: Car arrives. Operator clicks "Scan" (or uses handheld).
4.  **Verification**: Scans Customer QR. System confirms "Valid Ticket. #1 in Queue".
5.  **Service**: Operator pumps fuel.
6.  **Close**: Operator clicks "Complete". Queue advances.

## 3. Admin Journey
1.  **Monitoring**: Log in to Admin Dashboard.
2.  **Overview**: See heatmap of busy stations.
3.  **Management**: Add a new station "Station B" in a new location.
4.  **Analytics**: Check "Peak Hours" report to advise on staffing.
```
