import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket, 
  Bus, 
  Calendar, 
  Clock, 
  MapPin,
  QrCode,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TicketWithDetails {
  id: string;
  ticket_code: string;
  seat_number: number;
  status: string;
  price_paid: number;
  purchased_at: string;
  trip: {
    trip_date: string;
    schedule: {
      departure_time: string;
      arrival_time: string | null;
      route: {
        origin: string;
        destination: string;
        company: {
          name: string;
          logo_url: string | null;
        };
      };
      bus: {
        registration_number: string;
      };
    };
  };
}

export default function MyTickets() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          ticket_code,
          seat_number,
          status,
          price_paid,
          purchased_at,
          trip:trips!inner (
            trip_date,
            schedule:schedules!inner (
              departure_time,
              arrival_time,
              route:routes!inner (
                origin,
                destination,
                company:bus_companies!inner (
                  name,
                  logo_url
                )
              ),
              bus:buses!inner (
                registration_number
              )
            )
          )
        `)
        .eq('passenger_id', user?.id)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      
      // Transform the nested data
      const transformedTickets = (data || []).map((ticket: any) => ({
        ...ticket,
        trip: {
          trip_date: ticket.trip.trip_date,
          schedule: {
            departure_time: ticket.trip.schedule.departure_time,
            arrival_time: ticket.trip.schedule.arrival_time,
            route: {
              origin: ticket.trip.schedule.route.origin,
              destination: ticket.trip.schedule.route.destination,
              company: ticket.trip.schedule.route.company,
            },
            bus: ticket.trip.schedule.bus,
          },
        },
      }));
      
      setTickets(transformedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success hover:bg-success/90"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'used':
        return <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Used</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-muted-foreground"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-SL').format(price) + ' Le';
  };

  const activeTickets = tickets.filter(t => t.status === 'active');
  const pastTickets = tickets.filter(t => t.status !== 'active');

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">My Tickets</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">
              Active Tickets ({activeTickets.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Tickets ({pastTickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeTickets.length > 0 ? (
              <div className="space-y-4">
                {activeTickets.map((ticket) => (
                  <Card key={ticket.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        {/* Left: Ticket Info */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                {ticket.trip.schedule.route.company.logo_url ? (
                                  <img 
                                    src={ticket.trip.schedule.route.company.logo_url} 
                                    alt="" 
                                    className="h-8 w-8 object-contain"
                                  />
                                ) : (
                                  <Bus className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold">
                                  {ticket.trip.schedule.route.company.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Bus: {ticket.trip.schedule.bus.registration_number}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(ticket.status)}
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Travel Date
                              </p>
                              <p className="font-medium">{formatDate(ticket.trip.trip_date)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Departure
                              </p>
                              <p className="font-medium">
                                {formatTime(ticket.trip.schedule.departure_time)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-4">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{ticket.trip.schedule.route.origin}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium">{ticket.trip.schedule.route.destination}</span>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">Seat: {ticket.seat_number}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="font-medium text-accent">{formatPrice(ticket.price_paid)}</span>
                          </div>
                        </div>

                        {/* Right: QR Code section */}
                        <div className="bg-muted p-6 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l">
                          <div className="bg-white p-4 rounded-lg mb-3">
                            <QrCode className="h-24 w-24 text-foreground" />
                          </div>
                          <p className="text-sm font-mono font-bold">{ticket.ticket_code}</p>
                          <p className="text-xs text-muted-foreground mt-1">Show to driver</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No active tickets</h2>
                <p className="text-muted-foreground mb-6">
                  You don't have any upcoming trips booked.
                </p>
                <Button onClick={() => navigate('/search')}>
                  Book a Trip
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastTickets.length > 0 ? (
              <div className="space-y-4">
                {pastTickets.map((ticket) => (
                  <Card key={ticket.id} className="opacity-75">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Bus className="h-5 w-5 text-primary" />
                          <div>
                            <h3 className="font-semibold">
                              {ticket.trip.schedule.route.company.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {ticket.trip.schedule.route.origin} → {ticket.trip.schedule.route.destination}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(ticket.status)}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDate(ticket.trip.trip_date)}</span>
                        <span>•</span>
                        <span>Seat {ticket.seat_number}</span>
                        <span>•</span>
                        <span>{formatPrice(ticket.price_paid)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No past tickets</h2>
                <p className="text-muted-foreground">
                  Your completed and cancelled trips will appear here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
