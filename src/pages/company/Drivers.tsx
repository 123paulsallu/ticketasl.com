import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Users, Phone } from 'lucide-react';
import { CompanyLayout } from '@/components/layout/CompanyLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface DriverForm {
  email: string;
  full_name: string;
  phone: string;
  license_number: string;
  assigned_bus_id: string | null;
  is_active: boolean;
}

const defaultForm: DriverForm = {
  email: '',
  full_name: '',
  phone: '',
  license_number: '',
  assigned_bus_id: null,
  is_active: true,
};

export default function CompanyDrivers() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [form, setForm] = useState<DriverForm>(defaultForm);

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['company-drivers', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      // First get drivers
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select(`*, bus:buses(*)`)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (driversError) throw driversError;
      if (!driversData) return [];

      // Then fetch profiles for each driver
      const userIds = driversData.map(d => d.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      // Merge profiles with drivers
      return driversData.map(driver => ({
        ...driver,
        profile: profilesData?.find(p => p.user_id === driver.user_id) || null,
      }));
    },
    enabled: !!companyId,
  });

  const { data: buses } = useQuery({
    queryKey: ['company-buses', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_available', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const updateDriverMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<DriverForm> }) => {
      const { error } = await supabase
        .from('drivers')
        .update({
          license_number: data.updates.license_number,
          assigned_bus_id: data.updates.assigned_bus_id || null,
          is_active: data.updates.is_active,
        })
        .eq('id', data.id);
      if (error) throw error;

      // Update profile if name or phone changed
      if (selectedDriver && (data.updates.full_name || data.updates.phone)) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: data.updates.full_name,
            phone: data.updates.phone,
          })
          .eq('user_id', selectedDriver.user_id);
        if (profileError) throw profileError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-drivers'] });
      toast({ title: 'Driver updated', description: 'Driver details have been updated.' });
      handleClose();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drivers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-drivers'] });
      toast({ title: 'Driver removed', description: 'Driver has been removed from your company.' });
      setDeleteDialogOpen(false);
      setSelectedDriver(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleOpen = (driver: any) => {
    setSelectedDriver(driver);
    setForm({
      email: '', // Can't edit email
      full_name: driver.profile?.full_name || '',
      phone: driver.profile?.phone || '',
      license_number: driver.license_number || '',
      assigned_bus_id: driver.assigned_bus_id,
      is_active: driver.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedDriver(null);
    setForm(defaultForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDriver) {
      updateDriverMutation.mutate({
        id: selectedDriver.id,
        updates: form,
      });
    }
  };

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Driver Management</h1>
            <p className="text-muted-foreground">Manage your drivers and their assignments</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> To add a new driver, they must first register on the platform. 
              Then, contact the system administrator to assign them the driver role and link them to your company.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Drivers</CardTitle>
            <CardDescription>{drivers?.length || 0} drivers in your company</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : drivers?.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No drivers assigned yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Contact the administrator to add drivers to your company
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Assigned Bus</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers?.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {driver.profile?.full_name?.charAt(0) || 'D'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {driver.profile?.full_name || 'Unknown'}
                            </p>
                            {driver.profile?.phone && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {driver.profile.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{driver.license_number || '-'}</TableCell>
                      <TableCell>
                        {driver.bus ? (
                          <Badge variant="outline">
                            {driver.bus.registration_number}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={driver.is_active ? 'default' : 'secondary'}>
                          {driver.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpen(driver)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedDriver(driver);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>Update driver details and assignment</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={form.full_name}
                onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+232 XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license">License Number</Label>
              <Input
                id="license"
                value={form.license_number}
                onChange={(e) => setForm(prev => ({ ...prev, license_number: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned Bus</Label>
              <Select
                value={form.assigned_bus_id || 'none'}
                onValueChange={(v) => setForm(prev => ({ ...prev, assigned_bus_id: v === 'none' ? null : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a bus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No bus assigned</SelectItem>
                  {buses?.map(bus => (
                    <SelectItem key={bus.id} value={bus.id}>
                      {bus.registration_number} ({bus.model || 'Bus'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Driver is active</Label>
              <Switch
                id="active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={updateDriverMutation.isPending}>
                {updateDriverMutation.isPending ? 'Saving...' : 'Update Driver'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this driver from your company? 
              This will unlink them but won't delete their user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedDriver && deleteDriverMutation.mutate(selectedDriver.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CompanyLayout>
  );
}
