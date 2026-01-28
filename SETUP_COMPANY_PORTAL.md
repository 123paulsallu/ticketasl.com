
+# Admin Credentials & Company Portal Setup Guide

## Overview
This guide walks you through deploying the admin credential functions and testing the company portal functionality.

## Part 1: Deploy Admin Functions to Supabase

### Option A: Using Supabase CLI

1. **Navigate to your project:**
   ```bash
   cd C:\Users\ETUSL-CAPS\ticketasl.com
   ```

2. **Link to Supabase (if not already linked):**
   ```bash
   supabase link
   ```

3. **Deploy pending migrations:**
   ```bash
   supabase migration up
   ```
   This will deploy the `20260128000000_admin_credentials_functions.sql` migration file.

4. **Verify deployment:**
   ```bash
   supabase db list functions
   ```
   You should see these new functions:
   - `assign_admin_role`
   - `assign_company_admin_role`
   - `assign_driver_role`
   - `revoke_user_role`
   - `assign_company_admin`
   - `create_company`
   - `get_user_roles`

### Option B: Manual Deployment via Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/20260128000000_admin_credentials_functions.sql`
6. Click **Run**

## Part 2: Test Admin Role Assignment

### Run the Admin Credentials Test Suite
```bash
npm test -- src/test/admin-credentials.test.ts
```

**Expected Output After Deployment:**
- All 11 tests should pass
- Admin role assignment should work
- Company admin assignment should work
- Company creation should work

## Part 3: Test Company Portal

### Manual Testing Scenario 1: Create & Login as Company Admin

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Sign up a new user:**
   - Go to `http://localhost:5173/auth`
   - Click "Sign Up"
   - Enter:
     - Full Name: `Test Company Admin`
     - Email: `companyadmin@test.com`
     - Password: `TestPass123!`
   - Click "Sign Up"

3. **Assign company admin role (via CLI/Database):**
   ```bash
   # Connect to your Supabase database
   psql -U postgres -h db.your-project.supabase.co -d postgres
   
   -- First, get the user ID (from the email above)
   SELECT id FROM auth.users WHERE email = 'companyadmin@test.com';
   -- Copy this UUID
   
   -- Then run the function to assign company_admin role
   SELECT * FROM assign_company_admin_role('PASTE_USER_ID_HERE');
   
   -- Create a company
   SELECT * FROM create_company(
     'Test Bus Company',
     'A test company for verification',
     'test@company.com'
   );
   -- Copy the returned company_id
   
   -- Assign the company admin to the company
   SELECT * FROM assign_company_admin(
     'PASTE_USER_ID_HERE',
     'PASTE_COMPANY_ID_HERE'
   );
   ```

4. **Test company portal access:**
   - Go back to the app and sign in with the company admin account
   - You should be redirected to `/company/dashboard`
   - You should see:
     - Company dashboard with stats
     - Navigation to Fleet, Routes, Drivers, and Bookings
     - Company information displayed

### Manual Testing Scenario 2: Create & Login as Admin

1. **Sign up another user:**
   - Go to `http://localhost:5173/auth?mode=signup`
   - Create account for: `admin@test.com` / `AdminPass123!`

2. **Assign admin role:**
   ```bash
   -- Get the user ID
   SELECT id FROM auth.users WHERE email = 'admin@test.com';
   
   -- Assign admin role
   SELECT * FROM assign_admin_role('PASTE_USER_ID_HERE');
   ```

3. **Test admin portal access:**
   - Sign in with admin account
   - You should be redirected to `/admin/dashboard`
   - You should see:
     - Admin statistics (companies, users, tickets, revenue)
     - Pending approvals
     - Navigation to manage companies, users, and routes

## Part 4: Verify Company Portal Features

### Dashboard Features to Verify

✅ **Statistics Cards:**
- [ ] Total Buses (with available count)
- [ ] Active Routes (of total)
- [ ] Drivers (with active count)
- [ ] Active Tickets (of total)
- [ ] Monthly Revenue
- [ ] Monthly Bookings

