import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function DriverDashboard() {
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Driver Dashboard</h1>
        <Card><CardContent className="p-12 text-center"><Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Today's trips will appear here.</p></CardContent></Card>
      </div>
    </MainLayout>
  );
}
