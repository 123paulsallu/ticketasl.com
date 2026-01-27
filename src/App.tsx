import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import Companies from "./pages/Companies";
import CompanyDetails from "./pages/CompanyDetails";
import Booking from "./pages/Booking";
import MyTickets from "./pages/MyTickets";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCompanies from "./pages/admin/Companies";
import AdminUsers from "./pages/admin/Users";

// Company Admin Pages
import CompanyDashboard from "./pages/company/Dashboard";
import CompanyFleet from "./pages/company/Fleet";
import CompanyRoutes from "./pages/company/Routes";
import CompanyDrivers from "./pages/company/Drivers";
import CompanyBookings from "./pages/company/Bookings";

// Driver Pages
import DriverDashboard from "./pages/driver/Dashboard";
import DriverScanner from "./pages/driver/Scanner";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/search" element={<Search />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/companies/:id" element={<CompanyDetails />} />
            <Route path="/book/:tripId" element={<Booking />} />
            <Route path="/my-tickets" element={<MyTickets />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/companies" element={<AdminCompanies />} />
            <Route path="/admin/users" element={<AdminUsers />} />

            {/* Company Admin Routes */}
            <Route path="/company" element={<CompanyDashboard />} />
            <Route path="/company/fleet" element={<CompanyFleet />} />
            <Route path="/company/routes" element={<CompanyRoutes />} />
            <Route path="/company/drivers" element={<CompanyDrivers />} />
            <Route path="/company/bookings" element={<CompanyBookings />} />

            {/* Driver Routes */}
            <Route path="/driver" element={<DriverDashboard />} />
            <Route path="/driver/scanner" element={<DriverScanner />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
