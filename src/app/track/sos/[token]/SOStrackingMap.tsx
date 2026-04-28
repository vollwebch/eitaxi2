"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// SOS pulsing icon
const sosIcon = L.divIcon({
  html: `
    <div style="position: relative; width: 50px; height: 50px;">
      <!-- Outer pulse ring -->
      <div style="
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: rgba(239, 68, 68, 0.2);
        animation: sos-ring-pulse 2s ease-out infinite;
      "></div>
      <!-- Inner circle -->
      <div style="
        position: absolute;
        inset: 8px;
        border-radius: 50%;
        background: #ef4444;
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(239, 68, 68, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 9v4"/>
          <path d="M12 17h.01"/>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        </svg>
      </div>
      <style>
        @keyframes sos-ring-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      </style>
    </div>
  `,
  className: "sos-marker",
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

interface SOStrackingMapProps {
  latitude: number;
  longitude: number;
  clientName?: string;
}

export default function SOStrackingMap({
  latitude,
  longitude,
  clientName,
}: SOStrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([latitude, longitude], 17);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapInstanceRef.current);

      // Add marker
      markerRef.current = L.marker([latitude, longitude], { icon: sosIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<strong>SOS - ${clientName || "Persona"}</strong>`);
    } else {
      const map = mapInstanceRef.current;

      // Update marker position
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      }

      // Smooth pan to new position
      map.panTo([latitude, longitude], { animate: true, duration: 1 });
    }

    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 100);
  }, [latitude, longitude, clientName]);

  return <div ref={mapRef} className="absolute inset-0 w-full h-full" />;
}
