import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Bus } from 'lucide-react';

export default function CompanyFleet() {
  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Fleet Management</h1>
        <Card><CardContent className="p-12 text-center"><Bus className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Fleet management coming soon.</p></CardContent></Card>
      </div>
    </MainLayout>
  );
}
