import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Route } from 'lucide-react';

export default function CompanyRoutes() {
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Routes & Schedules</h1>
        <Card><CardContent className="p-12 text-center"><Route className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Routes management coming soon.</p></CardContent></Card>
      </div>
    </MainLayout>
  );
}
