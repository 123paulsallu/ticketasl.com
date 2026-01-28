import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Bus, Check } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface BusForm {
  registration_number: string;
  model: string;
  seat_capacity: number;
  amenities: string[];
  is_available: boolean;
}

const defaultForm: BusForm = {
  registration_number: '',
  model: '',
  seat_capacity: 40,
  amenities: [],
  is_available: true,
};

const amenityOptions = ['AC', 'WiFi', 'USB Charging', 'Reclining Seats', 'Entertainment', 'Toilet'];

export default function CompanyFleet() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [form, setForm] = useState<BusForm>(defaultForm);

  const { data: buses, isLoading } = useQuery({
    queryKey: ['company-buses', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: BusForm) => {
      if (selectedBus) {
        const { error } = await supabase
          .from('buses')
          .update({
            registration_number: data.registration_number,
            model: data.model,
            seat_capacity: data.seat_capacity,
            amenities: data.amenities,
            is_available: data.is_available,
          })
          .eq('id', selectedBus.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('buses').insert({
          company_id: companyId,
          registration_number: data.registration_number,
          model: data.model,
          seat_capacity: data.seat_capacity,
          amenities: data.amenities,
          is_available: data.is_available,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-buses'] });
      toast({
        title: selectedBus ? 'Bus updated' : 'Bus added',
        description: selectedBus ? 'Bus has been updated successfully.' : 'New bus has been added to your fleet.',
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save bus.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('buses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-buses'] });
      toast({ title: 'Bus deleted', description: 'Bus has been removed from your fleet.' });
      setDeleteDialogOpen(false);
      setSelectedBus(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete bus.',
        variant: 'destructive',
      });
    },
  });

  const handleOpen = (bus?: any) => {
    if (bus) {
      setSelectedBus(bus);
      setForm({
        registration_number: bus.registration_number,
        model: bus.model || '',
        seat_capacity: bus.seat_capacity,
        amenities: bus.amenities || [],
        is_available: bus.is_available ?? true,
      });
    } else {
      setSelectedBus(null);
      setForm(defaultForm);
    }
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedBus(null);
    setForm(defaultForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.registration_number.trim()) {
      toast({ title: 'Error', description: 'Registration number is required.', variant: 'destructive' });
      return;
    }
    saveMutation.mutate(form);
  };

  const toggleAmenity = (amenity: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fleet Management</h1>
            <p className="text-muted-foreground">Manage your buses and their availability</p>
          </div>
          <Button onClick={() => handleOpen()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Bus
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Fleet</CardTitle>
            <CardDescription>
              {buses?.length || 0} buses in your fleet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : buses?.length === 0 ? (
              <div className="text-center py-12">
                <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No buses added yet</p>
                <Button className="mt-4" onClick={() => handleOpen()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Bus
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Amenities</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buses?.map((bus) => (
                    <TableRow key={bus.id}>
                      <TableCell className="font-medium">{bus.registration_number}</TableCell>
                      <TableCell>{bus.model || '-'}</TableCell>
                      <TableCell>{bus.seat_capacity} seats</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {bus.amenities?.slice(0, 3).map((a: string) => (
                            <Badge key={a} variant="secondary" className="text-xs">
                              {a}
                            </Badge>
                          ))}
                          {bus.amenities?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{bus.amenities.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={bus.is_available ? 'default' : 'secondary'}>
                          {bus.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpen(bus)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedBus(bus);
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedBus ? 'Edit Bus' : 'Add New Bus'}</DialogTitle>
            <DialogDescription>
              {selectedBus ? 'Update bus details' : 'Add a new bus to your fleet'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="registration">Registration Number *</Label>
              <Input
                id="registration"
                value={form.registration_number}
                onChange={(e) => setForm(prev => ({ ...prev, registration_number: e.target.value }))}
                placeholder="e.g., ABC-1234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={form.model}
                onChange={(e) => setForm(prev => ({ ...prev, model: e.target.value }))}
                placeholder="e.g., Mercedes Sprinter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Seat Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={100}
                value={form.seat_capacity}
                onChange={(e) => setForm(prev => ({ ...prev, seat_capacity: parseInt(e.target.value) || 40 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Amenities</Label>
              <div className="flex flex-wrap gap-2">
                {amenityOptions.map((amenity) => (
                  <Badge
                    key={amenity}
                    variant={form.amenities.includes(amenity) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleAmenity(amenity)}
                  >
                    {form.amenities.includes(amenity) && <Check className="mr-1 h-3 w-3" />}
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="available">Available for booking</Label>
              <Switch
                id="available"
                checked={form.is_available}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_available: checked }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : selectedBus ? 'Update' : 'Add Bus'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bus</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bus? This action cannot be undone.
              Any schedules using this bus will need to be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedBus && deleteMutation.mutate(selectedBus.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CompanyLayout>
  );
}
