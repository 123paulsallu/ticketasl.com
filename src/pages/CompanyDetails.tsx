import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bus, 
  Star, 
  MapPin, 
  Phone, 
  Mail,
  Clock,
  ArrowRight,
  Loader2,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import type { BusCompany, Route, Review } from '@/types/database';

export default function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<BusCompany | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCompanyDetails();
    }
  }, [id]);

  const fetchCompanyDetails = async () => {
    try {
      // Fetch company
      const { data: companyData, error: companyError } = await supabase
        .from('bus_companies')
        .select('*')
        .eq('id', id)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData as BusCompany);

      // Fetch routes
      const { data: routesData } = await supabase
        .from('routes')
        .select('*')
        .eq('company_id', id)
        .eq('is_active', true);
      
      setRoutes((routesData || []) as Route[]);

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('company_id', id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setReviews((reviewsData || []) as Review[]);
    } catch (error) {
      console.error('Error fetching company details:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < Math.round(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!company) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <Bus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Company Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The bus company you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/companies')}>
            Browse Companies
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <section className="bg-primary py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="h-24 w-24 rounded-xl bg-white flex items-center justify-center">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-20 w-20 object-contain" />
              ) : (
                <Bus className="h-12 w-12 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-primary-foreground mb-2">{company.name}</h1>
              <div className="flex items-center gap-4 text-primary-foreground/80">
                <div className="flex items-center gap-1">
                  {renderStars(company.average_rating)}
                  <span className="ml-2">{company.average_rating.toFixed(1)}</span>
                </div>
                <span>•</span>
                <span>{company.total_reviews} reviews</span>
              </div>
            </div>
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90"
              onClick={() => navigate(`/search?company=${company.id}`)}
            >
              Book a Trip
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {company.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{company.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Routes */}
            <Card>
              <CardHeader>
                <CardTitle>Available Routes</CardTitle>
              </CardHeader>
              <CardContent>
                {routes.length > 0 ? (
                  <div className="space-y-4">
                    {routes.map((route) => (
                      <div 
                        key={route.id} 
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/search?origin=${route.origin}&destination=${route.destination}`)}
                      >
                        <div className="flex items-center gap-4">
                          <MapPin className="h-5 w-5 text-primary" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{route.origin}</span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{route.destination}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              {route.distance_km && (
                                <span>{route.distance_km} km</span>
                              )}
                              {route.estimated_duration_minutes && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(route.estimated_duration_minutes)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          View Schedule
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No routes available at the moment.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="pb-4 border-b last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No reviews yet. Be the first to review!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{company.address}</span>
                  </div>
                )}
                {company.contact_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <a href={`tel:${company.contact_phone}`} className="text-sm hover:underline">
                      {company.contact_phone}
                    </a>
                  </div>
                )}
                {company.contact_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <a href={`mailto:${company.contact_email}`} className="text-sm hover:underline">
                      {company.contact_email}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Book */}
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Ready to travel?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Search for available trips and book your ticket now.
                </p>
                <Button 
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={() => navigate(`/search?company=${company.id}`)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Search Trips
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
