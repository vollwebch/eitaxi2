'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Icono del taxi
const taxiIcon = L.divIcon({
  html: `
    <div style="
      background: #fbbf24;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      transform-origin: center;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-5.4a2 2 0 0 0-1.8-1.1H10.5A2 2 0 0 0 8.7 4.6L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    </div>
  `,
  className: 'taxi-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface LiveMapProps {
  latitude: number;
  longitude: number;
  heading?: number | null;
  driverName?: string;
}

export default function LiveMap({
  latitude,
  longitude,
  heading,
  driverName,
}: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Crear mapa si no existe
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
      }).setView([latitude, longitude], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Actualizar o crear marcador
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      markerRef.current = L.marker([latitude, longitude], { icon: taxiIcon })
        .addTo(map)
        .bindPopup(`<strong>${driverName || 'Taxi'}</strong>`);
    }

    // Rotar el icono según heading
    if (heading !== null && heading !== undefined) {
      const icon = markerRef.current.getElement();
      if (icon) {
        icon.style.transform = `rotate(${heading}deg)`;
      }
    }

    // Centrar mapa en la ubicación
    map.setView([latitude, longitude], map.getZoom());

    // Invalidar tamaño
    setTimeout(() => map.invalidateSize(), 100);

  }, [latitude, longitude, heading, driverName]);

  return <div ref={mapRef} className="w-full h-full" />;
}
