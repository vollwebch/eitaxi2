'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  heading?: number;
}

export default function LocationMap({ latitude, longitude, heading }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Crear mapa si no existe
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([latitude, longitude], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Crear icono con dirección
    const taxiIcon = L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid #fff;
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${heading || 0}deg);
          transition: transform 0.3s ease;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M12 2L12 22M12 2L6 8M12 2L18 8"/>
          </svg>
        </div>
      `,
      className: 'location-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    // Actualizar o crear marcador
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setIcon(taxiIcon);
    } else {
      markerRef.current = L.marker([latitude, longitude], { icon: taxiIcon })
        .addTo(map)
        .bindPopup('<strong>📍 Tu ubicación actual</strong>');
    }

    // Centrar mapa
    map.setView([latitude, longitude], map.getZoom());

    // Invalidar tamaño
    setTimeout(() => map.invalidateSize(), 100);

  }, [latitude, longitude, heading]);

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <div ref={mapRef} className="w-full h-48" />
    </div>
  );
}
