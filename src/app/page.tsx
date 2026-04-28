"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  Search,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  Award,
  ChevronDown,
  Car,
  Menu,
  ArrowRight,
  Shield,
  Zap,
  Users,
  Route,
  Plane,
  Building2,
  Calendar,
  Navigation,
  ArrowLeftRight,
  X,
  Locate,
  Fuel,
  Heart,
  History,
  Crosshair,
  Loader2,
  Map as MapIcon,
  Clock3,
  Banknote,
  Radio,
  Download,
  Smartphone,
  CalendarPlus,
  User,
  Plus,
  CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import BookingModal from "@/components/BookingModal";
import DirectChatDialog from "@/components/DirectChatDialog";
import { useTranslations } from 'next-intl';
import { checkDriverAvailability } from '@/lib/schedule-check';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// Leaflet CSS - solo en cliente
if (typeof window !== 'undefined') {
  // @ts-ignore - CSS import handled by webpack
  import('leaflet/dist/leaflet.css');
}

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

// Mapa con ruta - componente dinámico (solo cliente)
const RouteMap = dynamic(() => import('./RouteMap').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted">
      <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
    </div>
  )
});

// Types
interface City {
  id: string;
  name: string;
  slug: string;
}

interface Canton {
  id: string;
  name: string;
  code: string;
  slug: string;
  cities: City[];
  _count?: { drivers: number };
}

interface TaxiDriver {
  id: string;
  name: string;
  slug: string;
  phone: string;
  whatsapp: string | null;
  experience: number;
  description: string | null;
  imageUrl: string | null;
  vehicleType: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  isAvailable24h: boolean;
  services: string[];
  languages: string[];
  subscription: string;
  isVerified: boolean;
  isTopRated: boolean;
  rating: number;
  city: City;
  canton: Canton;
  basePrice?: number | null;
  pricePerKm?: number | null;
  hourlyRate?: number | null;
  trackingEnabled?: boolean;
  trackingMode?: string;
  lastLocationAt?: string | null;
  workingHours?: Array<{ dayOfWeek: number; mode: string; slots: Array<{ startTime: string; endTime: string }> }>;
  _distance?: number;
  _coverageReason?: string;
  _estimatedPrice?: { minPrice: number; maxPrice: number };
  _tripDistance?: number;
  _marker?: string;  // "⭐ Cerca de ti", "📍 En tu zona", "🚕 Disponible cerca"
  _priority?: number;  // 3 = ambos bloques, 2 = bloque A, 1 = bloque B
  _block?: 'A' | 'B' | 'BOTH';  // Tipo de coincidencia
  _directionType?: 'roundTrip' | 'oneWay';  // Ida y vuelta o solo ida
  _isFavorite?: boolean;  // Si el conductor es favorito del cliente
  _favoriteCount?: number;  // Número total de favoritos del conductor
}

// Service config - dynamic with translations
function getServiceConfig(t: (key: string) => string): Record<string, { icon: typeof Car; label: string }> {
  return {
    airport: { icon: Plane, label: t('airport') },
    city: { icon: Building2, label: t('city') },
    long_distance: { icon: Route, label: t('long_distance') },
    limousine: { icon: Car, label: t('limousine') },
    corporate: { icon: Shield, label: t('corporate') },
    events: { icon: Calendar, label: t('events') },
  };
}

// Vehicle type config - dynamic with translations
function getVehicleTypeConfig(t: (key: string) => string): Record<string, { label: string; icon: string }> {
  return {
    taxi: { label: t('taxi'), icon: "🚕" },
    limousine: { label: t('limousine'), icon: "🚗" },
    van: { label: t('van'), icon: "🚐" },
    premium: { label: t('premium'), icon: "✨" },
  };
}

// Quick POIs config - dynamic with translations
function getQuickPOIs(t: (key: string, vars?: Record<string, string>) => string) {
  return [
    { id: 'gas', icon: Fuel, label: t('gas_station'), type: 'gas' },
    { id: 'pharmacy', icon: '💊', label: t('pharmacy'), type: 'pharmacy' },
    { id: 'hospital', icon: '🏥', label: t('hospital'), type: 'hospital' },
    { id: 'train', icon: '🚂', label: t('train_station'), type: 'train' },
  ];
}

// ============================================
// LOCALSTORAGE HELPERS
// ============================================

const HISTORY_KEY = 'eitaxi_history';
const FAVORITES_KEY = 'eitaxi_favorites';
const MAX_HISTORY = 10;

function getHistory(): LocationSuggestion[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function addToHistory(location: LocationSuggestion) {
  if (typeof window === 'undefined') return;
  const history = getHistory().filter(h => h.id !== location.id);
  history.unshift(location);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function getFavorites(): LocationSuggestion[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function toggleFavorite(location: LocationSuggestion): boolean {
  if (typeof window === 'undefined') return false;
  const favorites = getFavorites();
  const exists = favorites.some(f => f.id === location.id);
  if (exists) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.filter(f => f.id !== location.id)));
    return false;
  } else {
    favorites.unshift(location);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.slice(0, 20)));
    return true;
  }
}

function isFavorite(id: string): boolean {
  return getFavorites().some(f => f.id === id);
}

