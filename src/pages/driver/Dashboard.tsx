import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, QrCode } from 'lucide-react';

export default function DriverDashboard() {
  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Driver Dashboard</h1>
          <Button asChild size="lg">
            <Link to="/driver/scanner">
              <QrCode className="h-5 w-5 mr-2" />
              Scan Tickets
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Today's trips will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
