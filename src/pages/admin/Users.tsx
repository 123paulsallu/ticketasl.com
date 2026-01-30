import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Loader2,
  Search,
  MoreHorizontal,
  Shield,
  Building2,
  Truck,
  User as UserIcon,
  Link as LinkIcon,
  Unlink
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserWithRoles {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  roles: string[];
  company_id?: string | null;
  company_name?: string | null;
}

export default function AdminUsers() {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [assignType, setAssignType] = useState<'company_admin' | 'driver'>('company_admin');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!hasRole('admin')) {
        navigate('/');
      }
    }
  }, [user, authLoading, hasRole, navigate]);

  // Fetch users with their roles and company assignments
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch company admin assignments
      const { data: companyAdminsData } = await supabase
        .from('company_admins')
        .select('user_id, company_id, bus_companies(name)');

      // Fetch driver assignments
      const { data: driversData } = await supabase
        .from('drivers')
        .select('user_id, company_id, bus_companies(name)');

      // Combine profiles with roles and company assignments
      return (profilesData || []).map(profile => {
        const userRoles = (rolesData || [])
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role);
        
        // Check company admin assignment
        const companyAdmin = companyAdminsData?.find(ca => ca.user_id === profile.user_id);
        // Check driver assignment
        const driver = driversData?.find(d => d.user_id === profile.user_id);
        
        const companyAssignment = companyAdmin || driver;
        
        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          phone: profile.phone,
          created_at: profile.created_at,
          roles: userRoles,
          company_id: companyAssignment?.company_id || null,
          company_name: (companyAssignment?.bus_companies as any)?.name || null,
        };
      });
    },
    enabled: !!user && hasRole('admin'),
  });

  // Fetch companies for assignment
  const { data: companies = [] } = useQuery({
    queryKey: ['all-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bus_companies')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && hasRole('admin'),
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'company_admin' | 'driver' | 'passenger' }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Role Added', description: 'User role has been updated.' });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({ title: 'Role Exists', description: 'User already has this role.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to add role.', variant: 'destructive' });
      }
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'company_admin' | 'driver' | 'passenger' }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Role Removed', description: 'User role has been removed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to remove role.', variant: 'destructive' });
    },
  });

  const assignToCompanyMutation = useMutation({
    mutationFn: async ({ userId, companyId, type }: { userId: string; companyId: string; type: 'company_admin' | 'driver' }) => {
      if (type === 'company_admin') {
        // First add the role if they don't have it
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'company_admin' }, { onConflict: 'user_id,role' });
        
        if (roleError && roleError.code !== '23505') throw roleError;

        // Then assign to company (update existing assignment or insert new)
        {
          const { data: existing, error: existingError } = await supabase
            .from('company_admins')
            .select('id')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();

          if (existingError) throw existingError;

          if (existing) {
            const { error } = await supabase
              .from('company_admins')
              .update({ company_id: companyId })
              .eq('user_id', userId);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('company_admins')
              .insert({ user_id: userId, company_id: companyId });
            if (error) throw error;
          }
        }
      } else {
        // First add the driver role
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'driver' }, { onConflict: 'user_id,role' });
        
        if (roleError && roleError.code !== '23505') throw roleError;

        // Then add driver record (update existing or insert new)
        {
          const { data: existingDriver, error: existingDriverErr } = await supabase
            .from('drivers')
            .select('id')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();

          if (existingDriverErr) throw existingDriverErr;

          if (existingDriver) {
            const { error } = await supabase
              .from('drivers')
              .update({ company_id: companyId })
              .eq('user_id', userId);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('drivers')
              .insert({ user_id: userId, company_id: companyId });
            if (error) throw error;
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ 
        title: 'Assigned to Company', 
        description: `User has been assigned as ${assignType === 'company_admin' ? 'company admin' : 'driver'}.` 
      });
      setAssignDialogOpen(false);
      setSelectedUser(null);
      setSelectedCompanyId('');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to assign user.', variant: 'destructive' });
    },
  });

  const unlinkFromCompanyMutation = useMutation({
    mutationFn: async ({ userId, type }: { userId: string; type: 'company_admin' | 'driver' }) => {
      if (type === 'company_admin') {
        const { error } = await supabase
          .from('company_admins')
          .delete()
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('drivers')
          .delete()
          .eq('user_id', userId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Unlinked', description: 'User has been unlinked from the company.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to unlink user.', variant: 'destructive' });
    },
  });

  const openAssignDialog = (userItem: UserWithRoles, type: 'company_admin' | 'driver') => {
    setSelectedUser(userItem);
    setAssignType(type);
    setSelectedCompanyId(userItem.company_id || '');
    setAssignDialogOpen(true);
  };

  const handleAssign = () => {
    if (!selectedUser || !selectedCompanyId) return;
    assignToCompanyMutation.mutate({
      userId: selectedUser.user_id,
      companyId: selectedCompanyId,
      type: assignType,
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'company_admin':
        return <Building2 className="h-3 w-3" />;
      case 'driver':
        return <Truck className="h-3 w-3" />;
      default:
        return <UserIcon className="h-3 w-3" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'company_admin':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'driver':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery)
  );

  if (authLoading || isLoading) {
    return (
      <AdminLayout title="Manage Users">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manage Users">
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.full_name || 'Unnamed User'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">{u.phone || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((role) => (
                        <Badge 
                          key={role} 
                          variant="outline"
                          className={`text-xs ${getRoleBadgeColor(role)}`}
                        >
                          {getRoleIcon(role)}
                          <span className="ml-1">{role}</span>
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.company_name ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        <Building2 className="h-3 w-3 mr-1" />
                        {u.company_name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {/* Role Management */}
                        {!u.roles.includes('admin') && (
                          <DropdownMenuItem onClick={() => addRoleMutation.mutate({ userId: u.user_id, role: 'admin' })}>
                            <Shield className="mr-2 h-4 w-4" />
                            Make Super Admin
                          </DropdownMenuItem>
                        )}
                        
                        {/* Company Admin Assignment */}
                        {!u.roles.includes('company_admin') ? (
                          <DropdownMenuItem onClick={() => openAssignDialog(u, 'company_admin')}>
                            <Building2 className="mr-2 h-4 w-4" />
                            Assign as Company Admin
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => openAssignDialog(u, 'company_admin')}>
                              <LinkIcon className="mr-2 h-4 w-4" />
                              {u.company_id ? 'Change Company' : 'Assign to Company'}
                            </DropdownMenuItem>
                            {u.company_id && (
                              <DropdownMenuItem 
                                onClick={() => unlinkFromCompanyMutation.mutate({ userId: u.user_id, type: 'company_admin' })}
                                className="text-destructive"
                              >
                                <Unlink className="mr-2 h-4 w-4" />
                                Unlink from Company
                              </DropdownMenuItem>
                            )}
                          </>
                        )}

                        {/* Driver Assignment */}
                        {!u.roles.includes('driver') ? (
                          <DropdownMenuItem onClick={() => openAssignDialog(u, 'driver')}>
                            <Truck className="mr-2 h-4 w-4" />
                            Assign as Driver
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => openAssignDialog(u, 'driver')}>
                              <LinkIcon className="mr-2 h-4 w-4" />
                              {u.company_id ? 'Change Driver Company' : 'Assign Driver to Company'}
                            </DropdownMenuItem>
                            {u.company_id && (
                              <DropdownMenuItem 
                                onClick={() => unlinkFromCompanyMutation.mutate({ userId: u.user_id, type: 'driver' })}
                                className="text-destructive"
                              >
                                <Unlink className="mr-2 h-4 w-4" />
                                Remove Driver Assignment
                              </DropdownMenuItem>
                            )}
                          </>
                        )}

                        <DropdownMenuSeparator />

                        {/* Remove Roles */}
                        {u.roles.includes('admin') && u.user_id !== user?.id && (
                          <DropdownMenuItem 
                            onClick={() => removeRoleMutation.mutate({ userId: u.user_id, role: 'admin' })}
                            className="text-destructive"
                          >
                            Remove Super Admin
                          </DropdownMenuItem>
                        )}
                        {u.roles.includes('company_admin') && (
                          <DropdownMenuItem 
                            onClick={() => removeRoleMutation.mutate({ userId: u.user_id, role: 'company_admin' })}
                            className="text-destructive"
                          >
                            Remove Company Admin Role
                          </DropdownMenuItem>
                        )}
                        {u.roles.includes('driver') && (
                          <DropdownMenuItem 
                            onClick={() => removeRoleMutation.mutate({ userId: u.user_id, role: 'driver' })}
                            className="text-destructive"
                          >
                            Remove Driver Role
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign to Company Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assign {assignType === 'company_admin' ? 'Company Admin' : 'Driver'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name ? (
                <>Assign <strong>{selectedUser.full_name}</strong> to a company</>
              ) : (
                'Select a company to assign this user to'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Company</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {companies.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No companies available. Create a company first.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedCompanyId || assignToCompanyMutation.isPending}
            >
              {assignToCompanyMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
