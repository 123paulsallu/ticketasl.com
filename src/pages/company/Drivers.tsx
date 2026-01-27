import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function CompanyDrivers() {
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Driver Management</h1>
        <Card><CardContent className="p-12 text-center"><Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Driver management coming soon.</p></CardContent></Card>
      </div>
    </MainLayout>
  );
}