// ============================================
// HEADER COMPONENT
// ============================================
function Header({
  cantons,
  onCantonSelect,
  onMobileMenuOpen,
}: {
  cantons: Canton[];
  onCantonSelect: (canton: Canton) => void;
  onMobileMenuOpen: () => void;
}) {
  const t = useTranslations('header');
  const tCommon = useTranslations('common');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500">
              <Car className="h-6 w-6 text-black" />
            </div>
            <span className="text-xl font-bold">
              <span className="text-yellow-400">ei</span>
              <span className="text-white">taxi</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1">
                  {t('cantons')} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
                {cantons.length > 0 ? cantons.map((canton) => (
                  <DropdownMenuItem
                    key={canton.id}
                    onClick={() => onCantonSelect(canton)}
                    className="flex items-center justify-between"
                  >
                    <span>{canton.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {canton._count?.drivers || 0}
                    </Badge>
                  </DropdownMenuItem>
                )) : (
                  <DropdownMenuItem disabled>{tCommon('loading')}</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mi reserva - seguimiento público */}
            <Link href="/seguimiento" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-sm gap-1">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">{t('tracking')}</span>
              </Button>
            </Link>
            {/* Iniciar sesion - login unificado */}
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm gap-1">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t('loginButton')}</span>
              </Button>
            </Link>
            {/* Ser conductor visible en sm+ */}
            <Link href="/registrarse" className="hidden sm:block">
              <Button
                variant="outline"
                size="sm"
                className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
              >
                <Car className="mr-2 h-4 w-4" />
                {t('register')}
              </Button>
            </Link>
            {/* Language Switcher */}
            <LanguageSwitcher />
            {/* Menú hamburguesa en móvil */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onMobileMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Location suggestion type
interface LocationSuggestion {
  id: string;
  name: string;
  type: string;
  typeName?: string;
  icon?: string;
  cantonName?: string;
  cityName?: string;
  city?: string | null;
  state?: string | null;
  street?: string | null;
  housenumber?: string | null;
  postcode?: string | null;
  poiName?: string | null;
  fullAddress?: string;
  shortAddress?: string;
  code?: string;
  country?: string;
  postalCode?: string;
  lat?: number;
  lon?: number;
  lng?: number;
}

// ============================================
// LOCATION INPUT COMPONENT
// ============================================
function LocationInput({
  placeholder,
  value,
  onChange,
  onSelect,
  icon: Icon,
  showHistoryAndFavorites = false,
  selectedSuggestion,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: LocationSuggestion) => void;
  icon: typeof MapPin;
  showHistoryAndFavorites?: boolean;
  selectedSuggestion?: LocationSuggestion | null;
}) {
  const tSearch = useTranslations('search');
  const tGeo = useTranslations('geo');
  const tCommon = useTranslations('common');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [favSuggestions, setFavSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showGeoConsent, setShowGeoConsent] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if current selection is favorite
  useEffect(() => {
    if (suggestions.length > 0 && suggestions.find(s => s.id === value)) {
      setIsFav(isFavorite(value));
    }
  }, [value, suggestions]);

  useEffect(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    // Si ya hay una selección restaurada con coordenadas, no buscar sugerencias
    if (selectedSuggestion?.lat && selectedSuggestion?.lon) {
      setShowSuggestions(false);
      setSuggestions([]);
      setFavSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (value.trim().length >= 2) {
        setLoading(true);
        setFromCache(false);

        // Parallel search: favorites from DB + geocoding
        const [favRes, geoRes] = await Promise.allSettled([
          fetch(`/api/addresses/suggestions?q=${encodeURIComponent(value.trim())}`).then(r => r.json()),
          fetch(`/api/locations?q=${encodeURIComponent(value.trim())}`).then(r => r.json()),
        ]);

        // Process favorites from DB
        if (favRes.status === 'fulfilled' && favRes.value?.success && Array.isArray(favRes.value.data)) {
          setFavSuggestions(favRes.value.data);
        } else {
          setFavSuggestions([]);
        }

        // Process geocoding results
        if (geoRes.status === 'fulfilled' && geoRes.value?.success) {
          const results = Array.isArray(geoRes.value.data) ? geoRes.value.data : (geoRes.value.data?.combined || []);
          setSuggestions(results);
          setFromCache(geoRes.value.fromCache || false);
          setShowSuggestions(true);

          // Si Photon tardó y tuvimos pocos resultados, refrescar después de 5s
          if (!geoRes.value.fromCache && results.length <= 2) {
            setTimeout(async () => {
              try {
                const refetch = await fetch(`/api/locations?q=${encodeURIComponent(value.trim())}`);
                const refetchData = await refetch.json();
                if (refetchData.success && refetchData.data.length > results.length) {
                  setSuggestions(refetchData.data);
                  setFromCache(refetchData.fromCache || false);
                  setShowSuggestions(true);
                }
              } catch {}
            }, 5000);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(true);
        }

        setLoading(false);
      } else {
        setSuggestions([]);
        setFavSuggestions([]);
        setShowSuggestions(false);
      }
    }, 150);

    return () => { clearTimeout(timeoutId); };
  }, [value, selectedSuggestion]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (suggestion: LocationSuggestion) => {
    isSelectingRef.current = true;

    let displayValue = suggestion.shortAddress || suggestion.fullAddress || suggestion.name;

    if (suggestion.poiName) {
      displayValue = suggestion.shortAddress || suggestion.poiName;
    }

    if (!displayValue) {
      if (suggestion.type === 'canton') {
        displayValue = suggestion.name;
      } else if (suggestion.street) {
        displayValue = suggestion.housenumber
          ? `${suggestion.street} ${suggestion.housenumber}`
          : suggestion.street;
        const cityName = suggestion.city || suggestion.cityName;
        if (cityName) displayValue += `, ${cityName}`;
      } else if (suggestion.city || suggestion.cityName) {
        const cityName = suggestion.city || suggestion.cityName;
        const stateName = suggestion.state || suggestion.cantonName;
        displayValue = stateName ? `${suggestion.name}, ${stateName}` : suggestion.name;
      } else {
        displayValue = suggestion.name;
      }
    }

    onChange(displayValue);
    setShowSuggestions(false);
    setSuggestions([]);
    setFavSuggestions([]);
    addToHistory(suggestion);
    onSelect(suggestion);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(tGeo('notSupported'));
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`/api/reverse?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          
          if (data.success) {
            const suggestion: LocationSuggestion = {
              id: `geo-${Date.now()}`,
              name: data.name || tGeo('myLocation'),
              type: 'address',
              lat: latitude,
              lon: longitude,
              fullAddress: data.fullAddress,
              shortAddress: data.shortAddress || data.name,
              city: data.city,
              state: data.state,
              postcode: data.postcode,
              street: data.street,
              housenumber: data.housenumber,
            };
            handleSelect(suggestion);
          } else {
            // Mostrar error de la API
            alert(data.error || tGeo('addressError'));
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          alert(tGeo('addressErrorGeneric'));
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = tGeo('locationError');
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = tGeo('permissionDenied');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = tGeo('positionUnavailable');
        } else if (error.code === error.TIMEOUT) {
          errorMsg = tGeo('timeout');
        }
        alert(errorMsg);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const history = getHistory();
  const favorites = getFavorites();

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (value.trim().length >= 2 && (suggestions.length > 0 || favSuggestions.length > 0)) {
              setShowSuggestions(true);
            } else if (showHistoryAndFavorites && (history.length > 0 || favorites.length > 0)) {
              setShowSuggestions(true);
            }
          }}
          className="pl-12 pr-20 h-14 text-lg bg-card border-border focus:border-yellow-400 focus:ring-yellow-400/20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {fromCache && (
            <span className="text-xs text-yellow-400 mr-1" title={tGeo('fromCache')}>📦</span>
          )}
          {loading && !geoLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {value && !geoLoading && (
            <button
              onClick={() => {
                onChange('');
                onSelect({ id: '', name: '', type: 'city' });
              }}
              className="p-1 hover:bg-muted rounded-full"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => setShowGeoConsent(true)}
            disabled={geoLoading}
            className={`p-2 rounded-full transition-colors ${
              geoLoading 
                ? 'bg-yellow-400/20 animate-pulse' 
                : 'hover:bg-yellow-400/10'
            }`}
            title={tGeo('useMyLocation')}
          >
            {geoLoading ? (
              <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4 text-yellow-400" />
            )}
          </button>
        </div>
      </div>

      {/* Geo Consent Dialog */}
      {showGeoConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 mx-4 max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center">
                <Crosshair className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{tGeo('title')}</h3>
                <p className="text-sm text-muted-foreground">{tGeo('permissionLabel')}</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              {tGeo('consentText')}
            </p>
            
            <ul className="text-sm space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>{tGeo('description1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Navigation className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>{tGeo('description2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>{tGeo('description3')}</span>
              </li>
            </ul>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowGeoConsent(false)}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500"
                onClick={() => {
                  setShowGeoConsent(false);
                  handleGetCurrentLocation();
                }}
              >
                <Crosshair className="mr-2 h-4 w-4" />
                {tGeo('allow')}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              {tGeo('privacyNote')}
            </p>
          </div>
        </div>
      )}

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-30 max-h-72 overflow-y-auto">
          {/* Show history and favorites when input is empty or short */}
          {value.trim().length < 2 && showHistoryAndFavorites && (history.length > 0 || favorites.length > 0) && (
            <>
              {favorites.length > 0 && (
                <div className="border-b border-border">
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {tSearch('favorites')}
                  </div>
                  {favorites.slice(0, 5).map((item) => (
                    <button
                      key={`fav-${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-yellow-400/10 transition-colors text-left"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Heart className="h-4 w-4 text-red-400 fill-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {item.shortAddress || item.fullAddress || item.city || item.state}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {history.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <History className="h-3 w-3" /> {tSearch('recent')}
                  </div>
                  {history.slice(0, 5).map((item) => (
                    <button
                      key={`hist-${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-yellow-400/10 transition-colors text-left"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Clock3 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {item.shortAddress || item.fullAddress || item.city || item.state}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Saved addresses from DB (favorites) */}
          {favSuggestions.length > 0 && (
            <div className="border-b border-border">
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-400" /> {tSearch('savedAddresses')}
              </div>
              {favSuggestions.map((item, idx) => (
                <button
                  key={`dbfav-${item.id}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-yellow-400/10 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-red-400 fill-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {item.shortAddress || item.fullAddress}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Search results from geocoding */}
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin h-5 w-5 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
              {tSearch('placeholder')}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion, index) => {
                const getIconDisplay = () => {
                  if (suggestion.icon) {
                    return <span className="text-lg">{suggestion.icon}</span>;
                  }
                  if (suggestion.type === 'canton') {
                    return <MapPin className="h-4 w-4 text-yellow-400" />;
                  }
                  return <Building2 className="h-4 w-4 text-yellow-400" />;
                };

                const getSubtitle = () => {
                  if (suggestion.fullAddress) {
                    return suggestion.fullAddress;
                  }
                  if (suggestion.shortAddress) {
                    return suggestion.shortAddress;
                  }
                  if (suggestion.type === 'canton') {
                    return `${suggestion.country === 'LI' ? '🇱🇮 Liechtenstein' : '🇨🇭 ' + tSearch('canton')}${suggestion.code ? ` (${suggestion.code})` : ''}`;
                  }
                  const cityName = suggestion.city || suggestion.cityName;
                  const stateName = suggestion.state || suggestion.cantonName;
                  if (suggestion.typeName) {
                    return `${suggestion.typeName}${cityName ? ` · ${cityName}` : ''}${stateName ? ` · ${stateName}` : ''}`;
                  }
                  return `${cityName || tSearch('switzerland')}${stateName ? ` · ${stateName}` : ''}`;
                };

                return (
                  <button
                    key={`${suggestion.type}-${suggestion.id}-${index}-${suggestion.lat || ''}-${suggestion.lon || ''}`}
                    type="button"
                    onClick={() => handleSelect(suggestion)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-yellow-400/10 transition-colors text-left"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
                      {getIconDisplay()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{suggestion.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {getSubtitle()}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : value.trim().length >= 2 ? (
            <div className="p-4 text-center text-muted-foreground">
              {tSearch('noResults')}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ============================================
// STOP SUGGESTIONS COMPONENT (for intermediate stops)
// ============================================
function StopSuggestions({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (suggestion: LocationSuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/locations?q=${encodeURIComponent(query.trim())}`, { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        if (data.success) {
          const results = Array.isArray(data.data) ? data.data : (data.data.combined || []);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!showSuggestions && !loading) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-30 max-h-56 overflow-y-auto" ref={containerRef}>
      {loading ? (
        <div className="p-3 text-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="py-1">
          {suggestions.slice(0, 5).map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.id}-${index}`}
              type="button"
              onClick={() => {
                let displayValue = suggestion.shortAddress || suggestion.fullAddress || suggestion.name;
                if (suggestion.poiName) displayValue = suggestion.shortAddress || suggestion.poiName;
                onSelect(suggestion);
                setShowSuggestions(false);
              }}
              className="w-full px-3 py-2 flex items-center gap-2 hover:bg-blue-400/10 transition-colors text-left"
            >
              <CircleDot className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{suggestion.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {suggestion.shortAddress || suggestion.fullAddress || suggestion.city}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// HERO SECTION
// ============================================
export interface StopData {
  suggestion: LocationSuggestion;
  text: string;
}

interface TripSearchData {
  origin: LocationSuggestion | null;
  destination: LocationSuggestion | null;
  originText: string;
  destinationText: string;
  routeInfo?: RouteInfo | null;
  stops?: StopData[];
}

interface RouteInfo {
  distance: number;
  duration: number;
  durationFormatted: string;
  geometry?: string; // polyline encoded
}

function HeroSection({
  onSearch,
  initialOriginText: initOriginText,
  initialDestinationText: initDestText,
  initOrigin,
  initDestination,
  initRouteInfo,
}: {
  onSearch: (data: TripSearchData) => void;
  initialOriginText?: string;
  initialDestinationText?: string;
  initOrigin?: LocationSuggestion | null;
  initDestination?: LocationSuggestion | null;
  initRouteInfo?: RouteInfo | null;
}) {
  const tHero = useTranslations('hero');
  const tRoute = useTranslations('route');
  const tStats = useTranslations('stats');
  const tLoc = useTranslations('locationTypes');
  const tRouteMap = useTranslations('routeMap');
  const tCommon = useTranslations('common');

  const [originText, setOriginText] = useState(initOriginText || "");
  const [destinationText, setDestinationText] = useState(initDestText || "");
  const [origin, setOrigin] = useState<LocationSuggestion | null>(initOrigin || null);
  const [destination, setDestination] = useState<LocationSuggestion | null>(initDestination || null);
  const [stops, setStops] = useState<StopData[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(initRouteInfo || null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const quickPOIs = getQuickPOIs(tLoc);
  const autoSearchRef = useRef(false);

  // Sincronizar props restauradas (después de useEffect del padre)
  useEffect(() => {
    if (initOriginText && initOriginText !== originText) setOriginText(initOriginText);
    if (initDestText && initDestText !== destinationText) setDestinationText(initDestText);
    // Restaurar objetos de ubicación y ruta para auto-search
    if (initOrigin && !origin) setOrigin(initOrigin);
    if (initDestination && !destination) setDestination(initDestination);
    if (initRouteInfo && !routeInfo) {
      setRouteInfo(initRouteInfo);
      // Resetear autoSearchRef para que el auto-search se dispare con datos restaurados
      autoSearchRef.current = false;
    }
  }, [initOriginText, initDestText, initOrigin, initDestination, initRouteInfo]);

  // Calcular ruta automáticamente (saltar si ya hay routeInfo restaurado)
  useEffect(() => {
    let cancelled = false;
    
    const calculateRoute = async () => {
      // Si ya tenemos routeInfo restaurado y las coordenadas coinciden, no recalcular
      if (routeInfo?.geometry && initRouteInfo?.geometry && !loadingRoute) return;
      if (origin?.lat && origin?.lon && destination?.lat && destination?.lon) {
        setLoadingRoute(true);
        setRouteError(null);
        
        try {
          // Build waypoints param from stops
          const allStopsReady = stops.every(s => s.suggestion.lat && s.suggestion.lon);
          let url = `/api/route?fromLat=${origin.lat}&fromLon=${origin.lon}&toLat=${destination.lat}&toLon=${destination.lon}`;
          if (allStopsReady && stops.length > 0) {
            const wpStr = stops.map(s => `${s.suggestion.lat},${s.suggestion.lon}`).join(';');
            url += `&waypoints=${wpStr}`;
          }
          
          const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
          const result = await res.json();
          
          if (cancelled) return;
          
          if (result.success && result.data?.geometry) {
            setRouteInfo(result.data);
            setRouteError(null);
          } else {
            setRouteError(result.error || tRoute('calcError'));
            setRouteInfo(null);
          }
        } catch (e) {
          if (cancelled) return;
          setRouteError(tRoute('connectionError'));
          setRouteInfo(null);
        } finally {
          if (!cancelled) setLoadingRoute(false);
        }
      } else {
        setRouteInfo(null);
        setRouteError(null);
        setLoadingRoute(false);
      }
    };

    calculateRoute();
    
    return () => { cancelled = true; };
  }, [origin?.lat, origin?.lon, destination?.lat, destination?.lon, stops.map(s => `${s.suggestion.lat},${s.suggestion.lon}`).join(';')]);

  const handleSwap = () => {
    const tempText = originText;
    const tempLocation = origin;
    setOriginText(destinationText);
    setOrigin(destination);
    setDestinationText(tempText);
    setDestination(tempLocation);
  };

  const handleSearch = () => {
    if (originText.trim() || destinationText.trim()) {
      onSearch({
        origin,
        destination,
        originText: originText.trim(),
        destinationText: destinationText.trim(),
        routeInfo,
        stops: stops.length > 0 ? stops : undefined,
      });
    }
  };

  const addStop = () => {
    if (stops.length >= 3) return;
    setStops([...stops, { suggestion: { id: '', name: '', type: 'address' }, text: '' }]);
  };

  const removeStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const updateStopText = (index: number, text: string) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], text };
    setStops(newStops);
  };

  const updateStopSuggestion = (index: number, suggestion: LocationSuggestion) => {
    const newStops = [...stops];
    let displayValue = suggestion.shortAddress || suggestion.fullAddress || suggestion.name || suggestion.street || suggestion.name;
    if (suggestion.poiName) displayValue = suggestion.shortAddress || suggestion.poiName;
    newStops[index] = { suggestion, text: displayValue };
    setStops(newStops);
  };

  // Auto-buscar cuando ambos campos tengan coordenadas y la ruta esté calculada
  useEffect(() => {
    if (autoSearchRef.current) return;
    // Solo auto-buscar si tenemos texto en ambos, coordenadas en ambos, y ruta calculada
    if (
      originText.trim() && destinationText.trim() &&
      origin?.lat && origin?.lon &&
      destination?.lat && destination?.lon &&
      routeInfo?.geometry && !loadingRoute
    ) {
      autoSearchRef.current = true;
      onSearch({
        origin,
        destination,
        originText: originText.trim(),
        destinationText: destinationText.trim(),
        routeInfo,
        stops: stops.length > 0 ? stops : undefined,
      });
    }
  }, [origin?.lat, origin?.lon, destination?.lat, destination?.lon, routeInfo?.geometry, loadingRoute, stops.every(s => !!s.suggestion.lat)]);

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-yellow-400/10" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="outline"
            className="mb-6 border-yellow-400/30 bg-yellow-400/10 text-yellow-400"
          >
            <Zap className="mr-1 h-3 w-3" />
            {tHero('badge')}
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {tHero('title', { country: '' })} <span className="text-yellow-400">{tHero('titleHighlight')}</span>
            <br />
            {tHero('subtitleContinuation')}
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            {tHero('subtitle')}
          </p>

          {/* From/To Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-xl">
              <div className="space-y-3">
                {/* Origin */}
                <LocationInput
                  placeholder={tHero('originPlaceholder')}
                  value={originText}
                  onChange={setOriginText}
                  onSelect={(s) => {
                    setOrigin(s);
                  }}
                  icon={Navigation}
                  showHistoryAndFavorites={true}
                  selectedSuggestion={origin}
                />

                {/* Swap Button */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={handleSwap}
                    className="p-2 rounded-full bg-yellow-400/10 hover:bg-yellow-400/20 transition-colors"
                    title={tHero('swapTooltip')}
                  >
                    <ArrowLeftRight className="h-5 w-5 text-yellow-400" />
                  </button>
                </div>

                {/* Intermediate Stops */}
                {stops.map((stop, index) => (
                  <div key={`stop-${index}`} className="relative">
                    <div className="flex items-center gap-2">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-blue-400">{index + 1}</span>
                      </div>
                      <div className="flex-1 relative">
                        <Input
                          type="text"
                          placeholder={tHero('stopPlaceholder') + ` (${index + 1})`}
                          value={stop.text}
                          onChange={(e) => updateStopText(index, e.target.value)}
                          className="pl-12 pr-10 h-12 text-base bg-card border-border focus:border-blue-400 focus:ring-blue-400/20"
                        />
                        <button
                          type="button"
                          onClick={() => removeStop(index)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-red-500/10 rounded-full transition-colors"
                          title={tHero('removeStop')}
                        >
                          <X className="h-4 w-4 text-muted-foreground hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                    {/* Inline suggestions for stop */}
                    <StopSuggestions
                      query={stop.text}
                      onSelect={(suggestion) => updateStopSuggestion(index, suggestion)}
                    />
                  </div>
                ))}

                {/* Add Stop Button */}
                {stops.length < 3 && (
                  <button
                    type="button"
                    onClick={addStop}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-border hover:border-blue-400/50 hover:bg-blue-400/5 transition-colors text-sm text-muted-foreground hover:text-blue-400"
                  >
                    <Plus className="h-4 w-4" />
                    {tHero('addStop')}
                  </button>
                )}

                {/* Destination */}
                <LocationInput
                  placeholder={tHero('destinationPlaceholder')}
                  value={destinationText}
                  onChange={setDestinationText}
                  onSelect={(s) => {
                    setDestination(s);
                  }}
                  icon={MapPin}
                  selectedSuggestion={destination}
                />
              </div>

              {/* Route Info */}
              {loadingRoute && (
                <div className="mt-4 p-3 bg-yellow-400/10 rounded-lg flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                  <span className="text-sm">{tRoute('calculating')}</span>
                </div>
              )}

              {routeError && !loadingRoute && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center gap-2">
                  <span className="text-sm text-red-400">{routeError}</span>
                </div>
              )}

              {routeInfo && !loadingRoute && routeInfo.geometry && (
                <div className="mt-4 border border-border rounded-lg overflow-hidden bg-card">
                  {/* Main table */}
                  <div className="grid grid-cols-3 divide-x divide-border">
                    {/* Distance */}
                    <div className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {routeInfo.distance}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {tRoute('kmEstimated')}
                      </div>
                    </div>
                    {/* Duration */}
                    <div className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {routeInfo.duration}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {tRoute('minApprox')}
                      </div>
                    </div>
                    {/* Price - rango amplio para estimación general */}
                    <div className="p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {(() => {
                          const basePrice = 8 + (routeInfo.distance * 3.2);
                          const minPrice = Math.round(basePrice * 0.9); // -10%
                          const maxPrice = Math.round(basePrice * 1.3); // +30%
                          return `${minPrice}-${maxPrice}`;
                        })()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {tRoute('chfEstimated')}
                      </div>
                    </div>
                  </div>
                  {/* Disclaimer */}
                  <div className="px-4 py-2 bg-muted/30 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {tRoute('priceNote')}
                    </p>
                  </div>
                </div>
              )}

              {/* Mini Map Accordion - Solo si hay geometría */}
              {routeInfo?.geometry && origin?.lat && origin?.lon && destination?.lat && destination?.lon && (
                <div className="mt-4 border border-border rounded-lg overflow-hidden">
                  {/* Accordion Header */}
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium">{tRouteMap('viewRouteMap')}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showMap ? 'rotate-180' : ''}`} />
                  </button>
                  {/* Accordion Content */}
                  {showMap && (
                    <div className="relative h-64 bg-muted">
                      <RouteMap
                        geometry={routeInfo.geometry}
                        origin={{ lat: origin.lat, lon: origin.lon }}
                        destination={{ lat: destination.lat, lon: destination.lon }}
                        stops={stops.filter(s => s.suggestion.lat && s.suggestion.lon).map(s => ({ lat: s.suggestion.lat!, lon: s.suggestion.lon! }))}
                      />
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <a
                          href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin.lat},${origin.lon}${stops.filter(s => s.suggestion.lat && s.suggestion.lon).map(s => `;${s.suggestion.lat},${s.suggestion.lon}`).join('')};${destination.lat},${destination.lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-background/90 rounded text-xs hover:bg-background"
                        >
                          <MapIcon className="h-3 w-3" />
                          {tRouteMap('openInOSM')}
                        </a>
                      </div>
                      {/* Leyenda */}
                      <div className="absolute top-2 left-2 flex gap-3 px-2 py-1 bg-background/80 rounded text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>{tRouteMap('origin')}</span>
                        </div>
                        {stops.length > 0 && stops.filter(s => s.suggestion.lat).map((s, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span>{tRouteMap('stop', { number: i + 1 })}</span>
                          </div>
                        ))}
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>{tRouteMap('dest')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Search Button */}
              <Button
                className="w-full mt-4 h-14 text-lg bg-yellow-400 text-black hover:bg-yellow-500"
                onClick={handleSearch}
                disabled={!originText.trim() && !destinationText.trim()}
              >
                <Search className="mr-2 h-5 w-5" />
                {tHero('searchButton')}
              </Button>

              {/* Quick Options */}
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-yellow-400/10"
                  onClick={() => {
                    setOriginText('Aeropuerto de Zúrich');
                    setOrigin({
                      id: 'airport-zurich',
                      name: 'Aeropuerto de Zúrich',
                      type: 'poi',
                      lat: 47.4647,
                      lon: 8.5492,
                      cantonName: 'Zürich'
                    });
                  }}
                >
                  <Plane className="mr-1 h-3 w-3" /> {tHero('fromAirport')}
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-yellow-400/10"
                  onClick={() => {
                    setDestinationText('Aeropuerto de Zúrich');
                    setDestination({
                      id: 'airport-zurich',
                      name: 'Aeropuerto de Zúrich',
                      type: 'poi',
                      lat: 47.4647,
                      lon: 8.5492,
                      cantonName: 'Zürich'
                    });
                  }}
                >
                  <Plane className="mr-1 h-3 w-3" /> {tHero('toAirport')}
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-yellow-400/10"
                  onClick={() => {
                    setOriginText('Vaduz');
                    setOrigin({
                      id: 'vaduz-li',
                      name: 'Vaduz',
                      type: 'city',
                      cantonName: 'Liechtenstein',
                      country: 'LI',
                      lat: 47.1410,
                      lon: 9.5215
                    });
                  }}
                >
                  🇱🇮 {tHero('liechtenstein')}
                </Badge>
              </div>

              {/* Quick POIs */}
              <div className="flex flex-wrap gap-2 mt-3 justify-center border-t border-border pt-3">
                <span className="text-xs text-muted-foreground w-full mb-1">{tCommon('nearby')}</span>
                {quickPOIs.map((poi) => (
                  <Badge
                    key={poi.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-yellow-400/10"
                  >
                    {typeof poi.icon === 'string' ? (
                      <span className="mr-1">{poi.icon}</span>
                    ) : (
                      <poi.icon className="mr-1 h-3 w-3" />
                    )}
                    {poi.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-2xl mx-auto">
            {[
              { value: "500+", label: tStats('drivers'), icon: Users },
              { value: "24/7", label: tStats('availability'), icon: Clock },
              { value: "100%", label: tStats('verified'), icon: Shield },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// TAXI CARD
// ============================================
function TaxiCard({
  driver,
  tripInfo,
  onBook,
  onChat,
  toggleFavorite,
}: {
  driver: TaxiDriver;
  tripInfo?: { distance: number; duration: number; durationFormatted: string; from: string; to: string };
  onBook?: () => void;
  onChat?: () => void;
  toggleFavorite: (driverId: string) => void;
}) {
  const tCommon = useTranslations('common');
  const tDrivers = useTranslations('drivers');
  const tServices = useTranslations('services');
  const tVehicles = useTranslations('vehicleTypes');
  const tRoute = useTranslations('route');

  const serviceConfig = getServiceConfig(tServices);
  const vehicleTypeConfig = getVehicleTypeConfig(tVehicles);

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `tel:${driver.phone}`;
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const phone = driver.whatsapp || driver.phone;
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank");
  };

  const handleBook = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBook?.();
  };

  const handleChat = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChat?.();
  };

  const vehicleInfo = vehicleTypeConfig[driver.vehicleType] || vehicleTypeConfig.taxi;
  const profileUrl = `/${driver.canton.slug}/${driver.city.slug}/${driver.slug}`;

  // Calculate estimated price based on driver's specific rates
  // Siempre devuelve un rango con ~10% de margen
  const getEstimatedPrice = () => {
    if (!tripInfo) return driver._estimatedPrice;

    const distance = tripInfo.distance;
    let calculatedPrice: number;

    // Si el conductor tiene precios definidos, usarlos
    if (driver.basePrice !== null && driver.basePrice !== undefined && 
        driver.pricePerKm !== null && driver.pricePerKm !== undefined) {
      // El conductor tiene ambos precios definidos
      calculatedPrice = driver.basePrice + (distance * driver.pricePerKm);
    }
    // Si el conductor solo tiene precio por km
    else if (driver.pricePerKm !== null && driver.pricePerKm !== undefined) {
      const defaultBase = 8; // Precio base por defecto en Suiza
      calculatedPrice = defaultBase + (distance * driver.pricePerKm);
    }
    // Si el conductor solo tiene precio base
    else if (driver.basePrice !== null && driver.basePrice !== undefined) {
      const defaultPerKm = 3.2; // Precio por km por defecto en Suiza
      calculatedPrice = driver.basePrice + (distance * defaultPerKm);
    }
    // Si ya viene calculado de la API
    else if (driver._estimatedPrice) {
      return driver._estimatedPrice;
    }
    // Valores por defecto de Suiza (tarifa estándar)
    else {
      calculatedPrice = 8 + (distance * 3.2);
    }

    // Aplicar rango con ~10% de margen
    const minPrice = Math.round(calculatedPrice);
    const maxPrice = Math.round(calculatedPrice * 1.1);
    return { min: minPrice, max: maxPrice };
  };

  const estimatedPrice = getEstimatedPrice();

  // Guardar estado de búsqueda antes de navegar al perfil del taxista
  const handleCardClick = () => {
    try {
      const searchInputs = document.querySelectorAll('input');
      const originText = searchInputs[0]?.value || '';
      const destinationText = searchInputs[1]?.value || '';
      sessionStorage.setItem('eitaxi_search_inputs', JSON.stringify({ originText, destinationText }));
      // También guardar los drivers mostrados para restaurarlos al volver
      const driversSection = document.getElementById('drivers-section');
      sessionStorage.setItem('eitaxi_had_search', driversSection ? 'true' : 'false');
    } catch {}
  };

  return (
    <Link href={profileUrl} onClick={handleCardClick}>
      <Card className="group overflow-hidden border-border bg-card hover:border-yellow-400/50 transition-all duration-300 cursor-pointer h-full">
        <CardContent className="p-0">
          <div className="relative h-32 bg-gradient-to-br from-yellow-400/20 to-yellow-400/5 flex items-center justify-center overflow-hidden">
            {driver.imageUrl ? (
              <img
                src={driver.imageUrl}
                alt={driver.name}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            ) : (
              <Car className="h-16 w-16 text-yellow-400/40" />
            )}

            {/* Badges lado izquierdo */}
            <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
              {/* Etiqueta de dirección: ida y vuelta o solo ida */}
              {tripInfo && driver._directionType && (
                <Badge className={`border-0 text-[11px] font-semibold ${
                  driver._directionType === 'roundTrip'
                    ? 'bg-emerald-500/90 text-white'
                    : 'bg-amber-500/90 text-white'
                }`}>
                  <ArrowLeftRight className="mr-1 h-3 w-3" />
                  {driver._directionType === 'roundTrip' ? tDrivers('roundTrip') : tDrivers('oneWay')}
                </Badge>
              )}
              {driver.isVerified && (
                <Badge className="bg-green-500/90 text-white border-0">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {tCommon('verified')}
                </Badge>
              )}
              {driver.isTopRated && (
                <Badge className="bg-yellow-400/90 text-black border-0">
                  <Award className="mr-1 h-3 w-3" />
                  {tCommon('top')}
                </Badge>
              )}
              {/* Marcador de coincidencia híbrida */}
              {driver._marker && (
                <Badge className={`border-0 ${
                  driver._block === 'BOTH' 
                    ? 'bg-blue-500/90 text-white' 
                    : driver._block === 'A' 
                      ? 'bg-green-500/90 text-white'
                      : 'bg-orange-500/90 text-white'
                }`}>
                  {driver._marker}
                </Badge>
              )}
            </div>

            {/* Botón favorito + badges lado derecho (juntos y separados) */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              {driver.isAvailable24h && (
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                  <Clock className="mr-1 h-3 w-3" />
                  {tCommon('available24h')}
                </Badge>
              )}
              {driver.trackingEnabled && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `/track/${driver.id}`;
                  }}
                  className="appearance-none bg-transparent border-0 p-0"
                >
                  <Badge className="bg-red-500/90 text-white border-0 animate-pulse cursor-pointer hover:bg-red-500">
                    <Radio className="mr-1 h-3 w-3" />
                    {tDrivers('live')}
                  </Badge>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(driver.id);
                }}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors flex items-center gap-1"
                title={tDrivers('favorite')}
              >
                <Heart className={`h-4 w-4 ${driver._isFavorite ? 'text-red-400 fill-red-400' : 'text-white/70 hover:text-red-400'}`} />
                {driver._favoriteCount !== undefined && driver._favoriteCount > 0 && (
                  <span className="text-[10px] font-bold text-white/90 leading-none">{driver._favoriteCount}</span>
                )}
              </button>
            </div>

            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-sm">
                {vehicleInfo.icon} {vehicleInfo.label}
              </Badge>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg group-hover:text-yellow-400 transition-colors">
                  {driver.name}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {driver.city.name}, {driver.canton.name}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{driver.rating?.toFixed(1) || "5.0"}</span>
                </div>
                <p className="text-xs text-gray-500">{driver.experience} {tDrivers('yearsExperience')}</p>
              </div>
            </div>

            {/* Trip Info Table */}
            {tripInfo && tripInfo.distance > 0 && (
              <div className="mb-3 border border-border rounded-lg overflow-hidden">
                <div className="grid grid-cols-3 divide-x divide-border text-center">
                  <div className="py-2 px-1">
                    <div className="text-lg font-bold text-yellow-400">{tripInfo.distance.toFixed(1)}</div>
                    <div className="text-[10px] text-muted-foreground">{tRoute('kmEstimated')}</div>
                  </div>
                  <div className="py-2 px-1">
                    <div className="text-lg font-bold text-green-400">{tripInfo.duration}</div>
                    <div className="text-[10px] text-muted-foreground">{tRoute('minApprox')}</div>
                  </div>
                  <div className="py-2 px-1">
                    <div className="text-lg font-bold">
                      {estimatedPrice ? `${(estimatedPrice as any).minPrice || (estimatedPrice as any).min}-${(estimatedPrice as any).maxPrice || (estimatedPrice as any).max}` : '-'}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{tRoute('chfEstimated')}</div>
                  </div>
                </div>
                <div className="py-1.5 px-2 bg-muted/30 border-t border-border">
                  <p className="text-[10px] text-muted-foreground text-center">
                    {tRoute('priceNote')}
                  </p>
                </div>
              </div>
            )}

            {/* Coverage Reason */}
            {driver._coverageReason && !tripInfo && (
              <div className="text-xs text-muted-foreground mb-2">
                📍 {driver._coverageReason}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mb-4">
              {(driver.services || []).slice(0, 3).map((service) => {
                const config = serviceConfig[service];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <Badge key={service} variant="secondary" className="text-xs gap-1">
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500"
                onClick={handleCall}
              >
                <Phone className="mr-1.5 h-4 w-4" />
                {tDrivers('call')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                onClick={handleWhatsApp}
              >
                <MessageCircle className="mr-1.5 h-4 w-4" />
                {tCommon('whatsapp')}
              </Button>
              {onChat && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
                  onClick={handleChat}
                >
                  <MessageCircle className="mr-1.5 h-4 w-4" />
                  {tDrivers('chat') || 'Chat'}
                </Button>
              )}
            </div>

            {/* Book button — full width, below the action row */}
            {onBook && (
              <Button
                className="w-full mt-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600 font-semibold py-5"
                onClick={handleBook}
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                {tDrivers('book')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================
// MOBILE MENU
// ============================================
function MobileMenu({
  open,
  onClose,
  cantons,
  onCantonSelect,
}: {
  open: boolean;
  onClose: () => void;
  cantons: Canton[];
  onCantonSelect: (canton: Canton) => void;
}) {
  const t = useTranslations('header');
  const tMobileMenu = useTranslations('mobileMenu');

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-[85vw] max-w-80 bg-card">
        <SheetHeader>
          <SheetTitle className="text-left">{tMobileMenu('title')}</SheetTitle>
        </SheetHeader>
        <div className="py-6">
          <h3 className="font-semibold text-lg mb-4">{t('cantons')}</h3>
          <div className="space-y-2">
            {cantons.map((canton) => (
              <Button
                key={canton.id}
                variant="ghost"
                className="w-full justify-between"
                onClick={() => {
                  onCantonSelect(canton);
                  onClose();
                }}
              >
                {canton.name}
                <Badge variant="secondary">{canton._count?.drivers || 0}</Badge>
              </Button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-border space-y-3">
            <Link href="/seguimiento" onClick={onClose}>
              <Button variant="ghost" className="w-full justify-start">
                <Search className="mr-2 h-4 w-4" />
                {t('tracking')}
              </Button>
            </Link>
            <Link href="/login" onClick={onClose}>
              <Button variant="outline" className="w-full">
                <User className="mr-2 h-4 w-4" />
                {t('loginButton')}
              </Button>
            </Link>
            <Link href="/registrarse" onClick={onClose}>
              <Button className="w-full bg-yellow-400 text-black hover:bg-yellow-500">
                <Car className="mr-2 h-4 w-4" />
                {t('register')}
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================
// CLIENT INSTALL BUTTON
// ============================================
function ClientInstallButton() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [isStandalone, setIsStandalone] = useState(false);
  const tInstall = useTranslations('install');

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) setDeviceType('ios');
    else if (/Android/.test(ua)) setDeviceType('android');
    else setDeviceType('desktop');
  }, []);

  if (isStandalone) return null;

  const handleInstallClick = async () => {
    // Try native install prompt (Android/Chrome)
    const deferredPrompt = (window as any).deferredInstallPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') return;
    }
    setShowInstructions(true);
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium flex items-center gap-1"
      >
        <Download className="h-4 w-4" />
        {tInstall('downloadApp')}
      </button>

      {showInstructions && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowInstructions(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 mx-4 max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-yellow-400" />
                {tInstall('title')}
              </h3>
              <button onClick={() => setShowInstructions(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {tInstall('description')}
            </p>
            {deviceType === 'ios' && (
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2"><span className="font-bold text-blue-400">1.</span> {tInstall('iosStep1')}</p>
                <p className="flex items-start gap-2"><span className="font-bold text-green-400">2.</span> {tInstall('iosStep2')}</p>
                <p className="flex items-start gap-2"><span className="font-bold text-yellow-400">3.</span> {tInstall('iosStep3')}</p>
              </div>
            )}
            {deviceType === 'android' && (
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2"><span className="font-bold text-gray-400">1.</span> {tInstall('androidStep1')}</p>
                <p className="flex items-start gap-2"><span className="font-bold text-green-400">2.</span> {tInstall('androidStep2')}</p>
                <p className="flex items-start gap-2"><span className="font-bold text-yellow-400">3.</span> {tInstall('androidStep3')}</p>
              </div>
            )}
            {deviceType === 'desktop' && (
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2"><span className="font-bold text-yellow-400">1.</span> {tInstall('desktopStep1')}</p>
                <p className="flex items-start gap-2"><span className="font-bold text-yellow-400">2.</span> {tInstall('desktopStep2')}</p>
              </div>
            )}
            <button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-yellow-400 text-black font-bold text-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// FOOTER
// ============================================
function Footer() {
  const tFooter = useTranslations('footer');

  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500">
              <Car className="h-4 w-4 text-black" />
            </div>
            <span className="text-lg font-bold">
              <span className="text-yellow-400">ei</span>
              <span className="text-white">taxi</span>
            </span>
          </Link>
          
          {/* Enlaces legales + App */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <ClientInstallButton />
            <span className="text-muted-foreground/50">•</span>
            <Link href="/privacidad" className="text-muted-foreground hover:text-foreground transition-colors">
              {tFooter('privacy')}
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link href="/terminos" className="text-muted-foreground hover:text-foreground transition-colors">
              {tFooter('terms')}
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link href="/registrarse" className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium">
              {tFooter('joinAsDriver')}
            </Link>
          </div>
          
          <p className="text-sm text-gray-500">
            {tFooter('copyright', { year: new Date().getFullYear().toString() })}
          </p>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function eitaxiPage() {
  const pathname = usePathname();
  const tDrivers = useTranslations('drivers');
  const tCta = useTranslations('cta');
  const [drivers, setDrivers] = useState<TaxiDriver[]>([]);
  const [cantons, setCantons] = useState<Canton[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDriver, setBookingDriver] = useState<TaxiDriver | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatDriver, setChatDriver] = useState<{ id: string; name: string } | null>(null);
  const [searchInfo, setSearchInfo] = useState<{
    from: string;
    to: string;
    tripDistance?: number;
    tripDuration?: number;
    tripDurationFormatted?: string;
  } | null>(null);
  const [currentStops, setCurrentStops] = useState<Array<{ text: string; latitude?: number; longitude?: number }>>([]);
  const [restoredInputs, setRestoredInputs] = useState<{ originText: string; destinationText: string } | null>(null);
  const [restoredOrigin, setRestoredOrigin] = useState<LocationSuggestion | null>(null);
  const [restoredDestination, setRestoredDestination] = useState<LocationSuggestion | null>(null);
  const [restoredRouteInfo, setRestoredRouteInfo] = useState<RouteInfo | null>(null);
  const [favoriteDriverIds, setFavoriteDriverIds] = useState<Set<string>>(new Set());

  // Cargar favoritos del cliente logueado (solo si hay sesión)
  useEffect(() => {
    const hasSession = document.cookie.split(';').some(c => c.trim().startsWith('eitaxi_client_session='));
    if (!hasSession) return;
    const fetchFavorites = async () => {
      try {
        const res = await fetch('/api/client/favorites');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setFavoriteDriverIds(new Set(data.data.map((f: any) => f.driverId)));
          }
        }
      } catch {}
    };
    fetchFavorites();
  }, []);

  // Sincronizar _isFavorite en los drivers cuando cambian favoritos
  useEffect(() => {
    if (favoriteDriverIds.size === 0) return;
    setDrivers(prev => prev.map(d => ({
      ...d,
      _isFavorite: favoriteDriverIds.has(d.id)
    })));
  }, [favoriteDriverIds]);

  // Toggle favorito
  const handleToggleFavorite = useCallback(async (driverId: string) => {
    const isFav = favoriteDriverIds.has(driverId);
    try {
      if (isFav) {
        await fetch(`/api/client/favorites/${driverId}`, { method: 'DELETE' });
        setFavoriteDriverIds(prev => { const next = new Set(prev); next.delete(driverId); return next; });
      } else {
        await fetch('/api/client/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ driverId }) });
        setFavoriteDriverIds(prev => new Set(prev).add(driverId));
      }
      // Actualizar _isFavorite y _favoriteCount en los drivers
      setDrivers(prev => prev.map(d => ({ 
        ...d, 
        _isFavorite: isFav ? false : true,
        _favoriteCount: (d._favoriteCount || 0) + (isFav ? -1 : 1)
      })));
    } catch {}
  }, [favoriteDriverIds]);

  // Restaurar búsqueda al volver de perfil de taxista
  useEffect(() => {
    if (pathname !== '/') return;
    if (typeof window === 'undefined') return;
    try {
      const savedInputs = sessionStorage.getItem('eitaxi_search_inputs');
      const savedParams = sessionStorage.getItem('eitaxi_search_params');
      const savedInfo = sessionStorage.getItem('eitaxi_search_info');
      const savedOrigin = sessionStorage.getItem('eitaxi_saved_origin');
      const savedDest = sessionStorage.getItem('eitaxi_saved_dest');
      const savedRoute = sessionStorage.getItem('eitaxi_saved_route');

      if (savedInputs && (savedParams || savedInfo)) {
        const parsed = JSON.parse(savedInputs);
        if (parsed.originText || parsed.destinationText) {
          setRestoredInputs(parsed);

          // Restaurar objetos de ubicación para que los inputs se vean seleccionados
          if (savedOrigin) setRestoredOrigin(JSON.parse(savedOrigin));
          if (savedDest) setRestoredDestination(JSON.parse(savedDest));
          if (savedRoute) setRestoredRouteInfo(JSON.parse(savedRoute));

          // Restaurar searchInfo para mostrar la info de la ruta
          if (savedInfo) {
            setSearchInfo(JSON.parse(savedInfo));
          }

          // Re-disparar la búsqueda directamente (como pulsar el botón)
          if (savedParams) {
            setLoading(true);
            fetch(`/api/taxis/search?${savedParams}`)
              .then(r => r.json())
              .then(result => {
                if (result.success) {
                  setDrivers(result.data.map((d: any) => ({ ...d, _directionType: d.directionType })));
                }
              })
              .catch(() => {})
              .finally(() => {
                setLoading(false);
                setTimeout(() => {
                  document.getElementById('drivers-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
              });
          } else {
            setTimeout(() => {
              document.getElementById('drivers-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 300);
          }
        }
        // NO borrar — re-guardar para que persista en siguientes navegaciones
        if (savedParams) sessionStorage.setItem('eitaxi_search_params', savedParams);
        if (savedInfo) sessionStorage.setItem('eitaxi_search_info', savedInfo);
        if (savedInputs) sessionStorage.setItem('eitaxi_search_inputs', savedInputs);
        if (savedOrigin) sessionStorage.setItem('eitaxi_saved_origin', savedOrigin);
        if (savedDest) sessionStorage.setItem('eitaxi_saved_dest', savedDest);
        if (savedRoute) sessionStorage.setItem('eitaxi_saved_route', savedRoute);
      }
    } catch {}
  }, [pathname]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [driversRes, cantonsRes] = await Promise.all([
          fetch("/api/taxis"),
          fetch("/api/cantons"),
        ]);

        const driversData = await driversRes.json();
        const cantonsData = await cantonsRes.json();

        if (driversData.success) {
          setDrivers(driversData.data);
        }
        if (cantonsData.success) {
          setCantons(cantonsData.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCantonSelect = async (canton: Canton) => {
    setLoading(true);
    setSearchInfo({ from: canton.name, to: '' });

    try {
      const res = await fetch(`/api/taxis/search?cantonId=${canton.id}`);
      const data = await res.json();

      if (data.success) {
        setDrivers(data.data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      document.getElementById('drivers-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearch = useCallback(async (data: TripSearchData) => {
    setLoading(true);
    
    // Siempre establecer searchInfo con la información de la ruta
    const tripDistance = data.routeInfo?.distance;
    const tripDuration = data.routeInfo?.duration;
    const tripDurationFormatted = data.routeInfo?.durationFormatted;

    setSearchInfo({ 
      from: data.originText, 
      to: data.destinationText,
      tripDistance,
      tripDuration,
      tripDurationFormatted,
    });

    // Save stops for booking modal (with coordinates)
    setCurrentStops(data.stops?.map(s => ({
      text: s.text,
      latitude: s.suggestion?.lat,
      longitude: s.suggestion?.lon,
    })) || []);

    try {
      // Build search params
      const params = new URLSearchParams();

      if (data.origin?.id) {
        params.set('originId', data.origin.id);
        params.set('originType', data.origin.type);
      }
      if (data.origin?.lat && data.origin?.lon) {
        params.set('originLat', data.origin.lat.toString());
        params.set('originLon', data.origin.lon.toString());
      }
      if (data.destination?.id) {
        params.set('destinationId', data.destination.id);
        params.set('destinationType', data.destination.type);
      }
      if (data.destination?.lat && data.destination?.lon) {
        params.set('destLat', data.destination.lat.toString());
        params.set('destLon', data.destination.lon.toString());
      }
      if (data.originText) params.set('originText', data.originText);
      if (data.destinationText) params.set('destinationText', data.destinationText);

      // DEBUG: Log the search URL
      console.log('🔍 Buscando taxis:', `/api/taxis/search?${params.toString()}`);

      const res = await fetch(`/api/taxis/search?${params.toString()}`);
      const result = await res.json();

      console.log('🔍 Resultado API:', result);
      console.log('🔍 Total conductores:', result.total);
      console.log('🔍 Nombres:', result.data?.map((d: any) => d.name));

      if (result.success) {
        const mappedDrivers = result.data.map((d: any) => ({
          ...d,
          _directionType: d.directionType,
        }));
        setDrivers(mappedDrivers);

        // Guardar params de búsqueda para restaurar al volver de perfil
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('eitaxi_search_params', params.toString());
            const infoToSave = { from: data.originText, to: data.destinationText, tripDistance, tripDuration, tripDurationFormatted };
            sessionStorage.setItem('eitaxi_search_info', JSON.stringify(infoToSave));
            sessionStorage.setItem('eitaxi_saved_origin', JSON.stringify(data.origin));
            sessionStorage.setItem('eitaxi_saved_dest', JSON.stringify(data.destination));
            if (data.routeInfo) sessionStorage.setItem('eitaxi_saved_route', JSON.stringify(data.routeInfo));
          } catch {}
        }
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
      document.getElementById('drivers-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        cantons={cantons}
        onCantonSelect={handleCantonSelect}
        onMobileMenuOpen={() => setMobileMenuOpen(true)}
      />

      <main className="flex-1">
        <HeroSection
          onSearch={handleSearch}
          initialOriginText={restoredInputs?.originText}
          initialDestinationText={restoredInputs?.destinationText}
          initOrigin={restoredOrigin}
          initDestination={restoredDestination}
          initRouteInfo={restoredRouteInfo}
        />

        <section id="drivers-section" className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  {searchInfo
                    ? (searchInfo.to
                      ? tDrivers('titleRoute', { from: searchInfo.from, to: searchInfo.to })
                      : tDrivers('titleLocation', { location: searchInfo.from }))
                    : tDrivers('title')}
                </h2>
                <p className="text-gray-500">
                  {loading ? tDrivers('searching') : `${drivers.length} ${tDrivers('found')}`}
                  {searchInfo?.tripDistance && (
                    <span className="ml-2 text-yellow-400">
                      · {searchInfo.tripDistance.toFixed(1)} km
                    </span>
                  )}
                  {searchInfo?.tripDurationFormatted && (
                    <span className="ml-2 text-green-400">
                      · {searchInfo.tripDurationFormatted}
                    </span>
                  )}
                </p>
              </div>
              {searchInfo && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchInfo(null);
                    fetch("/api/taxis")
                      .then(res => res.json())
                      .then(data => {
                        if (data.success) setDrivers(data.data);
                      });
                  }}
                >
                  {tDrivers('viewAll')}
                </Button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-80 rounded-xl bg-card animate-pulse border border-border"
                  />
                ))}
              </div>
            ) : drivers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {drivers.map((driver) => (
                  <TaxiCard
                    key={driver.id}
                    driver={driver}
                    tripInfo={searchInfo?.tripDistance != null && searchInfo.tripDistance > 0 ? {
                      distance: searchInfo.tripDistance,
                      duration: searchInfo.tripDuration || Math.round(searchInfo.tripDistance * 1.5),
                      durationFormatted: searchInfo.tripDurationFormatted || `${Math.round(searchInfo.tripDistance * 1.5)} min`,
                      from: searchInfo.from,
                      to: searchInfo.to
                    } : undefined}
                    onBook={searchInfo?.tripDistance != null && searchInfo.tripDistance > 0 ? () => {
                      setBookingDriver(driver);
                      setShowBooking(true);
                    } : undefined}
                    onChat={() => {
                      setChatDriver({ id: driver.id, name: driver.name });
                      setShowChat(true);
                    }}
                    toggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Car className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchInfo
                    ? tDrivers('noDriversRoute')
                    : tDrivers('noDrivers')}
                </h3>
                <p className="text-gray-500 mb-4">
                  {tDrivers('tryAnother')}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchInfo(null);
                    fetch("/api/taxis")
                      .then(res => res.json())
                      .then(data => {
                        if (data.success) setDrivers(data.data);
                      });
                  }}
                >
                  {tDrivers('viewAll')}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-yellow-400/10 via-transparent to-yellow-400/5">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{tCta('title')}</h2>
              <p className="text-lg text-gray-400 mb-8">
                {tCta('subtitle')}
              </p>
              <Link href="/registrarse">
                <Button size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500">
                  <Zap className="mr-2 h-5 w-5" />
                  {tCta('button')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        cantons={cantons}
        onCantonSelect={handleCantonSelect}
      />

      <BookingModal
        open={showBooking}
        onClose={() => {
          setShowBooking(false);
          setBookingDriver(null);
        }}
        driver={bookingDriver ? {
          id: bookingDriver.id,
          name: bookingDriver.name,
          photo: bookingDriver.imageUrl,
          vehicle: bookingDriver.vehicleType,
          vehicleBrand: bookingDriver.vehicleBrand,
          vehicleModel: bookingDriver.vehicleModel,
          vehicleType: bookingDriver.vehicleType,
          city: bookingDriver.city,
          canton: bookingDriver.canton,
          isAvailable24h: bookingDriver.isAvailable24h,
          workingHours: bookingDriver.workingHours as any,
        } : null}
        origin={searchInfo?.from || ""}
        destination={searchInfo?.to || ""}
        stops={currentStops}
      />

      {chatDriver && (
        <DirectChatDialog
          driverId={chatDriver.id}
          driverName={chatDriver.name}
          open={showChat}
          onOpenChange={(open) => {
            setShowChat(open);
            if (!open) setChatDriver(null);
          }}
        />
      )}
    </div>
  );
}
