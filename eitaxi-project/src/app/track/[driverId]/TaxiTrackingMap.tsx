'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TaxiTrackingMapProps {
  latitude: number;
  longitude: number;
  heading?: number | null;
}

export default function TaxiTrackingMap({ latitude, longitude, heading }: TaxiTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Crear icono del taxi
  const taxiIcon = L.divIcon({
    html: `
      <div style="
        background: #facc15;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid #000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${heading || 0}deg);
        transition: transform 0.3s ease;
      ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2">
          <path d="M5 17h14v-5l-2-5H7l-2 5v5z"/>
          <circle cx="7.5" cy="17.5" r="1.5"/>
          <circle cx="16.5" cy="17.5" r="1.5"/>
          <path d="M5 12h14"/>
        </svg>
      </div>
    `,
    className: 'taxi-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  useEffect(() => {
    if (!mapRef.current) return;

    // Crear mapa si no existe
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([latitude, longitude], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapInstanceRef.current);

      // Añadir marcador inicial
      markerRef.current = L.marker([latitude, longitude], { icon: taxiIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<strong>Tu taxi está aquí</strong>');
    }

    const map = mapInstanceRef.current;

    // Actualizar posición del marcador
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      // Actualizar icono con nuevo heading
      if (heading !== null && heading !== undefined) {
        const newIcon = L.divIcon({
          html: `
            <div style="
              background: #facc15;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              border: 3px solid #000;
              box-shadow: 0 2px 10px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(${heading}deg);
              transition: transform 0.3s ease;
            ">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2">
                <path d="M5 17h14v-5l-2-5H7l-2 5v5z"/>
                <circle cx="7.5" cy="17.5" r="1.5"/>
                <circle cx="16.5" cy="17.5" r="1.5"/>
                <path d="M5 12h14"/>
              </svg>
            </div>
          `,
          className: 'taxi-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
        markerRef.current.setIcon(newIcon);
      }
    }

    // Centrar mapa en la nueva posición
    map.setView([latitude, longitude], map.getZoom());

    // Invalidar tamaño para asegurar renderizado correcto
    setTimeout(() => map.invalidateSize(), 100);

  }, [latitude, longitude, heading]);

  return <div ref={mapRef} className="w-full h-full" />;
}
