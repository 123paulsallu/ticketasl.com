import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';
import { TodayTrips } from '@/components/driver/TodayTrips';

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
        <TodayTrips />
      </div>
    </MainLayout>
  );
}
