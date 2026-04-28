'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Iconos personalizados
const originIcon = L.divIcon({
  html: '<div style="background: #22c55e; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 12px; font-weight: bold;">A</span></div>',
  className: 'custom-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const destIcon = L.divIcon({
  html: '<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 12px; font-weight: bold;">B</span></div>',
  className: 'custom-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Decodificar polyline de OSRM
function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

    coords.push([lat / 1e5, lng / 1e5]);
  }

  return coords;
}

interface RouteMapProps {
  geometry?: string;
  origin: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  stops?: Array<{ lat: number; lon: number }>;
}

// Create stop icon with a label
function createStopIcon(label: string, color: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 11px; font-weight: bold;">${label}</span></div>`,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const stopIcon = createStopIcon('1', '#3b82f6');
const stop2Icon = createStopIcon('2', '#8b5cf6');
const stop3Icon = createStopIcon('3', '#f97316');
const stopIcons = [stopIcon, stop2Icon, stop3Icon];

export default function RouteMap({ geometry, origin, destination, stops = [] }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const layersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Crear mapa si no existe
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([origin.lat, origin.lon], 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Limpiar TODAS las capas de ruta anteriores
    layersRef.current.forEach(layer => map.removeLayer(layer));
    layersRef.current = [];

    // Añadir marcador de origen
    const originMarker = L.marker([origin.lat, origin.lon], { icon: originIcon })
      .addTo(map)
      .bindPopup('<strong>Origen</strong>');
    markersRef.current.push(originMarker);

    // Añadir marcadores de paradas intermedias
    stops.forEach((stop, index) => {
      const icon = stopIcons[index] || stopIcon;
      const marker = L.marker([stop.lat, stop.lon], { icon })
        .addTo(map)
        .bindPopup(`<strong>Parada ${index + 1}</strong>`);
      markersRef.current.push(marker);
    });

    // Añadir marcador de destino
    const destMarker = L.marker([destination.lat, destination.lon], { icon: destIcon })
      .addTo(map)
      .bindPopup('<strong>Destino</strong>');
    markersRef.current.push(destMarker);

    // Variable para los bounds
    let bounds: L.LatLngBounds;

    // Dibujar ruta si hay geometría
    if (geometry) {
      const coords = decodePolyline(geometry);
      
      // Crear bounds desde TODOS los puntos de la ruta
      bounds = L.latLngBounds(coords);

      // Simplificar coordenadas para rutas muy largas
      const simplifiedCoords = coords.length > 500 
        ? coords.filter((_, i) => i % Math.ceil(coords.length / 500) === 0 || i === coords.length - 1)
        : coords;

      // 1. Sombra de la ruta
      const shadow = L.polyline(simplifiedCoords, {
        color: '#000',
        weight: 10,
        opacity: 0.3,
        smoothFactor: 1,
      }).addTo(map);
      layersRef.current.push(shadow);

      // 2. Borde oscuro
      const border = L.polyline(simplifiedCoords, {
        color: '#92400e',
        weight: 8,
        opacity: 0.5,
        smoothFactor: 1,
      }).addTo(map);
      layersRef.current.push(border);

      // 3. Línea amarilla principal
      const mainLine = L.polyline(simplifiedCoords, {
        color: '#fbbf24',
        weight: 5,
        opacity: 1,
        smoothFactor: 1,
      }).addTo(map);
      layersRef.current.push(mainLine);

    } else {
      // Sin geometría - dibujar línea recta punteada
      bounds = L.latLngBounds([
        [origin.lat, origin.lon],
        [destination.lat, destination.lon]
      ]);

      // Línea punteada para indicar ruta estimada
      const dottedLine = L.polyline([
        [origin.lat, origin.lon],
        [destination.lat, destination.lon]
      ], {
        color: '#fbbf24',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10',
      }).addTo(map);
      layersRef.current.push(dottedLine);
    }

    // Ajustar bounds
    map.fitBounds(bounds, { 
      padding: [30, 30],
      maxZoom: 14
    });

    // Invalidar tamaño para acordeones y móvil
    const timeouts: NodeJS.Timeout[] = [];
    
    timeouts.push(setTimeout(() => {
      map.invalidateSize();
      timeouts.push(setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }, 200));
    }, 100));

    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };

  }, [geometry, origin, destination, stops.map(s => `${s.lat},${s.lon}`).join(';')]);

  return <div ref={mapRef} className="w-full h-full" />;
}
