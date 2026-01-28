import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Route as RouteIcon, Clock, MapPin, Calendar } from 'lucide-react';
import { CompanyLayout } from '@/components/layout/CompanyLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface RouteForm {
  origin: string;
  destination: string;
  stops: string[];
  distance_km: number | null;
  estimated_duration_minutes: number | null;
  is_active: boolean;
}

interface ScheduleForm {
  route_id: string;
  bus_id: string;
  departure_time: string;
  arrival_time: string;
  price_leones: number;
  days_of_week: number[];
  is_active: boolean;
}

const defaultRouteForm: RouteForm = {
  origin: '',
  destination: '',
  stops: [],
  distance_km: null,
  estimated_duration_minutes: null,
  is_active: true,
};

const defaultScheduleForm: ScheduleForm = {
  route_id: '',
  bus_id: '',
  departure_time: '08:00',
  arrival_time: '12:00',
  price_leones: 50000,
  days_of_week: [0, 1, 2, 3, 4, 5, 6],
  is_active: true,
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const popularCities = [
  'Freetown', 'Bo', 'Kenema', 'Makeni', 'Koidu', 'Waterloo', 
  'Lunsar', 'Port Loko', 'Kabala', 'Magburaka'
];

export default function CompanyRoutes() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('routes');
  
  // Route state
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [routeDeleteDialogOpen, setRouteDeleteDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [routeForm, setRouteForm] = useState<RouteForm>(defaultRouteForm);
  const [newStop, setNewStop] = useState('');

  // Schedule state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDeleteDialogOpen, setScheduleDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>(defaultScheduleForm);

  // Queries
  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ['company-routes', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
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

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['company-schedules', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          route:routes(*),
          bus:buses(*)
        `)
        .order('departure_time', { ascending: true });
      if (error) throw error;
      return (data || []).filter(s => s.route?.company_id === companyId);
    },
    enabled: !!companyId,
  });

  // Route mutations
  const saveRouteMutation = useMutation({
    mutationFn: async (data: RouteForm) => {
      if (selectedRoute) {
        const { error } = await supabase
          .from('routes')
          .update({
            origin: data.origin,
            destination: data.destination,
            stops: data.stops,
            distance_km: data.distance_km,
            estimated_duration_minutes: data.estimated_duration_minutes,
            is_active: data.is_active,
          })
          .eq('id', selectedRoute.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('routes').insert({
          company_id: companyId,
          origin: data.origin,
          destination: data.destination,
          stops: data.stops,
          distance_km: data.distance_km,
          estimated_duration_minutes: data.estimated_duration_minutes,
          is_active: data.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-routes'] });
      toast({
        title: selectedRoute ? 'Route updated' : 'Route created',
        description: 'Route has been saved successfully.',
      });
      closeRouteDialog();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteRouteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-routes'] });
      toast({ title: 'Route deleted' });
      setRouteDeleteDialogOpen(false);
      setSelectedRoute(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Schedule mutations
  const saveScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleForm) => {
      if (selectedSchedule) {
        const { error } = await supabase
          .from('schedules')
          .update({
            route_id: data.route_id,
            bus_id: data.bus_id,
            departure_time: data.departure_time,
            arrival_time: data.arrival_time,
            price_leones: data.price_leones,
            days_of_week: data.days_of_week,
            is_active: data.is_active,
          })
          .eq('id', selectedSchedule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('schedules').insert({
          route_id: data.route_id,
          bus_id: data.bus_id,
          departure_time: data.departure_time,
          arrival_time: data.arrival_time,
          price_leones: data.price_leones,
          days_of_week: data.days_of_week,
          is_active: data.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-schedules'] });
      toast({
        title: selectedSchedule ? 'Schedule updated' : 'Schedule created',
        description: 'Schedule has been saved successfully.',
      });
      closeScheduleDialog();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-schedules'] });
      toast({ title: 'Schedule deleted' });
      setScheduleDeleteDialogOpen(false);
      setSelectedSchedule(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Handlers
  const openRouteDialog = (route?: any) => {
    if (route) {
      setSelectedRoute(route);
      setRouteForm({
        origin: route.origin,
        destination: route.destination,
        stops: route.stops || [],
        distance_km: route.distance_km,
        estimated_duration_minutes: route.estimated_duration_minutes,
        is_active: route.is_active ?? true,
      });
    } else {
      setSelectedRoute(null);
      setRouteForm(defaultRouteForm);
    }
    setRouteDialogOpen(true);
  };

  const closeRouteDialog = () => {
    setRouteDialogOpen(false);
    setSelectedRoute(null);
    setRouteForm(defaultRouteForm);
    setNewStop('');
  };

  const openScheduleDialog = (schedule?: any) => {
    if (schedule) {
      setSelectedSchedule(schedule);
      setScheduleForm({
        route_id: schedule.route_id,
        bus_id: schedule.bus_id,
        departure_time: schedule.departure_time,
        arrival_time: schedule.arrival_time || '',
        price_leones: schedule.price_leones,
        days_of_week: schedule.days_of_week || [0, 1, 2, 3, 4, 5, 6],
        is_active: schedule.is_active ?? true,
      });
    } else {
      setSelectedSchedule(null);
      setScheduleForm(defaultScheduleForm);
    }
    setScheduleDialogOpen(true);
  };

  const closeScheduleDialog = () => {
    setScheduleDialogOpen(false);
    setSelectedSchedule(null);
    setScheduleForm(defaultScheduleForm);
  };

  const addStop = () => {
    if (newStop.trim() && !routeForm.stops.includes(newStop.trim())) {
      setRouteForm(prev => ({ ...prev, stops: [...prev.stops, newStop.trim()] }));
      setNewStop('');
    }
  };

  const removeStop = (stop: string) => {
    setRouteForm(prev => ({ ...prev, stops: prev.stops.filter(s => s !== stop) }));
  };

  const toggleDay = (day: number) => {
    setScheduleForm(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort(),
    }));
  };

  const handleRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeForm.origin || !routeForm.destination) {
      toast({ title: 'Error', description: 'Origin and destination are required.', variant: 'destructive' });
      return;
    }
    saveRouteMutation.mutate(routeForm);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.route_id || !scheduleForm.bus_id) {
      toast({ title: 'Error', description: 'Route and bus are required.', variant: 'destructive' });
      return;
    }
    saveScheduleMutation.mutate(scheduleForm);
  };

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Routes & Schedules</h1>
            <p className="text-muted-foreground">Manage your bus routes and departure schedules</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
          </TabsList>

          <TabsContent value="routes" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => openRouteDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Route
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Routes</CardTitle>
                <CardDescription>{routes?.length || 0} routes configured</CardDescription>
              </CardHeader>
              <CardContent>
                {routesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : routes?.length === 0 ? (
                  <div className="text-center py-12">
                    <RouteIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No routes created yet</p>
                    <Button className="mt-4" onClick={() => openRouteDialog()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Route
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead>Stops</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {routes?.map((route) => (
                        <TableRow key={route.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{route.origin}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-medium">{route.destination}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {route.stops?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {route.stops.slice(0, 2).map((stop: string) => (
                                  <Badge key={stop} variant="outline" className="text-xs">
                                    {stop}
                                  </Badge>
                                ))}
                                {route.stops.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{route.stops.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Direct</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {route.distance_km ? `${route.distance_km} km` : '-'}
                          </TableCell>
                          <TableCell>
                            {route.estimated_duration_minutes 
                              ? `${Math.floor(route.estimated_duration_minutes / 60)}h ${route.estimated_duration_minutes % 60}m`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={route.is_active ? 'default' : 'secondary'}>
                              {route.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openRouteDialog(route)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedRoute(route);
                                setRouteDeleteDialogOpen(true);
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
          </TabsContent>

          <TabsContent value="schedules" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => openScheduleDialog()} disabled={!routes?.length || !buses?.length}>
                <Plus className="mr-2 h-4 w-4" />
                Add Schedule
              </Button>
            </div>

            {(!routes?.length || !buses?.length) && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="py-4">
                  <p className="text-sm text-amber-800">
                    {!routes?.length && 'You need to create at least one route before adding schedules. '}
                    {!buses?.length && 'You need to add at least one bus before adding schedules.'}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Your Schedules</CardTitle>
                <CardDescription>{schedules?.length || 0} schedules configured</CardDescription>
              </CardHeader>
              <CardContent>
                {schedulesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : schedules?.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No schedules created yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead>Bus</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules?.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>
                            <div className="font-medium">
                              {schedule.route?.origin} → {schedule.route?.destination}
                            </div>
                          </TableCell>
                          <TableCell>{schedule.bus?.registration_number}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {schedule.departure_time?.slice(0, 5)}
                              {schedule.arrival_time && ` - ${schedule.arrival_time.slice(0, 5)}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {dayNames.map((day, i) => (
                                <span
                                  key={i}
                                  className={`text-xs px-1 rounded ${
                                    schedule.days_of_week?.includes(i)
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {day[0]}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>Le {schedule.price_leones?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                              {schedule.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openScheduleDialog(schedule)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedSchedule(schedule);
                                setScheduleDeleteDialogOpen(true);
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Route Dialog */}
      <Dialog open={routeDialogOpen} onOpenChange={setRouteDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedRoute ? 'Edit Route' : 'Add New Route'}</DialogTitle>
            <DialogDescription>Configure the route details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRouteSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin *</Label>
                <Select
                  value={routeForm.origin}
                  onValueChange={(v) => setRouteForm(prev => ({ ...prev, origin: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>
                  <SelectContent>
                    {popularCities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <Select
                  value={routeForm.destination}
                  onValueChange={(v) => setRouteForm(prev => ({ ...prev, destination: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {popularCities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Stops (optional)</Label>
              <div className="flex gap-2">
                <Input
                  value={newStop}
                  onChange={(e) => setNewStop(e.target.value)}
                  placeholder="Add a stop"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStop())}
                />
                <Button type="button" variant="outline" onClick={addStop}>Add</Button>
              </div>
              {routeForm.stops.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {routeForm.stops.map((stop) => (
                    <Badge key={stop} variant="secondary" className="gap-1">
                      {stop}
                      <button type="button" onClick={() => removeStop(stop)} className="ml-1">×</button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distance">Distance (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  value={routeForm.distance_km || ''}
                  onChange={(e) => setRouteForm(prev => ({ 
                    ...prev, 
                    distance_km: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={routeForm.estimated_duration_minutes || ''}
                  onChange={(e) => setRouteForm(prev => ({ 
                    ...prev, 
                    estimated_duration_minutes: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Route is active</Label>
              <Switch
                id="active"
                checked={routeForm.is_active}
                onCheckedChange={(checked) => setRouteForm(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeRouteDialog}>Cancel</Button>
              <Button type="submit" disabled={saveRouteMutation.isPending}>
                {saveRouteMutation.isPending ? 'Saving...' : selectedRoute ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSchedule ? 'Edit Schedule' : 'Add New Schedule'}</DialogTitle>
            <DialogDescription>Configure the departure schedule</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Route *</Label>
              <Select
                value={scheduleForm.route_id}
                onValueChange={(v) => setScheduleForm(prev => ({ ...prev, route_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routes?.filter(r => r.is_active).map(route => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.origin} → {route.destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bus *</Label>
              <Select
                value={scheduleForm.bus_id}
                onValueChange={(v) => setScheduleForm(prev => ({ ...prev, bus_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bus" />
                </SelectTrigger>
                <SelectContent>
                  {buses?.map(bus => (
                    <SelectItem key={bus.id} value={bus.id}>
                      {bus.registration_number} ({bus.seat_capacity} seats)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure">Departure Time *</Label>
                <Input
                  id="departure"
                  type="time"
                  value={scheduleForm.departure_time}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, departure_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrival">Arrival Time</Label>
                <Input
                  id="arrival"
                  type="time"
                  value={scheduleForm.arrival_time}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, arrival_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (Leones) *</Label>
              <Input
                id="price"
                type="number"
                value={scheduleForm.price_leones}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, price_leones: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Operating Days</Label>
              <div className="flex gap-2">
                {dayNames.map((day, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      scheduleForm.days_of_week.includes(i)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="scheduleActive">Schedule is active</Label>
              <Switch
                id="scheduleActive"
                checked={scheduleForm.is_active}
                onCheckedChange={(checked) => setScheduleForm(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeScheduleDialog}>Cancel</Button>
              <Button type="submit" disabled={saveScheduleMutation.isPending}>
                {saveScheduleMutation.isPending ? 'Saving...' : selectedSchedule ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialogs */}
      <AlertDialog open={routeDeleteDialogOpen} onOpenChange={setRouteDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will also delete all schedules for this route.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRoute && deleteRouteMutation.mutate(selectedRoute.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={scheduleDeleteDialogOpen} onOpenChange={setScheduleDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSchedule && deleteScheduleMutation.mutate(selectedSchedule.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CompanyLayout>
  );
}
