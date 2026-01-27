import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Bus, 
  MapPin, 
  Calendar, 
  Search as SearchIcon, 
  Clock, 
  Star, 
  Filter,
  ArrowRight,
  Users,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  trip_id: string;
  company_name: string;
  company_logo: string | null;
  company_rating: number;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string | null;
  duration_minutes: number | null;
  price: number;
  available_seats: number;
  bus_model: string | null;
  amenities: string[];
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [date, setDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0]);
  const [sortBy, setSortBy] = useState('departure');
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Popular cities in Sierra Leone
  const popularCities = ['Freetown', 'Bo', 'Kenema', 'Makeni', 'Koidu', 'Lunsar', 'Port Loko'];

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setSearched(true);
    
    // Update URL params
    const params = new URLSearchParams();
    if (origin) params.set('origin', origin);
    if (destination) params.set('destination', destination);
    if (date) params.set('date', date);
    setSearchParams(params);

    try {
      // Query trips with related data
      let query = supabase
        .from('trips')
        .select(`
          id,
          trip_date,
          available_seats,
          status,
          schedule:schedules!inner (
            id,
            departure_time,
            arrival_time,
            price_leones,
            bus:buses!inner (
              model,
              amenities
            ),
            route:routes!inner (
              origin,
              destination,
              estimated_duration_minutes,
              company:bus_companies!inner (
                id,
                name,
                logo_url,
                average_rating,
                is_approved
              )
            )
          )
        `)
        .eq('trip_date', date)
        .eq('status', 'scheduled')
        .gt('available_seats', 0);

      const { data, error } = await query;

      if (error) throw error;

      // Filter and transform results
      const transformedResults: SearchResult[] = (data || [])
        .filter((trip: any) => {
          const route = trip.schedule?.route;
          if (!route?.company?.is_approved) return false;
          
          if (origin && !route.origin.toLowerCase().includes(origin.toLowerCase())) {
            return false;
          }
          if (destination && !route.destination.toLowerCase().includes(destination.toLowerCase())) {
            return false;
          }
          return true;
        })
        .map((trip: any) => ({
          id: trip.schedule.id,
          trip_id: trip.id,
          company_name: trip.schedule.route.company.name,
          company_logo: trip.schedule.route.company.logo_url,
          company_rating: trip.schedule.route.company.average_rating || 0,
          origin: trip.schedule.route.origin,
          destination: trip.schedule.route.destination,
          departure_time: trip.schedule.departure_time,
          arrival_time: trip.schedule.arrival_time,
          duration_minutes: trip.schedule.route.estimated_duration_minutes,
          price: trip.schedule.price_leones,
          available_seats: trip.available_seats,
          bus_model: trip.schedule.bus?.model,
          amenities: trip.schedule.bus?.amenities || [],
        }));

      // Sort results
      transformedResults.sort((a, b) => {
        if (sortBy === 'departure') {
          return a.departure_time.localeCompare(b.departure_time);
        } else if (sortBy === 'price') {
          return a.price - b.price;
        } else if (sortBy === 'rating') {
          return b.company_rating - a.company_rating;
        }
        return 0;
      });

      setResults(transformedResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('origin') || searchParams.get('destination')) {
      handleSearch();
    }
  }, []);

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-SL').format(price) + ' Le';
  };

  return (
    <MainLayout>
      {/* Search Header */}
      <section className="bg-primary py-8">
        <div className="container">
          <h1 className="text-2xl font-bold text-primary-foreground mb-6">Find Your Bus</h1>
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Departure city"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="pl-10"
                      list="cities-from"
                    />
                    <datalist id="cities-from">
                      {popularCities.map(city => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Destination city"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="pl-10"
                      list="cities-to"
                    />
                    <datalist id="cities-to">
                      {popularCities.map(city => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="pl-10"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="departure">Departure Time</SelectItem>
                      <SelectItem value="price">Lowest Price</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <SearchIcon className="mr-2 h-4 w-4" />
                    )}
                    Search
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Results */}
      <section className="py-8">
        <div className="container">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : searched ? (
            results.length > 0 ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Found {results.length} bus{results.length !== 1 ? 'es' : ''} for your search
                </p>
                {results.map((result) => (
                  <Card key={result.trip_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Company Info */}
                        <div className="flex items-center gap-4 min-w-[200px]">
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                            {result.company_logo ? (
                              <img src={result.company_logo} alt={result.company_name} className="h-10 w-10 object-contain" />
                            ) : (
                              <Bus className="h-6 w-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{result.company_name}</h3>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{result.company_rating.toFixed(1)}</span>
                              {result.bus_model && (
                                <span className="ml-2">• {result.bus_model}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Route & Time */}
                        <div className="flex-1 flex items-center gap-4 justify-center">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{formatTime(result.departure_time)}</p>
                            <p className="text-sm text-muted-foreground">{result.origin}</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <div className="h-px w-8 bg-border" />
                              {result.duration_minutes && (
                                <span className="text-xs whitespace-nowrap">
                                  {formatDuration(result.duration_minutes)}
                                </span>
                              )}
                              <div className="h-px w-8 bg-border" />
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">
                              {result.arrival_time ? formatTime(result.arrival_time) : '--:--'}
                            </p>
                            <p className="text-sm text-muted-foreground">{result.destination}</p>
                          </div>
                        </div>

                        {/* Seats & Amenities */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {result.available_seats} seats left
                            </span>
                          </div>
                          {result.amenities.length > 0 && (
                            <div className="hidden md:flex gap-1">
                              {result.amenities.slice(0, 2).map((amenity, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Price & Book */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-accent">
                              {formatPrice(result.price)}
                            </p>
                            <p className="text-xs text-muted-foreground">per person</p>
                          </div>
                          <Button 
                            className="bg-accent hover:bg-accent/90"
                            onClick={() => navigate(`/book/${result.trip_id}`)}
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Bus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No buses found</h2>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search criteria or selecting a different date.
                </p>
                <Button variant="outline" onClick={() => {
                  setOrigin('');
                  setDestination('');
                  setSearched(false);
                }}>
                  Clear Search
                </Button>
              </div>
            )
          ) : (
            <div className="text-center py-20">
              <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Search for buses</h2>
              <p className="text-muted-foreground">
                Enter your departure city, destination, and travel date to find available buses.
              </p>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
