import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Clock, MapPin, Users, Bus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Ticket {
  id: string;
  passenger_name: string;
  seat_number: number;
  status: string;
  scanned_at: string | null;
}

interface TripDetails {
  id: string;
  trip_date: string;
  status: string;
  available_seats: number;
  schedule: {
    departure_time: string;
    arrival_time: string | null;
    bus: { registration_number: string; seat_capacity: number };
    route: { origin: string; destination: string };
  };
}

interface TripTicketTrackerProps {
  tripId: string;
  onClose?: () => void;
}

export function TripTicketTracker({ tripId }: TripTicketTrackerProps) {
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch trip and tickets
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch trip details
      const { data: tripData } = await supabase
        .from('trips')
        .select(`
          id, trip_date, status, available_seats,
          schedule:schedules(
            departure_time, arrival_time,
            bus:buses(registration_number, seat_capacity),
            route:routes(origin, destination)
          )
        `)
        .eq('id', tripId)
        .single();

      if (tripData) {
        setTrip(tripData as unknown as TripDetails);
      }

      // Fetch tickets for this trip
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('id, passenger_name, seat_number, status, scanned_at')
        .eq('trip_id', tripId)
        .order('seat_number', { ascending: true });

      if (ticketsData) {
        setTickets(ticketsData);
      }

      setLoading(false);
    };

    fetchData();
  }, [tripId]);

  // Real-time subscription for ticket updates
  useEffect(() => {
    const channel = supabase
      .channel(`trip-tickets-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const updated = payload.new as Ticket;
          setTickets(prev => 
            prev.map(t => t.id === updated.id ? updated : t)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trip) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Trip not found
        </CardContent>
      </Card>
    );
  }

  const scannedCount = tickets.filter(t => t.status === 'used').length;
  const totalTickets = tickets.length;
  const progress = totalTickets > 0 ? (scannedCount / totalTickets) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {trip.schedule.route.origin} → {trip.schedule.route.destination}
          </CardTitle>
          <Badge variant={trip.status === 'completed' ? 'secondary' : 'default'}>
            {trip.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {trip.schedule.departure_time}
          </span>
          <span className="flex items-center gap-1">
            <Bus className="h-4 w-4" />
            {trip.schedule.bus.registration_number}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {totalTickets} booked
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Boarding Progress</span>
            <span className="text-muted-foreground">
              {scannedCount} / {totalTickets} passengers
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Passenger list */}
        {totalTickets > 0 ? (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    ticket.status === 'used'
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      ticket.status === 'used'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {ticket.seat_number}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{ticket.passenger_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Seat {ticket.seat_number}
                      </p>
                    </div>
                  </div>
                  <div>
                    {ticket.status === 'used' ? (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs">Boarded</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Waiting
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No tickets sold for this trip yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}