

# Ticketa - Sierra Leone Bus Ticketing Platform

A professional, corporate-styled bus ticketing system enabling Sierra Leone citizens to purchase bus tickets online with Orange Money integration, featuring a complete ecosystem for passengers, bus companies, drivers, and administrators.

---

## 🎯 Core User Roles & Portals

### 1. **Passenger Portal** (Public-facing)
- **Home Page** with featured bus companies, popular routes, and search functionality
- **Route Search** - Find buses by origin, destination, and travel date
- **Bus Company Listings** - Browse all registered bus companies with ratings & reviews
- **Ticket Booking Flow**:
  - Select route and departure time
  - View available seats with visual seat map
  - Select preferred seat(s)
  - Enter passenger details
  - Orange Money payment (simulated initially, ready for real API integration)
  - Receive ticket with QR code + ticket code
- **My Tickets** - View active and past tickets with status
- **Leave Reviews** - Rate completed trips and bus companies

### 2. **Admin Dashboard** (Super Admin)
- **Dashboard Overview** - Key metrics: total bookings, revenue, active companies, passenger stats
- **Bus Company Management** - Approve, suspend, or manage company accounts
- **Route Management** - View and oversee all routes across companies
- **Pricing Controls** - Set base pricing guidelines or platform fees
- **User Management** - Manage passengers, company admins, and drivers
- **Reports & Analytics** - Revenue reports, booking trends, popular routes

### 3. **Bus Company Portal**
- **Company Dashboard** - Bookings, revenue, and fleet overview
- **Fleet Management** - Add/edit buses with seat capacity and amenities
- **Route Management** - Create routes with stops, schedules, departure/arrival times
- **Ticket Management** - View bookings, manage pricing per route
- **Driver Management** - Add drivers and assign to specific buses
- **Bus Availability** - Toggle bus status (available, full, not operating)
- **Schedule Management** - Set recurring schedules or one-time departures

### 4. **Driver Portal** (Mobile-optimized)
- **Today's Trips** - View assigned bus and route for the day
- **Ticket Scanner** - QR code scanner with camera + manual code entry backup
- **Ticket Validation** - Verify ticket belongs to their company and specific bus
- **Scan History** - Record of all validated tickets
- **Invalid Ticket Alerts** - Clear feedback for invalid, expired, or already-used tickets

---

## 🗺️ Key Features

### Ticket System
- Unique QR code per ticket for scanning
- Backup ticket code for manual entry
- One-time use validation (becomes invalid after scan)
- Ticket status tracking (active, used, expired, cancelled)

### Route Maps
- Visual display of routes with departure and arrival points
- Interactive map showing stops along the way
- Distance and estimated travel time

### SMS Notifications
- Booking confirmation via SMS
- Trip reminders before departure
- Ticket details sent to phone

### Reviews & Ratings
- Passengers rate completed trips (1-5 stars)
- Written reviews for bus companies
- Average ratings displayed on company profiles

### Payment System
- Simulated Orange Money flow (ready for real API when you obtain credentials)
- Payment status tracking
- Receipt generation

---

## 🎨 Design & User Experience

### Professional & Corporate Style
- Clean, structured layouts with clear hierarchy
- Neutral color palette (navy blues, grays, with orange accents for CTAs)
- Consistent typography and spacing
- Card-based UI for information display

### Navigation & Usability
- Clear role-based navigation for each portal
- Breadcrumb navigation for multi-step flows
- Mobile-responsive design throughout
- Intuitive icons with text labels
- Search and filter functionality
- Loading states and error handling

---

## 🔧 Technical Foundation

### Backend (Supabase)
- User authentication with role-based access
- Database for buses, routes, tickets, companies, drivers, scans
- Row-level security for data protection
- Edge functions for payment processing and SMS

### Security
- Separate user roles table (admin, company_admin, driver, passenger)
- Ticket validation only for authorized company drivers
- Secure payment processing

---

## 📱 Page Structure

**Public Pages:**
- Home / Landing Page
- Route Search & Results
- Bus Company Directory
- Company Profile Page
- Booking Flow (multi-step)
- Login / Register

**Passenger Pages:**
- My Tickets
- My Profile
- Trip History & Reviews

**Admin Pages:**
- Dashboard
- Companies Management
- Routes Overview
- Users Management
- Reports

**Company Admin Pages:**
- Dashboard
- Fleet Management
- Routes & Schedules
- Drivers
- Bookings & Tickets
- Settings

**Driver Pages:**
- Today's Assignments
- Ticket Scanner
- Scan History

