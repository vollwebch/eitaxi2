"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
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
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { localeNames, localeFlags, locales, Locale } from "@/i18n/config";
import { useRouter, usePathname } from "@/i18n/routing";

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
  _distance?: number;
  _coverageReason?: string;
  _estimatedPrice?: { minPrice: number; maxPrice: number };
  _tripDistance?: number;
}

// Location suggestion type
interface LocationSuggestion {
  id: string;
  street?: string | null;
  housenumber?: string | null;
  postcode?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  fullAddress: string;
  shortAddress?: string;
  lat?: number;
  lon?: number;
  type: string;
  typeName?: string;
  icon?: string;
  needsHouseNumber?: boolean;
  name?: string;
  cantonName?: string;
  cityName?: string;
  code?: string;
  postalCode?: string;
}

// Language Selector Component
function LanguageSelector() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const changeLocale = (newLocale: Locale) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
    router.replace(pathname || '/', { locale: newLocale });
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{localeFlags[locale]} {localeNames[locale]}</span>
          <span className="sm:hidden">{localeFlags[locale]}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => changeLocale(l)}
            className={`flex items-center gap-2 ${l === locale ? 'bg-yellow-400/10' : ''}`}
          >
            <span>{localeFlags[l]}</span>
            <span>{localeNames[l]}</span>
            {l === locale && <CheckCircle className="h-4 w-4 ml-auto text-yellow-400" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Header Component
function Header({
  cantons,
  onCantonSelect,
  onMobileMenuOpen,
}: {
  cantons: Canton[];
  onCantonSelect: (canton: Canton) => void;
  onMobileMenuOpen: () => void;
}) {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500">
              <Car className="h-6 w-6 text-black" />
            </div>
            <span className="text-xl font-bold">
              <span className="text-yellow-400">Taxi</span>
              <span className="text-white">Zone</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1">
                  {t('header.cantons')} <ChevronDown className="h-4 w-4" />
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
                  <DropdownMenuItem disabled>{t('common.loading')}</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <LanguageSelector />
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                {t('header.login')}
              </Button>
            </Link>
            <Link href="/registrarse">
              <Button
                variant="outline"
                className="hidden sm:flex border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
              >
                <Car className="mr-2 h-4 w-4" />
                {t('header.register')}
              </Button>
            </Link>
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

// Location Input Component with Autocomplete
function LocationInput({
  placeholder,
  value,
  onChange,
  onSelect,
  icon: Icon,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: LocationSuggestion) => void;
  icon: typeof MapPin;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (value.trim().length >= 2) {
        setLoading(true);
        try {
          const res = await fetch(`/api/locations?q=${encodeURIComponent(value.trim())}&lang=${locale}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setSuggestions(data.data);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, locale]);

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
    let displayValue = suggestion.shortAddress || suggestion.fullAddress || suggestion.name || '';
    onChange(displayValue);
    setShowSuggestions(false);
    setSuggestions([]);
    onSelect(suggestion);
  };

  const getSubtitle = (suggestion: LocationSuggestion) => {
    const parts = [];
    if (suggestion.typeName) {
      // Traducir el tipo de ubicación
      const typeKey = suggestion.type as string;
      try {
        parts.push(t(`locationTypes.${typeKey}`));
      } catch {
        parts.push(suggestion.typeName);
      }
    }
    if (suggestion.country === 'LI') {
      parts.push('🇱🇮 ' + t('search.liechtenstein'));
    } else {
      parts.push('🇨🇭 ' + t('search.switzerland'));
    }
    return parts.join(' · ');
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-400 z-10" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.trim().length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          className="pl-12 pr-10 h-14 text-lg bg-card border-border focus:border-yellow-400 focus:ring-yellow-400/20"
        />
        {value && (
          <button
            onClick={() => {
              onChange('');
              onSelect({ id: '', name: '', type: 'city' });
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-30 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin h-5 w-5 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
              {t('common.loading')}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion) => {
                const getIconDisplay = () => {
                  if (suggestion.icon) {
                    return <span className="text-lg">{suggestion.icon}</span>;
                  }
                  return <MapPin className="h-4 w-4 text-yellow-400" />;
                };
                
                const displayName = suggestion.fullAddress || suggestion.name || '';
                
                return (
                  <button
                    key={`${suggestion.type}-${suggestion.id}`}
                    type="button"
                    onClick={() => handleSelect(suggestion)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-yellow-400/10 transition-colors text-left"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
                      {getIconDisplay()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{displayName}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {getSubtitle(suggestion)}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : value.trim().length >= 2 ? (
            <div className="p-4 text-center text-muted-foreground">
              {t('search.noResults')}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Hero Section with From/To Search
interface TripSearchData {
  origin: LocationSuggestion | null;
  destination: LocationSuggestion | null;
  originText: string;
  destinationText: string;
}

interface RouteInfo {
  distanceKm: number;
  durationMinutes: number;
  priceMin: number;
  priceMax: number;
  loading: boolean;
}

function HeroSection({ onSearch }: { onSearch: (data: TripSearchData) => void }) {
  const t = useTranslations();
  const [originText, setOriginText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [origin, setOrigin] = useState<LocationSuggestion | null>(null);
  const [destination, setDestination] = useState<LocationSuggestion | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  useEffect(() => {
    const calculateRoute = async () => {
      if (origin?.lat && origin?.lon && destination?.lat && destination?.lon) {
        setRouteInfo({ distanceKm: 0, durationMinutes: 0, priceMin: 0, priceMax: 0, loading: true });
        
        try {
          const res = await fetch(
            `/api/route?fromLat=${origin.lat}&fromLon=${origin.lon}&toLat=${destination.lat}&toLon=${destination.lon}&fromAddress=${encodeURIComponent(origin.fullAddress || '')}&toAddress=${encodeURIComponent(destination.fullAddress || '')}`
          );
          const data = await res.json();
          
          if (data.success && data.route) {
            setRouteInfo({
              distanceKm: data.route.distance.roadKm || data.route.distance.km,
              durationMinutes: data.route.duration.minutes,
              priceMin: data.route.price.min,
              priceMax: data.route.price.max,
              loading: false
            });
          } else {
            setRouteInfo(null);
          }
        } catch (error) {
          console.error('Error calculando ruta:', error);
          setRouteInfo(null);
        }
      } else {
        setRouteInfo(null);
      }
    };

    if (origin?.lat && destination?.lat) {
      calculateRoute();
    } else {
      setRouteInfo(null);
    }
  }, [origin, destination]);

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
      });
    }
  };

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
            {t('hero.badge')}
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {t('hero.title', { country: '' })}
            <span className="text-yellow-400">{t('hero.titleHighlight')}</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>

          {/* From/To Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-xl">
              <div className="space-y-3">
                {/* Origin */}
                <LocationInput
                  placeholder={t('hero.originPlaceholder')}
                  value={originText}
                  onChange={setOriginText}
                  onSelect={(s) => setOrigin(s)}
                  icon={Navigation}
                />

                {/* Swap Button */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={handleSwap}
                    className="p-2 rounded-full bg-yellow-400/10 hover:bg-yellow-400/20 transition-colors"
                    title="Intercambiar origen y destino"
                  >
                    <ArrowLeftRight className="h-5 w-5 text-yellow-400" />
                  </button>
                </div>

                {/* Destination */}
                <LocationInput
                  placeholder={t('hero.destinationPlaceholder')}
                  value={destinationText}
                  onChange={setDestinationText}
                  onSelect={(s) => setDestination(s)}
                  icon={MapPin}
                />
              </div>

              {/* Search Button */}
              <Button
                className="w-full mt-4 h-14 text-lg bg-yellow-400 text-black hover:bg-yellow-500"
                onClick={handleSearch}
                disabled={!originText.trim() && !destinationText.trim()}
              >
                <Search className="mr-2 h-5 w-5" />
                {t('hero.searchButton')}
              </Button>

              {/* Route Info */}
              {routeInfo && (
                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-400/10 to-yellow-400/5 rounded-xl border border-yellow-400/20">
                  {routeInfo.loading ? (
                    <div className="flex items-center justify-center gap-2 text-yellow-400">
                      <div className="animate-spin h-5 w-5 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                      <span>{t('route.calculating')}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                          <Route className="h-4 w-4" />
                        </div>
                        <div className="text-2xl font-bold text-white">{routeInfo.distanceKm}</div>
                        <div className="text-xs text-gray-400">{t('route.kmEstimated')}</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {routeInfo.durationMinutes >= 60 
                            ? `${Math.floor(routeInfo.durationMinutes / 60)}h ${routeInfo.durationMinutes % 60}` 
                            : routeInfo.durationMinutes}
                        </div>
                        <div className="text-xs text-gray-400">{t('route.minApprox')}</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                          <span className="text-sm">💰</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{routeInfo.priceMin}-{routeInfo.priceMax}</div>
                        <div className="text-xs text-gray-400">{t('route.chfEstimated')}</div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 text-center mt-2">
                    {t('route.priceNote')}
                  </p>
                </div>
              )}

              {/* Quick Options */}
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-yellow-400/10"
                  onClick={() => {
                    setOriginText('Flughafen Zürich');
                    setOrigin({ id: 'airport-zurich', name: 'Flughafen Zürich', type: 'airport', fullAddress: 'Flughafen Zürich', cantonName: 'Zürich' });
                  }}
                >
                  <Plane className="mr-1 h-3 w-3" /> {t('hero.fromAirport')}
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-yellow-400/10"
                  onClick={() => {
                    setDestinationText('Flughafen Zürich');
                    setDestination({ id: 'airport-zurich', name: 'Flughafen Zürich', type: 'airport', fullAddress: 'Flughafen Zürich', cantonName: 'Zürich' });
                  }}
                >
                  <Plane className="mr-1 h-3 w-3" /> {t('hero.toAirport')}
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-yellow-400/10"
                  onClick={() => {
                    setOriginText('Vaduz');
                    setOrigin({ id: 'vaduz-li', name: 'Vaduz', type: 'city', cantonName: 'Liechtenstein', country: 'LI', fullAddress: 'Vaduz, Liechtenstein' });
                  }}
                >
                  🇱🇮 {t('hero.liechtenstein')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-2xl mx-auto">
            {[
              { value: "500+", label: t('stats.drivers'), icon: Users },
              { value: "24/7", label: t('stats.availability'), icon: Clock },
              { value: "100%", label: t('stats.verified'), icon: Shield },
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

// Service config
const serviceConfig: Record<string, { icon: typeof Car; labelKey: string }> = {
  airport: { icon: Plane, labelKey: "services.airport" },
  city: { icon: Building2, labelKey: "services.city" },
  long_distance: { icon: Route, labelKey: "services.long_distance" },
  limousine: { icon: Car, labelKey: "services.limousine" },
  corporate: { icon: Shield, labelKey: "services.corporate" },
  events: { icon: Calendar, labelKey: "services.events" },
};

// Vehicle type config
const vehicleTypeConfig: Record<string, { labelKey: string; icon: string }> = {
  taxi: { labelKey: "vehicleTypes.taxi", icon: "🚕" },
  limousine: { labelKey: "vehicleTypes.limousine", icon: "🚗" },
  van: { labelKey: "vehicleTypes.van", icon: "🚐" },
  premium: { labelKey: "vehicleTypes.premium", icon: "✨" },
};

// Taxi Card
function TaxiCard({ driver, tripInfo }: { driver: TaxiDriver; tripInfo?: { distance: number; from: string; to: string } }) {
  const t = useTranslations();
  
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

  const vehicleInfo = vehicleTypeConfig[driver.vehicleType] || vehicleTypeConfig.taxi;
  const profileUrl = `/${driver.canton.slug}/${driver.city.slug}/${driver.slug}`;

  return (
    <Link href={profileUrl}>
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

            <div className="absolute top-3 left-3 flex gap-2">
              {driver.isVerified && (
                <Badge className="bg-green-500/90 text-white border-0">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {t('common.verified')}
                </Badge>
              )}
              {driver.isTopRated && (
                <Badge className="bg-yellow-400/90 text-black border-0">
                  <Award className="mr-1 h-3 w-3" />
                  {t('common.top')}
                </Badge>
              )}
            </div>

            <div className="absolute top-3 right-3 flex gap-2">
              {driver.isAvailable24h && (
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                  <Clock className="mr-1 h-3 w-3" />
                  {t('common.available24h')}
                </Badge>
              )}
            </div>

            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-sm">
                {vehicleInfo.icon} {t(vehicleInfo.labelKey)}
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
                <p className="text-xs text-gray-500">{driver.experience} {t('drivers.yearsExperience')}</p>
              </div>
            </div>

            {/* Trip Info */}
            {tripInfo && (
              <div className="mb-3 p-2 bg-yellow-400/10 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('drivers.tripDistance')}</span>
                  <span className="font-medium text-yellow-400">{tripInfo.distance.toFixed(1)} km</span>
                </div>
                {driver._estimatedPrice && (
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">{t('drivers.estimatedPrice')}</span>
                    <span className="font-medium">
                      CHF {driver._estimatedPrice.minPrice.toFixed(0)} - {driver._estimatedPrice.maxPrice.toFixed(0)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Coverage Reason */}
            {driver._coverageReason && (
              <div className="text-xs text-muted-foreground mb-2">
                📍 {driver._coverageReason}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mb-4">
              {driver.services.slice(0, 3).map((service) => {
                const config = serviceConfig[service];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <Badge key={service} variant="secondary" className="text-xs gap-1">
                    <Icon className="h-3 w-3" />
                    {t(config.labelKey)}
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
                {t('drivers.call')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                onClick={handleWhatsApp}
              >
                <MessageCircle className="mr-1.5 h-4 w-4" />
                {t('drivers.whatsapp')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Mobile Menu
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
  const t = useTranslations();

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-80 bg-card">
        <div className="py-6">
          <h3 className="font-semibold text-lg mb-4">{t('header.cantons')}</h3>
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

          <div className="mt-8 pt-6 border-t border-border">
            <Link href="/login" onClick={onClose}>
              <Button variant="outline" className="w-full mb-3">
                {t('header.login')}
              </Button>
            </Link>
            <Link href="/registrarse" onClick={onClose}>
              <Button className="w-full bg-yellow-400 text-black hover:bg-yellow-500">
                <Car className="mr-2 h-4 w-4" />
                {t('header.register')}
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Footer
function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500">
              <Car className="h-4 w-4 text-black" />
            </div>
            <span className="text-lg font-bold">
              <span className="text-yellow-400">Taxi</span>
              <span className="text-white">Zone</span>
            </span>
          </Link>
          <p className="text-sm text-gray-500">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <p className="text-xs text-gray-600">
            {t('footer.attribution')}
          </p>
        </div>
      </div>
    </footer>
  );
}

// Main Page
export default function TaxiZonePage() {
  const t = useTranslations();
  const [drivers, setDrivers] = useState<TaxiDriver[]>([]);
  const [cantons, setCantons] = useState<Canton[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchInfo, setSearchInfo] = useState<{
    from: string;
    to: string;
    tripDistance?: number;
  } | null>(null);

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

  const handleSearch = async (data: TripSearchData) => {
    setLoading(true);
    setSearchInfo({ from: data.originText, to: data.destinationText });

    try {
      const params = new URLSearchParams();

      if (data.origin?.id) {
        params.set('originId', data.origin.id);
        params.set('originType', data.origin.type);
      }
      if (data.destination?.id) {
        params.set('destinationId', data.destination.id);
        params.set('destinationType', data.destination.type);
      }
      if (data.originText) params.set('originText', data.originText);
      if (data.destinationText) params.set('destinationText', data.destinationText);

      const res = await fetch(`/api/taxis/search?${params.toString()}`);
      const result = await res.json();

      if (result.success) {
        setDrivers(result.data);
        setSearchInfo(prev => prev ? {
          ...prev,
          tripDistance: result.tripDistance
        } : null);
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
      document.getElementById('drivers-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        cantons={cantons}
        onCantonSelect={handleCantonSelect}
        onMobileMenuOpen={() => setMobileMenuOpen(true)}
      />

      <main className="flex-1">
        <HeroSection onSearch={handleSearch} />

        <section id="drivers-section" className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  {searchInfo
                    ? (searchInfo.to
                      ? t('drivers.titleRoute', { from: searchInfo.from, to: searchInfo.to })
                      : t('drivers.titleLocation', { location: searchInfo.from }))
                    : t('drivers.title')}
                </h2>
                <p className="text-gray-500">
                  {loading ? t('common.loading') : `${drivers.length} ${t('drivers.found')}`}
                  {searchInfo?.tripDistance && (
                    <span className="ml-2 text-yellow-400">
                      · {t('drivers.tripOf', { km: searchInfo.tripDistance.toFixed(1) })}
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
                  {t('common.seeAll')}
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
                    tripInfo={searchInfo?.tripDistance ? {
                      distance: searchInfo.tripDistance,
                      from: searchInfo.from,
                      to: searchInfo.to
                    } : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Car className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchInfo
                    ? t('drivers.noDriversRoute')
                    : t('drivers.noDrivers')}
                </h3>
                <p className="text-gray-500 mb-4">
                  {t('drivers.tryAnother')}
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
                  {t('drivers.viewAll')}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-yellow-400/10 via-transparent to-yellow-400/5">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('cta.title')}</h2>
              <p className="text-lg text-gray-400 mb-8">
                {t('cta.subtitle')}
              </p>
              <Link href="/registrarse">
                <Button size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500">
                  <Zap className="mr-2 h-5 w-5" />
                  {t('cta.button')}
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
    </div>
  );
}
