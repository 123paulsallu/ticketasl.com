-- Function to assign admin role to a user
CREATE OR REPLACE FUNCTION public.assign_admin_role(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role_id uuid;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Insert admin role (UPSERT pattern)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'message', 'Admin role assigned successfully'
  );
END;
$$;

-- Function to assign company_admin role to a user
CREATE OR REPLACE FUNCTION public.assign_company_admin_role(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Insert company_admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'company_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'message', 'Company admin role assigned successfully'
  );
END;
$$;

-- Function to assign driver role to a user
CREATE OR REPLACE FUNCTION public.assign_driver_role(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Insert driver role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'driver')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'message', 'Driver role assigned successfully'
  );
END;
$$;

-- Function to revoke a role from a user
CREATE OR REPLACE FUNCTION public.revoke_user_role(_user_id uuid, _role app_role)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deleted_count int;
BEGIN
  DELETE FROM public.user_roles
  WHERE user_id = _user_id AND role = _role;

  GET DIAGNOSTICS _deleted_count = ROW_COUNT;

  IF _deleted_count = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Role not found for this user'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Role revoked successfully'
  );
END;
$$;

-- Function to assign company admin to a company
CREATE OR REPLACE FUNCTION public.assign_company_admin(_user_id uuid, _company_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Check if company exists
  IF NOT EXISTS (SELECT 1 FROM public.bus_companies WHERE id = _company_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Company not found'
    );
  END IF;

  -- Ensure user has company_admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'company_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Link user to company
  INSERT INTO public.company_admins (user_id, company_id)
  VALUES (_user_id, _company_id)
  ON CONFLICT (user_id, company_id) DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'message', 'User assigned as company admin successfully'
  );
END;
$$;

-- Function to create a new company by admin
CREATE OR REPLACE FUNCTION public.create_company(_name text, _description text DEFAULT NULL, _contact_email text DEFAULT NULL, _contact_phone text DEFAULT NULL, _address text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
BEGIN
  INSERT INTO public.bus_companies (name, description, contact_email, contact_phone, address)
  VALUES (_name, _description, _contact_email, _contact_phone, _address)
  RETURNING id INTO _company_id;

  RETURN json_build_object(
    'success', true,
    'company_id', _company_id,
    'message', 'Company created successfully'
  );
END;
$$;

-- Function to get all user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS table(role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id;
$$;

-- Revoke the default INSERT policy to prevent direct insertions
-- and rely on the functions instead
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile - updated"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
