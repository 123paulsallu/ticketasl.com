'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Camera, CheckCircle2, AlertCircle, Clock, XCircle, MapPin, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ScanResult {
  success: boolean;
  message: string;
  ticket?: {
    id: string;
    passenger_name: string;
    passenger_phone: string;
    seat_number: number;
    ticket_code: string;
    status: string;
    trip: {
      trip_date: string;
      schedule: {
        departure_time: string;
        route: { origin: string; destination: string };
        bus: { registration_number: string };
      };
    };
  };
  scan_id?: string;
}

export default function DriverScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastScannedRef = useRef<string>('');
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [driverVerified, setDriverVerified] = useState<boolean | null>(null);

  // Verify driver on mount
  useEffect(() => {
    const verifyDriver = async () => {
      if (!user) {
        setDriverVerified(false);
        return;
      }
      
      const { data } = await supabase
        .from('drivers')
        .select('id, company_id')
        .eq('user_id', user.id)
        .single();
      
      setDriverVerified(!!data);
    };
    
    verifyDriver();
  }, [user]);

  // Scan ticket by code
  const scanTicketByCode = useCallback(async (code: string) => {
    if (!code.trim() || !user || isScanning) return;
    
    // Prevent duplicate scans
    if (code === lastScannedRef.current) return;
    lastScannedRef.current = code;
    
    setIsScanning(true);

    try {
      // Find ticket by code
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          id, passenger_name, passenger_phone, seat_number, ticket_code, status, price_paid,
          trip:trips(
            id, trip_date, status,
            schedule:schedules(
              departure_time, arrival_time,
              route:routes(origin, destination),
              bus:buses(registration_number, model)
            )
          )
        `)
        .eq('ticket_code', code.toUpperCase().trim())
        .single();

      if (ticketError || !ticketData) {
        const result: ScanResult = {
          success: false,
          message: `Ticket not found: ${code}`,
        };
        setLastScan(result);
        toast({ title: 'Invalid Ticket', description: result.message, variant: 'destructive' });
        setTimeout(() => { lastScannedRef.current = ''; }, 3000);
        setIsScanning(false);
        return;
      }

      const ticket = ticketData as any;

      // Check if ticket is already used
      if (ticket.status === 'used') {
        const result: ScanResult = {
          success: false,
          message: `Ticket already scanned`,
          ticket,
        };
        setLastScan(result);
        toast({ title: 'Already Used', description: 'This ticket has already been scanned.', variant: 'destructive' });
        setTimeout(() => { lastScannedRef.current = ''; }, 3000);
        setIsScanning(false);
        return;
      }

      // Check if ticket is expired or cancelled
      if (ticket.status === 'expired' || ticket.status === 'cancelled') {
        const result: ScanResult = {
          success: false,
          message: `Ticket is ${ticket.status}`,
          ticket,
        };
        setLastScan(result);
        toast({ title: 'Invalid Status', description: `Ticket is ${ticket.status}.`, variant: 'destructive' });
        setTimeout(() => { lastScannedRef.current = ''; }, 3000);
        setIsScanning(false);
        return;
      }

      // Create scan record
      const { data: scanData, error: scanError } = await supabase
        .from('ticket_scans')
        .insert({
          ticket_id: ticket.id,
          scanned_by: user.id,
          scan_result: 'valid',
          scan_location: 'driver_scanner',
        })
        .select('id')
        .single();

      if (scanError) {
        console.error('Scan record error:', scanError);
        setLastScan({
          success: false,
          message: 'Failed to record scan. Please try again.',
        });
        toast({ title: 'Scan Error', description: 'Failed to record scan.', variant: 'destructive' });
        setTimeout(() => { lastScannedRef.current = ''; }, 3000);
        setIsScanning(false);
        return;
      }

      // Update ticket status to used
      await supabase
        .from('tickets')
        .update({
          status: 'used',
          scanned_at: new Date().toISOString(),
          scanned_by: user.id,
        })
        .eq('id', ticket.id);

      const successResult: ScanResult = {
        success: true,
        message: `✓ ${ticket.passenger_name} - Seat ${ticket.seat_number}`,
        ticket,
        scan_id: scanData.id,
      };

      setLastScan(successResult);
      setScanHistory(prev => [successResult, ...prev].slice(0, 50));
      setManualCode('');
      
      toast({ 
        title: 'Ticket Valid ✓', 
        description: `${ticket.passenger_name} - Seat ${ticket.seat_number}`,
      });

      // Allow re-scanning after 2 seconds
      setTimeout(() => { lastScannedRef.current = ''; }, 2000);
    } catch (error) {
      console.error('Scan error:', error);
      setLastScan({
        success: false,
        message: 'Error scanning ticket. Please try again.',
      });
      setTimeout(() => { lastScannedRef.current = ''; }, 3000);
    } finally {
      setIsScanning(false);
    }
  }, [user, isScanning, toast]);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  // Stop camera
  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
  }, []);

  // QR code scanning loop
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    const scanFrame = () => {
      if (!cameraActive || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (qrCode?.data) {
        scanTicketByCode(qrCode.data);
      }

      animationRef.current = requestAnimationFrame(scanFrame);
    };

    animationRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cameraActive, scanTicketByCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Handle manual code submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scanTicketByCode(manualCode);
  };

  if (driverVerified === null) {
    return (
      <MainLayout>
        <div className="container py-8 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (driverVerified === false) {
    return (
      <MainLayout>
        <div className="container py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You are not registered as a driver. Please contact your company administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Ticket Scanner</h1>

        <Tabs defaultValue="scanner" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="scanner">Scan Ticket</TabsTrigger>
            <TabsTrigger value="history">History ({scanHistory.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="scanner" className="space-y-4">
            {/* Camera Scanner */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5" />
                  QR Code Scanner
                </CardTitle>
                <CardDescription>
                  Point camera at the ticket QR code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative bg-muted rounded-lg overflow-hidden aspect-[4/3]">
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      {/* Scanning overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-primary rounded-lg relative">
                          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-lg" />
                        </div>
                      </div>
                      {isScanning && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center min-h-[200px]">
                      <div className="text-center">
                        <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Camera not active</p>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={cameraActive ? stopCamera : startCamera}
                  variant={cameraActive ? 'outline' : 'default'}
                  className="w-full"
                  size="lg"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {cameraActive ? 'Stop Camera' : 'Start Camera'}
                </Button>
              </CardContent>
            </Card>

            {/* Manual Entry */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <QrCode className="h-5 w-5" />
                  Manual Entry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <Input
                    placeholder="Enter ticket code"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    disabled={isScanning}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={isScanning || !manualCode.trim()}
                  >
                    {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Scan'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Last Scan Result */}
            {lastScan && (
              <Card className={lastScan.success ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-destructive bg-destructive/10'}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {lastScan.success ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${lastScan.success ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
                        {lastScan.success ? 'Valid Ticket' : 'Invalid'}
                      </p>
                      <p className="text-sm mt-1">{lastScan.message}</p>

                      {lastScan.ticket && (
                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {lastScan.ticket.trip.schedule.route.origin} → {lastScan.ticket.trip.schedule.route.destination}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{lastScan.ticket.passenger_phone}</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">
                              {lastScan.ticket.trip.schedule.bus.registration_number}
                            </Badge>
                            <Badge variant={lastScan.ticket.status === 'used' ? 'default' : 'secondary'}>
                              {lastScan.ticket.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Scan History</CardTitle>
                <CardDescription>
                  {scanHistory.length} tickets scanned this session
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scanHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No tickets scanned yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {scanHistory.map((scan, idx) => (
                      <div
                        key={scan.scan_id || idx}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{scan.message}</p>
                          {scan.ticket && (
                            <p className="text-xs text-muted-foreground">
                              {scan.ticket.trip.schedule.route.origin} → {scan.ticket.trip.schedule.route.destination}
                            </p>
                          )}
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          {scan.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
