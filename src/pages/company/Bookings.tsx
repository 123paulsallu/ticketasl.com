import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket } from 'lucide-react';

export default function CompanyBookings() {
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Bookings & Tickets</h1>
        <Card><CardContent className="p-12 text-center"><Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Bookings management coming soon.</p></CardContent></Card>
      </div>
    </MainLayout>
  );
}
