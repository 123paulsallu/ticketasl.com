import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Loader2,
  Search,
  MoreHorizontal,
  Shield,
  Building2,
  Truck,
  User as UserIcon
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

interface UserWithRoles {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  roles: string[];
}

export default function AdminUsers() {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
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
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
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

      // Combine profiles with roles
      const usersWithRoles = (profilesData || []).map(profile => {
        const userRoles = (rolesData || [])
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role);
        
        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          phone: profile.phone,
          created_at: profile.created_at,
          roles: userRoles,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async (userId: string, role: 'admin' | 'company_admin' | 'driver' | 'passenger') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;

      setUsers(prev => 
        prev.map(u => 
          u.user_id === userId 
            ? { ...u, roles: [...u.roles, role] }
            : u
        )
      );

      toast({
        title: 'Role Added',
        description: `User has been granted ${role} access.`,
      });
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: 'Role Exists',
          description: 'User already has this role.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add role.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleRemoveRole = async (userId: string, role: 'admin' | 'company_admin' | 'driver' | 'passenger') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      setUsers(prev => 
        prev.map(u => 
          u.user_id === userId 
            ? { ...u, roles: u.roles.filter(r => r !== role) }
            : u
        )
      );

      toast({
        title: 'Role Removed',
        description: `User no longer has ${role} access.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove role.',
        variant: 'destructive',
      });
    }
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

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery)
  );

  if (authLoading || loading) {
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
            placeholder="Search users..."
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
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!u.roles.includes('admin') && (
                          <DropdownMenuItem onClick={() => handleAddRole(u.user_id, 'admin')}>
                            <Shield className="mr-2 h-4 w-4" />
                            Make Admin
                          </DropdownMenuItem>
                        )}
                        {!u.roles.includes('company_admin') && (
                          <DropdownMenuItem onClick={() => handleAddRole(u.user_id, 'company_admin')}>
                            <Building2 className="mr-2 h-4 w-4" />
                            Make Company Admin
                          </DropdownMenuItem>
                        )}
                        {!u.roles.includes('driver') && (
                          <DropdownMenuItem onClick={() => handleAddRole(u.user_id, 'driver')}>
                            <Truck className="mr-2 h-4 w-4" />
                            Make Driver
                          </DropdownMenuItem>
                        )}
                        {u.roles.includes('admin') && u.user_id !== user?.id && (
                          <DropdownMenuItem 
                            onClick={() => handleRemoveRole(u.user_id, 'admin')}
                            className="text-destructive"
                          >
                            Remove Admin
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
    </AdminLayout>
  );
}
