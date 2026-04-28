"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslations } from "next-intl";

// Icono del taxi
const taxiIcon = L.divIcon({
  html: `
    <div style="
      background: #fbbf24;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      transform-origin: center;
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-5.4a2 2 0 0 0-1.8-1.1H10.5A2 2 0 0 0 8.7 4.6L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    </div>
  `,
  className: "taxi-marker",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Icono del cliente (persona)
const clientIcon = L.divIcon({
  html: `
    <div style="
      background: #3b82f6;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  `,
  className: "client-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface TrackingMapProps {
  latitude: number;
  longitude: number;
  heading?: number | null;
  driverName?: string;
  clientLocation?: { latitude: number; longitude: number } | null;
}

export default function TrackingMap({
  latitude,
  longitude,
  heading,
  driverName,
  clientLocation,
}: TrackingMapProps) {
  const t = useTranslations();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const clientMarkerRef = useRef<L.Marker | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Crear mapa si no existe
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([latitude, longitude], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Actualizar o crear marcador del taxi
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      markerRef.current = L.marker([latitude, longitude], { icon: taxiIcon })
        .addTo(map)
        .bindPopup(`<strong>🚕 ${driverName || t('vehicleTypes.taxi')}</strong>`);
    }

    // Rotar el icono según heading
    if (heading !== null && heading !== undefined) {
      const icon = markerRef.current.getElement();
      if (icon) {
        icon.style.transform = `rotate(${heading}deg)`;
      }
    }

    // Actualizar o crear marcador del cliente
    if (clientLocation) {
      if (clientMarkerRef.current) {
        clientMarkerRef.current.setLatLng([clientLocation.latitude, clientLocation.longitude]);
      } else {
        clientMarkerRef.current = L.marker([clientLocation.latitude, clientLocation.longitude], { icon: clientIcon })
          .addTo(map)
          .bindPopup(`<strong>📍 ${t('geo.myLocation')}</strong>`);
      }

      // Dibujar línea entre cliente y taxi
      if (lineRef.current) {
        lineRef.current.setLatLngs([
          [clientLocation.latitude, clientLocation.longitude],
          [latitude, longitude],
        ]);
      } else {
        lineRef.current = L.polyline(
          [
            [clientLocation.latitude, clientLocation.longitude],
            [latitude, longitude],
          ],
          {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10',
          }
        ).addTo(map);
      }

      // Ajustar el zoom para mostrar ambos puntos
      const bounds = L.latLngBounds([
        [clientLocation.latitude, clientLocation.longitude],
        [latitude, longitude],
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
    } else {
      // Si no hay ubicación del cliente, centrar en el taxi
      map.setView([latitude, longitude], map.getZoom());
    }

    // Invalidar tamaño
    setTimeout(() => map.invalidateSize(), 100);
  }, [latitude, longitude, heading, driverName, clientLocation]);

  return <div ref={mapRef} className="absolute inset-0 w-full h-full" />;
}
