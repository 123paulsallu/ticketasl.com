import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bus, 
  Star, 
  MapPin, 
  Phone, 
  Mail,
  Search,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import type { BusCompany } from '@/types/database';

export default function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<BusCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('bus_companies')
        .select('*')
        .eq('is_approved', true)
        .eq('is_active', true)
        .order('average_rating', { ascending: false });

      if (error) throw error;
      setCompanies(data as BusCompany[]);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.round(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <MainLayout>
      {/* Header */}
      <section className="bg-primary py-12">
        <div className="container">
          <h1 className="text-3xl font-bold text-primary-foreground mb-4">Bus Companies</h1>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl">
            Browse verified bus companies operating in Sierra Leone. 
            Check ratings, reviews, and available routes.
          </p>
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bus companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Companies Grid */}
      <section className="py-12">
        <div className="container">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <Card 
                  key={company.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/companies/${company.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        {company.logo_url ? (
                          <img 
                            src={company.logo_url} 
                            alt={company.name} 
                            className="h-14 w-14 object-contain"
                          />
                        ) : (
                          <Bus className="h-8 w-8 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{company.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">{renderStars(company.average_rating)}</div>
                          <span className="text-sm text-muted-foreground">
                            ({company.total_reviews} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    {company.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {company.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      {company.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{company.address}</span>
                        </div>
                      )}
                      {company.contact_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{company.contact_phone}</span>
                        </div>
                      )}
                    </div>

                    <Button variant="outline" className="w-full">
                      View Routes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Bus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No companies found</h2>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try adjusting your search terms.' 
                  : 'Bus companies will appear here once registered.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
