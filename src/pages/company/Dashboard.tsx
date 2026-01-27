import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function CompanyDashboard() {
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !hasRole('company_admin'))) {
      navigate('/auth');
    }
  }, [user, loading, hasRole, navigate]);

  if (loading) {
    return <MainLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Company Dashboard</h1>
        <Card><CardContent className="p-12 text-center"><Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Company management features coming soon.</p></CardContent></Card>
      </div>
    </MainLayout>
  );
}
