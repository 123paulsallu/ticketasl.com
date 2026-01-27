import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bus, 
  MapPin, 
  Calendar,
  Clock,
  User,
  Phone,
  CreditCard,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TripDetails {
  id: string;
  trip_date: string;
  available_seats: number;
  schedule: {
    departure_time: string;
    arrival_time: string | null;
    price_leones: number;
    bus: {
      seat_capacity: number;
      model: string | null;
      registration_number: string;
    };
    route: {
      origin: string;
      destination: string;
      estimated_duration_minutes: number | null;
      company: {
        id: string;
        name: string;
        logo_url: string | null;
      };
    };
  };
}

const bookingSchema = z.object({
  passengerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  passengerPhone: z.string().min(8, 'Please enter a valid phone number').max(20),
});

export default function Booking() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [step, setStep] = useState<'seat' | 'details' | 'payment' | 'confirmation'>('seat');
  
  const [formData, setFormData] = useState({
    passengerName: '',
    passengerPhone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/book/${tripId}`);
    }
  }, [user, authLoading, navigate, tripId]);

  useEffect(() => {
    if (profile) {
      setFormData({
        passengerName: profile.full_name || '',
        passengerPhone: profile.phone || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (tripId) {
      fetchTripDetails();
    }
  }, [tripId]);

  const fetchTripDetails = async () => {
    try {
      // Fetch trip details
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select(`
          id,
          trip_date,
          available_seats,
          schedule:schedules!inner (
            departure_time,
            arrival_time,
            price_leones,
            bus:buses!inner (
              seat_capacity,
              model,
              registration_number
            ),
            route:routes!inner (
              origin,
              destination,
              estimated_duration_minutes,
              company:bus_companies!inner (
                id,
                name,
                logo_url
              )
            )
          )
        `)
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;
      
      // Transform the data
      const transformedTrip: TripDetails = {
        id: tripData.id,
        trip_date: tripData.trip_date,
        available_seats: tripData.available_seats,
        schedule: {
          departure_time: tripData.schedule.departure_time,
          arrival_time: tripData.schedule.arrival_time,
          price_leones: tripData.schedule.price_leones,
          bus: tripData.schedule.bus,
          route: {
            origin: tripData.schedule.route.origin,
            destination: tripData.schedule.route.destination,
            estimated_duration_minutes: tripData.schedule.route.estimated_duration_minutes,
            company: tripData.schedule.route.company,
          },
        },
      };
      
      setTrip(transformedTrip);

      // Fetch booked seats
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('seat_number')
        .eq('trip_id', tripId)
        .neq('status', 'cancelled');

      if (ticketsData) {
        setBookedSeats(ticketsData.map(t => t.seat_number));
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trip details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSeatSelect = (seatNumber: number) => {
    if (!bookedSeats.includes(seatNumber)) {
      setSelectedSeat(seatNumber);
    }
  };

  const handleContinue = () => {
    if (step === 'seat' && selectedSeat) {
      setStep('details');
    } else if (step === 'details') {
      const result = bookingSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
      setStep('payment');
    }
  };

  const handlePayment = async () => {
    if (!trip || !selectedSeat || !user) return;

    setBooking(true);
    
    try {
      // Generate ticket code
      const ticketCode = `TKT${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          trip_id: trip.id,
          passenger_id: user.id,
          passenger_name: formData.passengerName,
          passenger_phone: formData.passengerPhone,
          seat_number: selectedSeat,
          ticket_code: ticketCode,
          price_paid: trip.schedule.price_leones,
          payment_status: 'completed', // Simulated payment
          payment_reference: `OM${Date.now()}`,
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Update available seats
      await supabase
        .from('trips')
        .update({ available_seats: trip.available_seats - 1 })
        .eq('id', trip.id);

      setStep('confirmation');
      toast({
        title: 'Booking Successful!',
        description: 'Your ticket has been booked. Check your tickets page.',
      });
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: 'Booking Failed',
        description: 'An error occurred while booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBooking(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (authLoading || loading) {
    return (
      <MainLayout showFooter={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!trip) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Trip Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The trip you're looking for doesn't exist or is no longer available.
          </p>
          <Button onClick={() => navigate('/search')}>Search Buses</Button>
        </div>
      </MainLayout>
    );
  }

  // Generate seat layout
  const seatCapacity = trip.schedule.bus.seat_capacity;
  const seatsPerRow = 4;
  const rows = Math.ceil(seatCapacity / seatsPerRow);

  return (
    <MainLayout showFooter={false}>
      <div className="bg-muted min-h-screen py-8">
        <div className="container max-w-4xl">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {['seat', 'details', 'payment', 'confirmation'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step === s ? 'bg-accent text-accent-foreground' :
                  ['seat', 'details', 'payment', 'confirmation'].indexOf(step) > i 
                    ? 'bg-success text-success-foreground' 
                    : 'bg-muted-foreground/20 text-muted-foreground'
                }`}>
                  {['seat', 'details', 'payment', 'confirmation'].indexOf(step) > i ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 3 && (
                  <div className={`h-1 w-12 mx-2 ${
                    ['seat', 'details', 'payment', 'confirmation'].indexOf(step) > i 
                      ? 'bg-success' 
                      : 'bg-muted-foreground/20'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {step === 'seat' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Your Seat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center mb-6">
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-muted border" />
                          <span>Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-accent" />
                          <span>Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-muted-foreground/30" />
                          <span>Booked</span>
                        </div>
                      </div>
                    </div>

                    {/* Bus front indicator */}
                    <div className="text-center mb-4">
                      <div className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-t-lg text-sm">
                        Front
                      </div>
                    </div>

                    {/* Seat grid */}
                    <div className="max-w-xs mx-auto border rounded-lg p-4 bg-background">
                      {Array.from({ length: rows }, (_, rowIndex) => (
                        <div key={rowIndex} className="flex justify-center gap-2 mb-2">
                          {Array.from({ length: seatsPerRow }, (_, colIndex) => {
                            const seatNumber = rowIndex * seatsPerRow + colIndex + 1;
                            if (seatNumber > seatCapacity) return null;
                            
                            const isBooked = bookedSeats.includes(seatNumber);
                            const isSelected = selectedSeat === seatNumber;
                            
                            // Add aisle gap
                            if (colIndex === 2) {
                              return (
                                <div key={colIndex} className="flex gap-2">
                                  <div className="w-4" />
                                  <button
                                    type="button"
                                    disabled={isBooked}
                                    onClick={() => handleSeatSelect(seatNumber)}
                                    className={`h-10 w-10 rounded flex items-center justify-center text-sm font-medium transition-colors ${
                                      isBooked 
                                        ? 'bg-muted-foreground/30 text-muted-foreground cursor-not-allowed' 
                                        : isSelected 
                                          ? 'bg-accent text-accent-foreground' 
                                          : 'bg-muted border hover:border-accent'
                                    }`}
                                  >
                                    {seatNumber}
                                  </button>
                                </div>
                              );
                            }
                            
                            return (
                              <button
                                key={colIndex}
                                type="button"
                                disabled={isBooked}
                                onClick={() => handleSeatSelect(seatNumber)}
                                className={`h-10 w-10 rounded flex items-center justify-center text-sm font-medium transition-colors ${
                                  isBooked 
                                    ? 'bg-muted-foreground/30 text-muted-foreground cursor-not-allowed' 
                                    : isSelected 
                                      ? 'bg-accent text-accent-foreground' 
                                      : 'bg-muted border hover:border-accent'
                                }`}
                              >
                                {seatNumber}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 text-center">
                      <Button 
                        onClick={handleContinue}
                        disabled={!selectedSeat}
                        className="bg-accent hover:bg-accent/90"
                      >
                        Continue with Seat {selectedSeat}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 'details' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Passenger Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="passengerName">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="passengerName"
                            name="passengerName"
                            placeholder="Enter passenger name"
                            value={formData.passengerName}
                            onChange={handleChange}
                            className={`pl-10 ${errors.passengerName ? 'border-destructive' : ''}`}
                          />
                        </div>
                        {errors.passengerName && (
                          <p className="text-sm text-destructive">{errors.passengerName}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="passengerPhone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="passengerPhone"
                            name="passengerPhone"
                            placeholder="Enter phone number"
                            value={formData.passengerPhone}
                            onChange={handleChange}
                            className={`pl-10 ${errors.passengerPhone ? 'border-destructive' : ''}`}
                          />
                        </div>
                        {errors.passengerPhone && (
                          <p className="text-sm text-destructive">{errors.passengerPhone}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          You'll receive your ticket via SMS
                        </p>
                      </div>

                      <div className="flex gap-4 mt-6">
                        <Button variant="outline" onClick={() => setStep('seat')}>
                          Back
                        </Button>
                        <Button 
                          onClick={handleContinue}
                          className="flex-1 bg-accent hover:bg-accent/90"
                        >
                          Continue to Payment
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 'payment' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-orange-500 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Orange Money</h3>
                          <p className="text-sm text-muted-foreground">
                            Pay securely with your Orange Money account
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-2">Amount to pay</p>
                      <p className="text-4xl font-bold text-accent">
                        {formatPrice(trip.schedule.price_leones)}
                      </p>
                    </div>

                    <Separator className="my-6" />

                    <p className="text-sm text-muted-foreground text-center mb-6">
                      By clicking "Pay Now", you agree to our terms and conditions.
                      This is a simulated payment for demonstration purposes.
                    </p>

                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setStep('details')}>
                        Back
                      </Button>
                      <Button 
                        onClick={handlePayment}
                        disabled={booking}
                        className="flex-1 bg-accent hover:bg-accent/90"
                      >
                        {booking ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay Now
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 'confirmation' && (
                <Card>
                  <CardContent className="pt-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                    <p className="text-muted-foreground mb-6">
                      Your ticket has been booked successfully. You'll receive a confirmation SMS shortly.
                    </p>
                    
                    <div className="bg-muted rounded-lg p-4 mb-6 text-left">
                      <h3 className="font-semibold mb-3">Trip Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Route</span>
                          <span>{trip.schedule.route.origin} → {trip.schedule.route.destination}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date</span>
                          <span>{formatDate(trip.trip_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time</span>
                          <span>{formatTime(trip.schedule.departure_time)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Seat</span>
                          <span>{selectedSeat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bus</span>
                          <span>{trip.schedule.bus.registration_number}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => navigate('/search')}
                      >
                        Book Another
                      </Button>
                      <Button 
                        className="flex-1 bg-accent hover:bg-accent/90"
                        onClick={() => navigate('/my-tickets')}
                      >
                        View My Tickets
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Trip Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Trip Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      {trip.schedule.route.company.logo_url ? (
                        <img 
                          src={trip.schedule.route.company.logo_url} 
                          alt="" 
                          className="h-8 w-8 object-contain"
                        />
                      ) : (
                        <Bus className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{trip.schedule.route.company.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {trip.schedule.bus.model || trip.schedule.bus.registration_number}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{trip.schedule.route.origin}</p>
                        <p className="text-muted-foreground">→ {trip.schedule.route.destination}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(trip.trip_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatTime(trip.schedule.departure_time)}
                        {trip.schedule.route.estimated_duration_minutes && (
                          <span className="text-muted-foreground">
                            {' '}({formatDuration(trip.schedule.route.estimated_duration_minutes)})
                          </span>
                        )}
                      </span>
                    </div>
                    {selectedSeat && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>Seat {selectedSeat}</span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-xl font-bold text-accent">
                      {formatPrice(trip.schedule.price_leones)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
