-- Create role enum for user types
CREATE TYPE public.app_role AS ENUM ('admin', 'company_admin', 'driver', 'passenger');

-- Create user roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'passenger',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bus companies table
CREATE TABLE public.bus_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    is_approved BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    average_rating DECIMAL(2,1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create company admins linking table
CREATE TABLE public.company_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.bus_companies(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, company_id)
);

-- Create buses table
CREATE TABLE public.buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.bus_companies(id) ON DELETE CASCADE NOT NULL,
    registration_number TEXT NOT NULL,
    model TEXT,
    seat_capacity INTEGER NOT NULL DEFAULT 40,
    amenities TEXT[],
    is_available BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'full', 'maintenance', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routes table
CREATE TABLE public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.bus_companies(id) ON DELETE CASCADE NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    stops TEXT[],
    distance_km DECIMAL(10,2),
    estimated_duration_minutes INTEGER,
    map_coordinates JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create schedules table
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE NOT NULL,
    bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME,
    days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
    price_leones DECIMAL(12,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trips table (actual trip instances)
CREATE TABLE public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE NOT NULL,
    trip_date DATE NOT NULL,
    available_seats INTEGER NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarding', 'departed', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (schedule_id, trip_date)
);

-- Create drivers table
CREATE TABLE public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    company_id UUID REFERENCES public.bus_companies(id) ON DELETE CASCADE NOT NULL,
    license_number TEXT,
    assigned_bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tickets table
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    passenger_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    passenger_name TEXT NOT NULL,
    passenger_phone TEXT NOT NULL,
    seat_number INTEGER NOT NULL,
    ticket_code TEXT NOT NULL UNIQUE,
    qr_code TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
    price_paid DECIMAL(12,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_reference TEXT,
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    scanned_at TIMESTAMP WITH TIME ZONE,
    scanned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket scans history
CREATE TABLE public.ticket_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    scan_result TEXT NOT NULL CHECK (scan_result IN ('valid', 'invalid', 'already_used', 'wrong_bus', 'expired')),
    scan_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.bus_companies(id) ON DELETE CASCADE NOT NULL,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's company ID
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.company_admins WHERE user_id = _user_id
  UNION
  SELECT company_id FROM public.drivers WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for bus_companies
CREATE POLICY "Anyone can view approved companies"
ON public.bus_companies FOR SELECT
USING (is_approved = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all companies"
ON public.bus_companies FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company admins can update their company"
ON public.bus_companies FOR UPDATE
TO authenticated
USING (id = public.get_user_company_id(auth.uid()));

-- RLS Policies for company_admins
CREATE POLICY "View company admin links"
ON public.company_admins FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage company admin links"
ON public.company_admins FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for buses
CREATE POLICY "Anyone can view buses of approved companies"
ON public.buses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.bus_companies 
  WHERE id = buses.company_id AND is_approved = true
));

CREATE POLICY "Company admins can manage their buses"
ON public.buses FOR ALL
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for routes
CREATE POLICY "Anyone can view active routes"
ON public.routes FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin') OR company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can manage their routes"
ON public.routes FOR ALL
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for schedules
CREATE POLICY "Anyone can view active schedules"
ON public.schedules FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company admins can manage their schedules"
ON public.schedules FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.routes r 
  WHERE r.id = schedules.route_id 
  AND (r.company_id = public.get_user_company_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
));

-- RLS Policies for trips
CREATE POLICY "Anyone can view trips"
ON public.trips FOR SELECT
USING (true);

CREATE POLICY "Company admins can manage their trips"
ON public.trips FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.schedules s
  JOIN public.routes r ON r.id = s.route_id
  WHERE s.id = trips.schedule_id
  AND (r.company_id = public.get_user_company_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
));

-- RLS Policies for drivers
CREATE POLICY "Drivers can view themselves"
ON public.drivers FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR company_id = public.get_user_company_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company admins can manage their drivers"
ON public.drivers FOR ALL
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tickets
CREATE POLICY "Users can view their own tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (passenger_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR EXISTS (
  SELECT 1 FROM public.trips t
  JOIN public.schedules s ON s.id = t.schedule_id
  JOIN public.routes r ON r.id = s.route_id
  WHERE t.id = tickets.trip_id
  AND r.company_id = public.get_user_company_id(auth.uid())
));

CREATE POLICY "Authenticated users can purchase tickets"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK (passenger_id = auth.uid());

CREATE POLICY "Drivers can update ticket status"
ON public.tickets FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'driver') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ticket_scans
CREATE POLICY "Drivers can view their scans"
ON public.ticket_scans FOR SELECT
TO authenticated
USING (scanned_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can insert scans"
ON public.ticket_scans FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'driver'));

-- RLS Policies for reviews
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews FOR SELECT
USING (is_approved = true);

CREATE POLICY "Users can insert reviews"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bus_companies_updated_at BEFORE UPDATE ON public.bus_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_buses_updated_at BEFORE UPDATE ON public.buses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'passenger');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update company ratings
CREATE OR REPLACE FUNCTION public.update_company_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.bus_companies
  SET 
    average_rating = (SELECT AVG(rating)::DECIMAL(2,1) FROM public.reviews WHERE company_id = NEW.company_id AND is_approved = true),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE company_id = NEW.company_id AND is_approved = true)
  WHERE id = NEW.company_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_company_rating_trigger
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_company_rating();