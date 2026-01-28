import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCompanyData() {
  const { companyId } = useAuth();

  const companyQuery = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('bus_companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const busesQuery = useQuery({
    queryKey: ['company-buses', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const routesQuery = useQuery({
    queryKey: ['company-routes', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const schedulesQuery = useQuery({
    queryKey: ['company-schedules', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          route:routes(*),
          bus:buses(*)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Filter by company routes
      return (data || []).filter(s => s.route?.company_id === companyId);
    },
    enabled: !!companyId,
  });

  const driversQuery = useQuery({
    queryKey: ['company-drivers', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          bus:buses(*),
          profile:profiles!drivers_user_id_fkey(*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  return {
    company: companyQuery.data,
    buses: busesQuery.data || [],
    routes: routesQuery.data || [],
    schedules: schedulesQuery.data || [],
    drivers: driversQuery.data || [],
    isLoading: companyQuery.isLoading || busesQuery.isLoading || routesQuery.isLoading,
    refetchBuses: busesQuery.refetch,
    refetchRoutes: routesQuery.refetch,
    refetchSchedules: schedulesQuery.refetch,
    refetchDrivers: driversQuery.refetch,
  };
}
