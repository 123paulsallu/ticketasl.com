import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ticket, Search, Calendar, Filter, Eye } from 'lucide-react';
import { CompanyLayout } from '@/components/layout/CompanyLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function CompanyBookings() {
  const { companyId } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['company-tickets', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          trip:trips!inner(
            trip_date,
            schedule:schedules!inner(
              departure_time,
              arrival_time,
              price_leones,
              route:routes!inner(
                origin,
                destination,
                company_id
              ),
              bus:buses(
                registration_number,
                model
              )
            )
          )
        `)
        .order('purchased_at', { ascending: false });
      if (error) throw error;
      // Filter by company
      return (data || []).filter(t => t.trip?.schedule?.route?.company_id === companyId);
    },
    enabled: !!companyId,
  });

  const filteredTickets = tickets?.filter(ticket => {
    const matchesSearch = 
      ticket.passenger_name.toLowerCase().includes(search.toLowerCase()) ||
      ticket.ticket_code.toLowerCase().includes(search.toLowerCase()) ||
      ticket.passenger_phone.includes(search);
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tickets?.length || 0,
    active: tickets?.filter(t => t.status === 'active').length || 0,
    used: tickets?.filter(t => t.status === 'used').length || 0,
    cancelled: tickets?.filter(t => t.status === 'cancelled').length || 0,
    revenue: tickets?.reduce((sum, t) => sum + (t.price_paid || 0), 0) || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'used':
        return <Badge className="bg-blue-100 text-blue-800">Used</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openDetails = (ticket: any) => {
    setSelectedTicket(ticket);
    setDetailsOpen(true);
  };

  return (
    <CompanyLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bookings & Tickets</h1>
            <p className="text-muted-foreground">View and manage all ticket bookings</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Tickets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.used}</div>
              <p className="text-xs text-muted-foreground">Used</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">
                Le {stats.revenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
            <CardDescription>Search and filter your ticket bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or ticket code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : filteredTickets?.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {search || statusFilter !== 'all' 
                    ? 'No tickets match your search criteria' 
                    : 'No bookings yet'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket Code</TableHead>
                    <TableHead>Passenger</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Travel Date</TableHead>
                    <TableHead>Seat</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets?.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono font-medium">
                        {ticket.ticket_code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.passenger_name}</p>
                          <p className="text-sm text-muted-foreground">{ticket.passenger_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ticket.trip?.schedule?.route?.origin} → {ticket.trip?.schedule?.route?.destination}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {ticket.trip?.trip_date && format(new Date(ticket.trip.trip_date), 'MMM d, yyyy')}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ticket.trip?.schedule?.departure_time?.slice(0, 5)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">#{ticket.seat_number}</Badge>
                      </TableCell>
                      <TableCell>Le {ticket.price_paid?.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetails(ticket)}
                        >
                          <Eye className="h-4 w-4" />
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

      {/* Ticket Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>
              Ticket Code: {selectedTicket?.ticket_code}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Passenger</p>
                  <p className="font-medium">{selectedTicket.passenger_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedTicket.passenger_phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Route</p>
                  <p className="font-medium">
                    {selectedTicket.trip?.schedule?.route?.origin} → {selectedTicket.trip?.schedule?.route?.destination}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bus</p>
                  <p className="font-medium">
                    {selectedTicket.trip?.schedule?.bus?.registration_number || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Travel Date</p>
                  <p className="font-medium">
                    {selectedTicket.trip?.trip_date && format(new Date(selectedTicket.trip.trip_date), 'PPP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departure Time</p>
                  <p className="font-medium">
                    {selectedTicket.trip?.schedule?.departure_time?.slice(0, 5)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Seat</p>
                  <p className="font-medium">#{selectedTicket.seat_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price Paid</p>
                  <p className="font-medium">Le {selectedTicket.price_paid?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Purchased At</p>
                  <p className="font-medium">
                    {format(new Date(selectedTicket.purchased_at), 'PPp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge variant={selectedTicket.payment_status === 'completed' ? 'default' : 'secondary'}>
                    {selectedTicket.payment_status || 'pending'}
                  </Badge>
                </div>
              </div>

              {selectedTicket.scanned_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Scanned At</p>
                  <p className="font-medium">
                    {format(new Date(selectedTicket.scanned_at), 'PPp')}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </CompanyLayout>
  );
}
