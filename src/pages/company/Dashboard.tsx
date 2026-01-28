import { useQuery } from '@tanstack/react-query';
import { Bus, Route, Users, Ticket, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanyLayout } from '@/components/layout/CompanyLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function CompanyDashboard() {
  const { companyId } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['company-stats', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      // Fetch all relevant data
      const [busesRes, routesRes, driversRes, ticketsRes, companyRes] = await Promise.all([
        supabase.from('buses').select('id, is_available').eq('company_id', companyId),
        supabase.from('routes').select('id, is_active').eq('company_id', companyId),
        supabase.from('drivers').select('id, is_active').eq('company_id', companyId),
        supabase.from('tickets').select(`
          id, price_paid, status, purchased_at,
          trip:trips!inner(
            schedule:schedules!inner(
              route:routes!inner(company_id)
            )
          )
        `),
        supabase.from('bus_companies').select('*').eq('id', companyId).single(),
      ]);

      const buses = busesRes.data || [];
      const routes = routesRes.data || [];
      const drivers = driversRes.data || [];
      const allTickets = ticketsRes.data || [];
      const company = companyRes.data;

      // Filter tickets for this company
      const tickets = allTickets.filter(t => t.trip?.schedule?.route?.company_id === companyId);

      // Calculate monthly revenue
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const monthlyTickets = tickets.filter(t => {
        const purchaseDate = new Date(t.purchased_at);
        return purchaseDate >= monthStart && purchaseDate <= monthEnd;
      });
      const monthlyRevenue = monthlyTickets.reduce((sum, t) => sum + (t.price_paid || 0), 0);

      return {
        totalBuses: buses.length,
        availableBuses: buses.filter(b => b.is_available).length,
        totalRoutes: routes.length,
        activeRoutes: routes.filter(r => r.is_active).length,
        totalDrivers: drivers.length,
        activeDrivers: drivers.filter(d => d.is_active).length,
        totalTickets: tickets.length,
        activeTickets: tickets.filter(t => t.status === 'active').length,
        monthlyRevenue,
        monthlyBookings: monthlyTickets.length,
        company,
      };
    },
    enabled: !!companyId,
  });

  const statCards = [
    {
      title: 'Total Buses',
      value: stats?.totalBuses || 0,
      subtitle: `${stats?.availableBuses || 0} available`,
      icon: Bus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/company/fleet',
    },
    {
      title: 'Active Routes',
      value: stats?.activeRoutes || 0,
      subtitle: `of ${stats?.totalRoutes || 0} total`,
      icon: Route,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/company/routes',
    },
    {
      title: 'Drivers',
      value: stats?.totalDrivers || 0,
      subtitle: `${stats?.activeDrivers || 0} active`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/company/drivers',
    },
    {
      title: 'Total Bookings',
      value: stats?.totalTickets || 0,
      subtitle: `${stats?.activeTickets || 0} active`,
      icon: Ticket,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/company/bookings',
    },
  ];

  return (
    <CompanyLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your company operations.
          </p>
        </div>

        {/* Company Status Alert */}
        {stats?.company && !stats.company.is_approved && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertCircle className="h-6 w-6 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">Pending Approval</p>
                <p className="text-sm text-amber-700">
                  Your company is awaiting admin approval. Some features may be limited.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card 
              key={stat.title} 
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate(stat.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Card */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Monthly Revenue
              </CardTitle>
              <CardDescription>
                Revenue for {format(new Date(), 'MMMM yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <div className="text-3xl font-bold text-green-600">
                  Le {(stats?.monthlyRevenue || 0).toLocaleString()}
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                From {stats?.monthlyBookings || 0} bookings this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks for your company
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => navigate('/company/fleet')}
              >
                <Bus className="mr-2 h-4 w-4" />
                Add New Bus
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => navigate('/company/routes')}
              >
                <Route className="mr-2 h-4 w-4" />
                Create New Route
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => navigate('/company/drivers')}
              >
                <Users className="mr-2 h-4 w-4" />
                Add Driver
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </CompanyLayout>
  );
}
