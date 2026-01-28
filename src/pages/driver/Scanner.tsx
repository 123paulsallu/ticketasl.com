'use client';

import { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Camera, CheckCircle2, AlertCircle, Clock, XCircle, MapPin, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Ticket, Trip, Schedule, Route, Bus } from '@/types/database';

interface ScanResult {
  success: boolean;
  message: string;
  ticket?: Ticket & { trip: Trip & { schedule: Schedule & { route: Route; bus: Bus } } };
  scan_id?: string;
}

export default function DriverScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTicketId, setScannedTicketId] = useState<string | null>(null);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      setLastScan({
        success: false,
        message: 'Unable to access camera. Please check permissions.',
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  // Scan ticket by code
  const scanTicketByCode = async (code: string) => {
    if (!code.trim() || !user) return;
    setIsScanning(true);

    try {
      // Get driver info
      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!driverData) {
        setLastScan({
          success: false,
          message: 'Driver profile not found. Please contact your administrator.',
        });
        setIsScanning(false);
        return;
      }

      // Find ticket by code
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          trip:trips(
            *,
            schedule:schedules(
              *,
              route:routes(*),
              bus:buses(*)
            )
          )
        `)
        .eq('ticket_code', code.toUpperCase())
        .single();

      if (ticketError || !ticketData) {
        setLastScan({
          success: false,
          message: `Ticket not found: ${code}`,
        });
        setIsScanning(false);
        return;
      }

      const ticket = ticketData as any;

      // Check if ticket is already used
      if (ticket.status === 'used') {
        setLastScan({
          success: false,
          message: `This ticket has already been scanned.`,
        });
        setIsScanning(false);
        return;
      }

      // Check if ticket is expired or cancelled
      if (ticket.status === 'expired' || ticket.status === 'cancelled') {
        setLastScan({
          success: false,
          message: `Ticket is ${ticket.status}.`,
        });
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
        .select()
        .single();

      if (scanError) {
        setLastScan({
          success: false,
          message: 'Failed to record scan. Please try again.',
        });
        setIsScanning(false);
        return;
      }

      // Update ticket status to used and record scanner info
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'used',
          scanned_at: new Date().toISOString(),
          scanned_by: user.id,
        })
        .eq('id', ticket.id);

      if (updateError) {
        console.error('Update error:', updateError);
      }

      setScannedTicketId(ticket.id);
      setLastScan({
        success: true,
        message: `Ticket validated successfully`,
        ticket,
        scan_id: scanData.id,
      });

      // Add to history
      setScanHistory(prev => [{
        success: true,
        message: `Ticket: ${ticket.passenger_name} - Seat ${ticket.seat_number}`,
        ticket,
        scan_id: scanData.id,
      }, ...prev].slice(0, 10));

      setManualCode('');
    } catch (error) {
      console.error('Scan error:', error);
      setLastScan({
        success: false,
        message: 'Error scanning ticket. Please try again.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Handle manual code submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scanTicketByCode(manualCode);
  };

  // Scan from camera (QR code reading using canvas)
  const scanFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const context = canvasRef.current.getContext('2d');
      if (!context) return;

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      
      context.drawImage(videoRef.current, 0, 0);
      
      // Try to extract text from canvas (simplified approach)
      // In a production app, you'd use jsQR library or similar
      const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // For now, prompt user for manual input since we don't have jsQR library
      if (lastScan?.success === false || !lastScan) {
        setLastScan({
          success: false,
          message: 'Point camera at QR code, or use manual entry below',
        });
      }
    } catch (error) {
      console.error('Camera scan error:', error);
    }
  };

  // Auto-scan from camera periodically
  useEffect(() => {
    if (!cameraActive) return;
    const interval = setInterval(scanFromCamera, 500);
    return () => clearInterval(interval);
  }, [cameraActive]);

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Ticket Scanner</h1>

        <Tabs defaultValue="scanner" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scanner">Scan Ticket</TabsTrigger>
            <TabsTrigger value="history">Scan History</TabsTrigger>
          </TabsList>

          <TabsContent value="scanner" className="space-y-6">
            {/* Camera Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  QR Code Scanner
                </CardTitle>
                <CardDescription>
                  Position ticket QR code in front of camera
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full aspect-video object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 border-2 border-green-500 m-auto w-48 h-48 pointer-events-none">
                        <div className="absolute inset-0 border-4 border-green-500 m-2"></div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full aspect-video flex items-center justify-center">
                      <div className="text-center">
                        <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Camera not active</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!cameraActive ? (
                    <Button onClick={startCamera} className="flex-1">
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                  ) : (
                    <Button onClick={stopCamera} variant="outline" className="flex-1">
                      Stop Camera
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Manual Entry */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Manual Code Entry
                </CardTitle>
                <CardDescription>
                  Enter ticket code manually if QR scan fails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <Input
                    placeholder="Enter ticket code (e.g., TKT-ABC123)"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    disabled={isScanning}
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isScanning || !manualCode.trim()}
                  >
                    {isScanning ? 'Scanning...' : 'Scan Ticket'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Last Scan Result */}
            {lastScan && (
              <Card className={lastScan.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {lastScan.success ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-green-600">Success</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-red-600">Error</span>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className={lastScan.success ? 'text-green-700' : 'text-red-700'}>
                    {lastScan.message}
                  </p>

                  {lastScan.ticket && (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Passenger</p>
                          <p className="font-semibold flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {lastScan.ticket.passenger_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Seat</p>
                          <p className="font-semibold">{lastScan.ticket.seat_number}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Route</p>
                        <p className="font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {lastScan.ticket.trip.schedule.route.origin} → {lastScan.ticket.trip.schedule.route.destination}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Bus</p>
                          <p className="font-semibold">{lastScan.ticket.trip.schedule.bus.registration_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant={lastScan.ticket.status === 'used' ? 'default' : 'secondary'}>
                            {lastScan.ticket.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Scans</CardTitle>
                <CardDescription>
                  {scanHistory.length} tickets scanned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scanHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No tickets scanned yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scanHistory.map((scan) => (
                      <div
                        key={scan.scan_id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <p className="font-semibold">{scan.message}</p>
                          {scan.ticket && (
                            <p className="text-sm text-muted-foreground">
                              {scan.ticket.trip.schedule.route.origin} → {scan.ticket.trip.schedule.route.destination}
                            </p>
                          )}
                        </div>
                        <div className="ml-4">
                          {scan.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
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
