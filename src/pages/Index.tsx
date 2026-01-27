import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { 
  Bus, 
  MapPin, 
  Calendar, 
  Search, 
  Shield, 
  Smartphone, 
  Clock, 
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Index() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set('origin', origin);
    if (destination) params.set('destination', destination);
    if (date) params.set('date', date);
    navigate(`/search?${params.toString()}`);
  };

  const features = [
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Pay safely with Orange Money. Your transactions are protected.',
    },
    {
      icon: Smartphone,
      title: 'Mobile Tickets',
      description: 'Get your QR code ticket instantly on your phone. No printing needed.',
    },
    {
      icon: Clock,
      title: 'Real-time Updates',
      description: 'Receive SMS notifications about your booking and trip status.',
    },
    {
      icon: Star,
      title: 'Rated Companies',
      description: 'Choose from verified bus companies with genuine passenger reviews.',
    },
  ];

  const popularRoutes = [
    { origin: 'Freetown', destination: 'Bo', price: '150,000 Le' },
    { origin: 'Freetown', destination: 'Kenema', price: '180,000 Le' },
    { origin: 'Freetown', destination: 'Makeni', price: '120,000 Le' },
    { origin: 'Bo', destination: 'Kenema', price: '80,000 Le' },
  ];

  const steps = [
    { step: 1, title: 'Search', description: 'Find your route and choose a departure time' },
    { step: 2, title: 'Select Seat', description: 'Pick your preferred seat from available options' },
    { step: 3, title: 'Pay', description: 'Complete payment securely with Orange Money' },
    { step: 4, title: 'Travel', description: 'Show your QR ticket to the driver and enjoy your trip' },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative gradient-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
        <div className="container relative py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
              Book Your Bus Ticket <span className="text-accent">Instantly</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8">
              Sierra Leone's trusted platform for booking bus tickets. 
              Pay with Orange Money, get your ticket on your phone.
            </p>
          </div>

          {/* Search Form */}
          <Card className="max-w-4xl mx-auto shadow-soft">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">From</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Departure city"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">To</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Destination city"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Date</label>
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
                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 h-10">
                    <Search className="mr-2 h-4 w-4" />
                    Search Buses
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <div key={item.step} className="relative text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-7 -right-4 h-5 w-5 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4">Why Choose Ticketa</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            We make bus travel easy, safe, and convenient for everyone in Sierra Leone.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="shadow-soft hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent mx-auto mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16 bg-muted">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Popular Routes</h2>
            <Link to="/search">
              <Button variant="outline">
                View All Routes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularRoutes.map((route, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/search?origin=${route.origin}&destination=${route.destination}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bus className="h-5 w-5 text-primary" />
                    <span className="font-medium">{route.origin}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{route.destination}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Starting from</span>
                    <span className="font-bold text-accent">{route.price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 gradient-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Travel?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of Sierra Leoneans who book their bus tickets with Ticketa. 
            Fast, secure, and convenient.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90"
              onClick={() => navigate('/search')}
            >
              Book a Ticket Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/companies')}
            >
              Browse Bus Companies
            </Button>
          </div>
        </div>
      </section>

      {/* For Business CTA */}
      <section className="py-16">
        <div className="container">
          <Card className="shadow-soft overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12">
                <h2 className="text-2xl font-bold mb-4">Are You a Bus Company?</h2>
                <p className="text-muted-foreground mb-6">
                  Partner with Ticketa to reach more passengers, manage your fleet, 
                  and grow your business with our powerful platform.
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    'Manage routes, schedules, and pricing',
                    'Track bookings in real-time',
                    'Driver app for ticket scanning',
                    'Receive payments directly',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => navigate('/auth?mode=signup&role=company')}>
                  Register Your Company
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="hidden md:block bg-muted">
                <div className="h-full flex items-center justify-center p-8">
                  <Bus className="h-32 w-32 text-primary/20" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