✅ **Navigation Links:**
- [ ] Fleet Management `/company/fleet`
- [ ] Routes Management `/company/routes`
- [ ] Drivers Management `/company/drivers`
- [ ] Bookings Management `/company/bookings`

✅ **Company Information:**
- [ ] Company name displays
- [ ] Company status (approved/pending)
- [ ] Contact information available

### Sub-Portal Testing

1. **Fleet Management `/company/fleet`**
   - View list of buses
   - See bus capacity and status
   - Add/Edit/Delete buses (if permissions allow)

2. **Routes Management `/company/routes`**
   - View active routes
   - See origin, destination, stops
   - View estimated duration and distance
   - Create new routes

3. **Drivers Management `/company/drivers`**
   - View company drivers
   - See driver status
   - Assign drivers to buses
   - Manage driver information

4. **Bookings Management `/company/bookings`**
   - View all bookings for company
   - See booking status
   - View ticket information
   - Generate revenue reports

## Part 5: Troubleshooting

### Functions Not Found Error
**Problem:** `PGRST202: Could not find the function public.assign_admin_role`

**Solution:**
1. Verify migration was deployed:
   ```bash
   supabase migration list
   ```
2. If not deployed, run:
   ```bash
   supabase migration up
   ```
3. Restart the app:
   ```bash
   npm run dev
   ```

### User Can't Access Company Portal
**Problem:** User signs in but doesn't redirect to `/company/dashboard`

**Causes & Solutions:**
1. **User doesn't have company_admin role:**
   ```bash
   SELECT * FROM user_roles WHERE user_id = 'USER_ID' AND role = 'company_admin';
   ```
   If empty, assign the role using the function above.

2. **User not linked to company:**
   ```bash
   SELECT * FROM company_admins WHERE user_id = 'USER_ID';
   ```
   If empty, link the user to company using `assign_company_admin()`.

3. **Profile not created:**
   ```bash
   SELECT * FROM profiles WHERE user_id = 'USER_ID';
   ```
   If empty, the signup trigger might have failed. Create manually:
   ```bash
   INSERT INTO profiles (user_id, full_name) 
   VALUES ('USER_ID', 'Full Name');
   ```

### AuthContext Not Loading Roles
**Problem:** Authenticated user sees 'passenger' dashboard instead of company admin

**Debug Steps:**
1. Open browser DevTools → Console
2. Check for errors in `AuthContext.tsx`
3. Verify RLS policies allow reading user_roles:
   ```bash
   SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID';
   ```
4. Check company admin links:
   ```bash
   SELECT * FROM company_admins WHERE user_id = 'YOUR_USER_ID';
   ```

## Part 6: Production Deployment Checklist

Before deploying to production, verify:

- [ ] All migrations have been deployed to production
- [ ] Admin functions exist in production Supabase
- [ ] RLS policies are properly configured
- [ ] Company admin users can access portal
- [ ] Admin users can access admin dashboard
- [ ] Role-based routing works correctly
- [ ] Error handling for missing roles/companies is graceful
- [ ] Rate limiting is in place for role assignment functions
- [ ] Audit logging is enabled for admin actions

## Additional Resources

- [AuthContext Implementation](../src/contexts/AuthContext.tsx)
- [Test Suite](../src/test/admin-credentials.test.ts)
- [Company Dashboard](../src/pages/company/Dashboard.tsx)
- [Admin Dashboard](../src/pages/admin/Dashboard.tsx)
- [Database Schema](../supabase/migrations/20260127064104_348712d6-4de8-4458-848b-2be16e72ce35.sql)
- [Admin Functions](../supabase/migrations/20260128000000_admin_credentials_functions.sql)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review test output for specific error messages
3. Check Supabase Dashboard → Logs for database errors
4. Review browser console for client-side errors
