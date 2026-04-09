/**
 * Constantes compartidas entre Registro y Dashboard
 * Para mantener consistencia en todo el sistema
 */

// Opciones de servicios - IDs deben ser consistentes
export const SERVICE_OPTIONS = [
  { id: "airport", label: "Aeropuerto", description: "Traslados al aeropuerto" },
  { id: "city", label: "Ciudad", description: "Viajes dentro de la ciudad" },
  { id: "long_distance", label: "Larga distancia", description: "Viajes a otras ciudades" },
  { id: "limousine", label: "Limusina", description: "Servicio de limusina" },
  { id: "corporate", label: "Corporativo", description: "Servicio corporativo" },
  { id: "events", label: "Eventos", description: "Eventos y celebraciones" },
  { id: "delivery", label: "Entregas", description: "Entregas y mensajería" },
  { id: "night", label: "Nocturno", description: "Servicio nocturno" },
] as const;

// Opciones de idiomas
export const LANGUAGE_OPTIONS = [
  { id: "de", label: "Alemán", flag: "🇩🇪" },
  { id: "en", label: "Inglés", flag: "🇬🇧" },
  { id: "fr", label: "Francés", flag: "🇫🇷" },
  { id: "it", label: "Italiano", flag: "🇮🇹" },
  { id: "es", label: "Español", flag: "🇪🇸" },
  { id: "pt", label: "Portugués", flag: "🇵🇹" },
  { id: "ru", label: "Ruso", flag: "🇷🇺" },
  { id: "zh", label: "Chino", flag: "🇨🇳" },
] as const;

// Tipos de vehículo
export const VEHICLE_TYPES = [
  { id: "taxi", label: "Taxi", icon: "🚕", description: "Vehículo estándar" },
  { id: "limousine", label: "Limusina", icon: "🚗", description: "Servicio premium" },
  { id: "van", label: "Van / Minibus", icon: "🚐", description: "Grupos grandes" },
  { id: "premium", label: "Premium", icon: "✨", description: "Alta gama" },
] as const;
