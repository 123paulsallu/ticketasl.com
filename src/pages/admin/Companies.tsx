import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Check, 
  X, 
  Loader2,
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { BusCompany } from '@/types/database';

export default function AdminCompanies() {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<BusCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!hasRole('admin')) {
        navigate('/');
      }
    }
  }, [user, authLoading, hasRole, navigate]);

  useEffect(() => {
    if (user && hasRole('admin')) {
      fetchCompanies();
    }
  }, [user]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('bus_companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data as BusCompany[]);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('bus_companies')
        .update({ is_approved: true })
        .eq('id', companyId);

      if (error) throw error;

      setCompanies(prev => 
        prev.map(c => c.id === companyId ? { ...c, is_approved: true } : c)
      );

      toast({
        title: 'Company Approved',
        description: 'The company has been approved and is now visible to users.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve company.',
        variant: 'destructive',
      });
    }
  };

  const handleSuspend = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('bus_companies')
        .update({ is_active: false })
        .eq('id', companyId);

      if (error) throw error;

      setCompanies(prev => 
        prev.map(c => c.id === companyId ? { ...c, is_active: false } : c)
      );

      toast({
        title: 'Company Suspended',
        description: 'The company has been suspended.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to suspend company.',
        variant: 'destructive',
      });
    }
  };

  const handleActivate = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('bus_companies')
        .update({ is_active: true })
        .eq('id', companyId);

      if (error) throw error;

      setCompanies(prev => 
        prev.map(c => c.id === companyId ? { ...c, is_active: true } : c)
      );

      toast({
        title: 'Company Activated',
        description: 'The company has been reactivated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to activate company.',
        variant: 'destructive',
      });
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCompanies = filteredCompanies.filter(c => !c.is_approved);
  const activeCompanies = filteredCompanies.filter(c => c.is_approved && c.is_active);
  const suspendedCompanies = filteredCompanies.filter(c => c.is_approved && !c.is_active);

  if (authLoading || loading) {
    return (
      <AdminLayout title="Manage Companies">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manage Companies">
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Pending Approval */}
      {pendingCompanies.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-600" />
              Pending Approval ({pendingCompanies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="font-medium">{company.name}</div>
                      {company.address && (
                        <div className="text-sm text-muted-foreground">{company.address}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{company.contact_email}</div>
                      <div className="text-sm text-muted-foreground">{company.contact_phone}</div>
                    </TableCell>
                    <TableCell>
                      {new Date(company.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprove(company.id)}
                          className="bg-success hover:bg-success/90"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Companies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Companies ({filteredCompanies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="font-medium">{company.name}</div>
                    {company.address && (
                      <div className="text-sm text-muted-foreground">{company.address}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {!company.is_approved ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Pending
                      </Badge>
                    ) : company.is_active ? (
                      <Badge className="bg-success hover:bg-success/90">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Suspended</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span>{company.average_rating.toFixed(1)}</span>
                      <span className="text-muted-foreground text-sm">
                        ({company.total_reviews})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{company.contact_email}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/companies/${company.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {!company.is_approved && (
                          <DropdownMenuItem onClick={() => handleApprove(company.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                        )}
                        {company.is_active ? (
                          <DropdownMenuItem 
                            onClick={() => handleSuspend(company.id)}
                            className="text-destructive"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleActivate(company.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No companies found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
