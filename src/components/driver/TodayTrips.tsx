import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, MapPin, Users, ChevronRight, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TripTicketTracker } from './TripTicketTracker';
import { format } from 'date-fns';

interface TripSummary {
  id: string;
  trip_date: string;
  status: string;
  available_seats: number;
  schedule: {
    departure_time: string;
    bus: { registration_number: string; seat_capacity: number };
    route: { origin: string; destination: string; company_id: string };
  };
  ticket_count: number;
  scanned_count: number;
}

export function TodayTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [driverCompanyId, setDriverCompanyId] = useState<string | null>(null);

  // Get driver's company
  useEffect(() => {
    const getDriverCompany = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('drivers')
        .select('company_id')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setDriverCompanyId(data.company_id);
      }
    };
    
    getDriverCompany();
  }, [user]);

  // Fetch today's trips for the driver's company
  useEffect(() => {
    const fetchTrips = async () => {
      if (!driverCompanyId) return;
      
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Get trips for today from driver's company
      const { data: tripsData } = await supabase
        .from('trips')
        .select(`
          id, trip_date, status, available_seats,
          schedule:schedules(
            departure_time,
            bus:buses(registration_number, seat_capacity),
            route:routes(origin, destination, company_id)
          )
        `)
        .eq('trip_date', today)
        .order('trip_date', { ascending: true });

      if (tripsData) {
        // Filter by company and get ticket counts
        const companyTrips = tripsData.filter(
          (t: any) => t.schedule?.route?.company_id === driverCompanyId
        );
        
        // Get ticket counts for each trip
        const tripsWithCounts = await Promise.all(
          companyTrips.map(async (trip: any) => {
            const { data: tickets } = await supabase
              .from('tickets')
              .select('id, status')
              .eq('trip_id', trip.id);
            
            const ticketCount = tickets?.length || 0;
            const scannedCount = tickets?.filter(t => t.status === 'used').length || 0;
            
            return {
              ...trip,
              ticket_count: ticketCount,
              scanned_count: scannedCount,
            } as TripSummary;
          })
        );
        
        setTrips(tripsWithCounts);
      }
      
      setLoading(false);
    };
    
    fetchTrips();
  }, [driverCompanyId]);

  // Real-time subscription for ticket updates
  useEffect(() => {
    if (trips.length === 0) return;

    const tripIds = trips.map(t => t.id);
    
    const channel = supabase
      .channel('today-trips-tickets')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          const updated = payload.new as any;
          if (tripIds.includes(updated.trip_id)) {
            // Refresh the specific trip's counts
            setTrips(prev => prev.map(trip => {
              if (trip.id === updated.trip_id && updated.status === 'used') {
                return {
                  ...trip,
                  scanned_count: trip.scanned_count + 1,
                };
              }
              return trip;
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trips]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedTripId) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedTripId(null)}
          className="mb-2"
        >
          ← Back to Today's Trips
        </Button>
        <TripTicketTracker tripId={selectedTripId} />
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No trips scheduled for today.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Today's Trips ({format(new Date(), 'MMM d, yyyy')})
      </h2>
      
      {trips.map((trip) => {
        const progress = trip.ticket_count > 0 
          ? (trip.scanned_count / trip.ticket_count) * 100 
          : 0;
        
        return (
          <Card 
            key={trip.id} 
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setSelectedTripId(trip.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {trip.schedule.route.origin} → {trip.schedule.route.destination}
                </CardTitle>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {trip.schedule.departure_time}
                </span>
                <Badge variant="outline">
                  {trip.schedule.bus.registration_number}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Boarding
                  </span>
                  <span className="font-medium">
                    {trip.scanned_count} / {trip.ticket_count}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}