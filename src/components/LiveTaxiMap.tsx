'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Navigation, Route, Loader2, Car, Phone, MessageCircle, Home, ArrowRight } from 'lucide-react';

// Icono de taxi en zona
const taxiInZoneIcon = L.divIcon({
  html: '<div style="background: #fbbf24; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #92400e; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 18px;">🚕</div>',
  className: 'custom-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Icono de taxi fuera de zona (de vuelta)
const taxiReturnIcon = L.divIcon({
  html: '<div style="background: #3b82f6; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #1d4ed8; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 18px;">🚕</div>',
  className: 'custom-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Icono de cliente
const clientIcon = L.divIcon({
  html: '<div style="background: #22c55e; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>',
  className: 'custom-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface LiveTaxi {
  id: string;
  name: string;
  slug: string;
  phone: string;
  whatsapp: string | null;
  imageUrl: string | null;
  rating: number;
  reviewCount: number;
  isTopRated: boolean;
  isVerified: boolean;
  vehicleType: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  location: {
    latitude: number;
    longitude: number;
    timestamp: string;
    age: number;
  };
  baseCity: {
    name: string;
    slug: string;
    canton: string;
  };
  distanceToClient: number;
  distanceFromBase: number;
  isInBaseZone: boolean;
  routes: Array<{ origin: string; destination: string }>;
  availableDestinations: string[];
  matchedDestinations: string[];
  availabilityReason: string;
  services: string[];
  languages: string[];
}

interface LiveTaxiMapProps {
  clientLat: number;
  clientLon: number;
  destination?: string;
  radius?: number;
  onTaxiSelect?: (taxi: LiveTaxi) => void;
}

export default function LiveTaxiMap({ 
  clientLat, 
  clientLon, 
  destination,
  radius = 25,
  onTaxiSelect 
}: LiveTaxiMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  
  const [taxis, setTaxis] = useState<LiveTaxi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaxi, setSelectedTaxi] = useState<LiveTaxi | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchTaxis = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        lat: clientLat.toString(),
        lon: clientLon.toString(),
        radius: radius.toString(),
      });
      
      if (destination) {
        params.append('destination', destination);
      }

      const res = await fetch(`/api/taxis/live?${params}`);
      const data = await res.json();

      if (data.success) {
        setTaxis(data.data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError(data.error || 'Error al cargar taxis');
      }
    } catch (err) {
      console.error('Error fetching live taxis:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [clientLat, clientLon, radius, destination]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([clientLat, clientLon], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [clientLat, clientLon]);

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    const clientMarker = L.marker([clientLat, clientLon], { icon: clientIcon })
      .addTo(map)
      .bindPopup('<strong>Tu ubicación</strong>');
    markersRef.current.push(clientMarker);

    taxis.forEach(taxi => {
      const icon = taxi.isInBaseZone ? taxiInZoneIcon : taxiReturnIcon;
      
      const routesHtml = taxi.routes.length > 0 
        ? `<div style="margin-top: 8px; font-size: 11px;">
            ${taxi.routes.slice(0, 3).map(r => `
              <div style="display: flex; align-items: center; gap: 4px; color: #666;">
                <span>${r.origin}</span>
                <span style="color: #fbbf24;">→</span>
                <span style="color: #3b82f6; font-weight: 500;">${r.destination}</span>
              </div>
            `).join('')}
           </div>`
        : '';

      const popupContent = `
        <div style="min-width: 200px;">
          <strong style="font-size: 14px;">${taxi.name}</strong><br/>
          <div style="display: flex; align-items: center; gap: 4px; margin: 4px 0;">
            <span style="color: #fbbf24;">★</span>
            <span>${taxi.rating.toFixed(1)}</span>
            <span style="color: #666;">(${taxi.reviewCount})</span>
          </div>
          <div style="font-size: 12px; color: #666;">
            🚗 ${taxi.vehicleColor || ''} ${taxi.vehicleBrand || ''} ${taxi.vehicleModel || ''}<br/>
            📍 A ${taxi.distanceToClient} km de ti
          </div>
          ${!taxi.isInBaseZone ? `
            <div style="background: #dbeafe; padding: 6px; border-radius: 4px; margin-top: 8px; font-size: 12px;">
              <div style="color: #1d4ed8; font-weight: 500;">↩️ ${taxi.availabilityReason}</div>
            </div>
          ` : `
            <div style="background: #fef3c7; padding: 6px; border-radius: 4px; margin-top: 8px; font-size: 12px;">
              <span style="color: #92400e;">🏠 En su zona de trabajo</span>
            </div>
          `}
          ${routesHtml}
        </div>
      `;

      const marker = L.marker([taxi.location.latitude, taxi.location.longitude], { icon })
        .addTo(map)
        .bindPopup(popupContent);
      
      marker.on('click', () => {
        setSelectedTaxi(taxi);
        if (onTaxiSelect) onTaxiSelect(taxi);
      });

      markersRef.current.push(marker);
    });

    if (taxis.length > 0) {
      const bounds = L.latLngBounds([
        [clientLat, clientLon] as [number, number],
        ...taxis.map(t => [t.location.latitude, t.location.longitude] as [number, number])
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [taxis, clientLat, clientLon, onTaxiSelect]);

  // Poll for updates
  useEffect(() => {
    fetchTaxis();
    const interval = setInterval(fetchTaxis, 30000);
    return () => clearInterval(interval);
  }, [fetchTaxis]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Navigation className="h-5 w-5 text-yellow-400" />
            Taxis en tiempo real
          </h3>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground">
              Actualizado: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchTaxis} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar'}
        </Button>
      </div>

      {/* Map */}
      <div 
        ref={mapRef} 
        className="w-full h-[300px] md:h-[400px] rounded-lg border border-border overflow-hidden"
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-yellow-700"></div>
          <span>En su zona</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-700"></div>
          <span>Disponible para sus rutas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
          <span>Tu ubicación</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {taxis.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-muted-foreground">
          <Car className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No hay taxis disponibles cerca de ti</p>
          <p className="text-sm">Intenta ampliar el radio de búsqueda</p>
        </div>
      )}

      {taxis.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">
            {taxis.length} taxi{taxis.length !== 1 ? 's' : ''} encontrado{taxis.length !== 1 ? 's' : ''}
          </h4>
          
          {taxis.map(taxi => (
            <Card 
              key={taxi.id}
              className={`cursor-pointer transition-all hover:border-yellow-400/50 ${
                selectedTaxi?.id === taxi.id ? 'border-yellow-400 bg-yellow-400/5' : ''
              }`}
              onClick={() => setSelectedTaxi(taxi)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0 relative">
                    {taxi.imageUrl ? (
                      <img src={taxi.imageUrl} alt={taxi.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <span className="text-xl">🚕</span>
                    )}
                    {!taxi.isInBaseZone && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <Route className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{taxi.name}</span>
                      {taxi.isVerified && (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                          ✓ Verificado
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span>{taxi.rating.toFixed(1)}</span>
                      <span>({taxi.reviewCount})</span>
                      <span className="text-muted-foreground">•</span>
                      <MapPin className="h-4 w-4" />
                      <span>{taxi.distanceToClient} km</span>
                    </div>

                    {/* En zona de trabajo */}
                    {taxi.isInBaseZone && (
                      <div className="mt-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
                        <div className="flex items-center gap-2 text-sm text-yellow-600">
                          <Home className="h-4 w-4" />
                          <span className="font-medium">En su zona de trabajo</span>
                        </div>
                      </div>
                    )}

                    {/* Fuera de zona - mostrar rutas */}
                    {!taxi.isInBaseZone && taxi.matchedDestinations.length > 0 && (
                      <div className="mt-2 p-2 rounded bg-blue-500/10 border border-blue-500/30">
                        <div className="flex items-center gap-2 text-sm text-blue-400 mb-2">
                          <Route className="h-4 w-4" />
                          <span className="font-medium">Puede llevarte a:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {taxi.matchedDestinations.map((dest) => (
                            <Badge key={dest} variant="secondary" className="text-xs bg-blue-500/20 text-blue-300">
                              {dest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vehicle info */}
                    <p className="text-xs text-muted-foreground mt-2">
                      {taxi.vehicleColor && `${taxi.vehicleColor} `}
                      {taxi.vehicleBrand} {taxi.vehicleModel}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <a
                      href={`tel:${taxi.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                    {taxi.whatsapp && (
                      <a
                        href={`https://wa.me/${taxi.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
