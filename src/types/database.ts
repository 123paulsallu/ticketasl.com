// Custom types for Ticketa application
export type AppRole = 'admin' | 'company_admin' | 'driver' | 'passenger';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface BusCompany {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  is_approved: boolean;
  is_active: boolean;
  average_rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface Bus {
  id: string;
  company_id: string;
  registration_number: string;
  model: string | null;
  seat_capacity: number;
  amenities: string[] | null;
  is_available: boolean;
  status: 'available' | 'full' | 'maintenance' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  company_id: string;
  origin: string;
  destination: string;
  stops: string[] | null;
  distance_km: number | null;
  estimated_duration_minutes: number | null;
  map_coordinates: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  route_id: string;
  bus_id: string;
  departure_time: string;
  arrival_time: string | null;
  days_of_week: number[];
  price_leones: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  schedule_id: string;
  trip_date: string;
  available_seats: number;
  status: 'scheduled' | 'boarding' | 'departed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  company_id: string;
  license_number: string | null;
  assigned_bus_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  trip_id: string;
  passenger_id: string | null;
  passenger_name: string;
  passenger_phone: string;
  seat_number: number;
  ticket_code: string;
  qr_code: string | null;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  price_paid: number;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_reference: string | null;
  purchased_at: string;
  scanned_at: string | null;
  scanned_by: string | null;
  created_at: string;
}

export interface TicketScan {
  id: string;
  ticket_id: string;
  scanned_by: string;
  scan_result: 'valid' | 'invalid' | 'already_used' | 'wrong_bus' | 'expired';
  scan_location: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  company_id: string;
  ticket_id: string | null;
  user_id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
}

// Extended types with relations
export interface TripWithDetails extends Trip {
  schedule: Schedule & {
    route: Route & {
      company: BusCompany;
    };
    bus: Bus;
  };
}

export interface TicketWithDetails extends Ticket {
  trip: TripWithDetails;
}
