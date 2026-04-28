"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  Award,
  Car,
  Plane,
  Building2,
  Route,
  Shield,
  Globe,
  Users,
  Calendar,
  ArrowLeft,
  Share2,
  Heart,
  Navigation,
  Zap,
  Radio,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ReviewsSection from "@/components/ReviewsSection";

// Types
interface Driver {
  id: string;
  name: string;
  slug: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  description: string | null;
  imageUrl: string | null;
  experience: number;
  vehicleType: string;
  vehicleTypes: string[];
  vehicles: Vehicle[];
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  vehicleColor: string | null;
  passengerCapacity: number | null;
  isAvailable24h: boolean;
  isVerified: boolean;
  isTopRated: boolean;
  rating: number;
  reviewCount: number;
  views: number;
  services: string[];
  languages: string[];
  serviceZones: string[];
  city: { name: string; slug: string };
  canton: { name: string; code: string; slug: string };
  // GPS Tracking
  trackingEnabled?: boolean;
  trackingMode?: string;
  lastLocationAt?: string | null;
}

// Vehicle interface
interface Vehicle {
  id: string;
  vehicleType: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  passengerCapacity: number | null;
  isPrimary: boolean;
}

// Live location type
interface LiveLocation {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
  age: number;
  isRecent: boolean;
}

// Service config
function getServiceConfig(tServices: ReturnType<typeof useTranslations>, t: ReturnType<typeof useTranslations>): Record<string, { icon: typeof Car; label: string; description: string }> {
  return {
    airport: { icon: Plane, label: tServices('airport'), description: t('serviceDesc.airport') },
    city: { icon: Building2, label: tServices('city'), description: t('serviceDesc.city') },
    long_distance: { icon: Route, label: tServices('long_distance'), description: t('serviceDesc.long_distance') },
    limousine: { icon: Car, label: tServices('limousine'), description: t('serviceDesc.limousine') },
    corporate: { icon: Shield, label: tServices('corporate'), description: t('serviceDesc.corporate') },
    events: { icon: Calendar, label: tServices('events'), description: t('serviceDesc.events') },
    delivery: { icon: Route, label: tServices('delivery'), description: t('serviceDesc.delivery') },
    night: { icon: Clock, label: tServices('night'), description: t('serviceDesc.night') },
  };
}

// Language config
function getLanguageConfig(t: ReturnType<typeof useTranslations>): Record<string, { flag: string; name: string }> {
  return {
    de: { flag: "🇩🇪", name: t('language.de') },
    en: { flag: "🇬🇧", name: t('language.en') },
    fr: { flag: "🇫🇷", name: t('language.fr') },
    it: { flag: "🇮🇹", name: t('language.it') },
    es: { flag: "🇪🇸", name: t('language.es') },
    pt: { flag: "🇵🇹", name: t('language.pt') },
    ru: { flag: "🇷🇺", name: t('language.ru') },
    zh: { flag: "🇨🇳", name: t('language.zh') },
  };
}

// Vehicle type config
function getVehicleTypeConfig(tVT: ReturnType<typeof useTranslations>): Record<string, { label: string; icon: string }> {
  return {
    taxi: { label: tVT('taxi'), icon: "🚕" },
    limousine: { label: tVT('limousine'), icon: "🚗" },
    van: { label: tVT('van'), icon: "🚐" },
    premium: { label: tVT('premium'), icon: "✨" },
  };
}

// Mapa dinámico para el tracking
const DriverLiveMap = dynamic(() => import('./LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 flex items-center justify-center bg-muted rounded-lg">
      <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
    </div>
  ),
});

export default function DriverProfilePage() {
  const params = useParams();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [showLiveMap, setShowLiveMap] = useState(false);

  // Translation hooks
  const t = useTranslations('profile');
  const tDrivers = useTranslations('drivers');
  const tCommon = useTranslations('common');
  const tServices = useTranslations('services');
  const tVehicleTypes = useTranslations('vehicleTypes');
  const tSearch = useTranslations('search');
  const tFooter = useTranslations('footer');

  const serviceConfig = getServiceConfig(tServices, t);
  const languageConfig = getLanguageConfig(t);
  const vehicleTypeConfig = getVehicleTypeConfig(tVehicleTypes);

  useEffect(() => {
    const fetchDriver = async () => {
      try {
        const res = await fetch(
          `/api/drivers?slug=${params.slug}&canton=${params.canton}&city=${params.city}`
        );
        const data = await res.json();

        if (data.success) {
          setDriver(data.data);
        } else {
          setError(data.error || t('notFound'));
        }
      } catch (err) {
        setError(tCommon('error'));
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) {
      fetchDriver();
    }
  }, [params.slug, params.canton, params.city]);

  // Obtener ubicación en vivo si tiene GPS activado
  useEffect(() => {
    if (!driver?.trackingEnabled || !driver?.id) return;

    const fetchLocation = async () => {
      try {
        const res = await fetch(`/api/driver/location/${driver.id}`);
        const data = await res.json();
        if (data.success && data.location) {
          setLiveLocation(data.location);
        }
      } catch (err) {
        console.error('Error fetching live location:', err);
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 5000); // Cada 5 segundos
    return () => clearInterval(interval);
  }, [driver?.trackingEnabled, driver?.id]);

  const handleCall = () => {
    if (driver) {
      window.location.href = `tel:${driver.phone}`;
    }
  };

  const handleWhatsApp = () => {
    if (driver) {
      const phone = driver.whatsapp || driver.phone;
      window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${driver?.name} - eitaxi`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header skeleton */}
        <div className="h-16 border-b border-border animate-pulse bg-muted" />
        
        {/* Hero skeleton */}
        <div className="relative h-[50vh] md:h-[60vh] bg-muted animate-pulse" />
        
        {/* Content skeleton */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-12 bg-muted rounded animate-pulse w-1/2" />
            <div className="h-6 bg-muted rounded animate-pulse w-1/3" />
            <div className="h-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !driver) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center border-border">
          <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('notFound')}</h1>
          <p className="text-muted-foreground mb-6">
            {error || t('notFound')}
          </p>
          <Link href="/">
            <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tCommon('back')}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Obtener información de todos los tipos de vehículo
  const vehicleTypesList = driver.vehicleTypes && driver.vehicleTypes.length > 0 
    ? driver.vehicleTypes 
    : [driver.vehicleType || 'taxi'];
  const vehicleInfos = vehicleTypesList.map(vt => vehicleTypeConfig[vt] || vehicleTypeConfig.taxi);
  const primaryVehicleInfo = vehicleInfos[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500">
                <Car className="h-6 w-6 text-black" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-yellow-400">ei</span>
                <span className="text-white">taxi</span>
              </span>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <LanguageSwitcher />
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                className="bg-yellow-400 text-black hover:bg-yellow-500"
                onClick={handleCall}
                size="sm"
              >
                <Phone className="sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{tDrivers('call')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-background to-yellow-400/5" />
        
        {/* Image or placeholder */}
        {driver.imageUrl ? (
          <img
            src={driver.imageUrl}
            alt={driver.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Car className="h-48 w-48 text-yellow-400/20" />
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container mx-auto">
            <div className="max-w-4xl">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {driver.isAvailable24h && (
                  <Badge className="bg-green-500/90 text-white border-0 text-sm">
                    <Clock className="mr-1.5 h-4 w-4" />
                    {t('available247')}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-sm bg-background/80 backdrop-blur-sm">
                  <span className="mr-1.5">{primaryVehicleInfo.icon}</span>
                  {vehicleTypesList.length > 1 
                    ? `${tVehicleTypes(vehicleTypesList[0])} +${vehicleTypesList.length - 1}` 
                    : tVehicleTypes(vehicleTypesList[0])}
                </Badge>
                {driver.isVerified && (
                  <Badge className="bg-blue-500/90 text-white border-0 text-sm">
                    <CheckCircle className="mr-1.5 h-4 w-4" />
                    {t('verifiedBadge')}
                  </Badge>
                )}
                {driver.isTopRated && (
                  <Badge className="bg-yellow-400/90 text-black border-0 text-sm">
                    <Award className="mr-1.5 h-4 w-4" />
                    {t('topTaxi')}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-bold mb-3">
                {driver.name}
              </h1>

              {/* Location */}
              <p className="text-xl text-muted-foreground flex items-center gap-2">
                <MapPin className="h-5 w-5 text-yellow-400" />
                {driver.city.name}, {driver.canton.name}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-yellow-400">
                {driver.experience}+
              </div>
              <div className="text-sm text-muted-foreground mt-1">{t('experience')}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                <span className="text-3xl md:text-4xl font-bold">{driver.rating.toFixed(1)}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">{t('rating')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-yellow-400">
                {driver.views}+
              </div>
              <div className="text-sm text-muted-foreground mt-1">{t('clientsContacted')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-yellow-400">
                100%
              </div>
              <div className="text-sm text-muted-foreground mt-1">{t('reliability')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Services Section */}
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    {t('services')}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(driver.services || []).map((serviceId) => {
                      const service = serviceConfig[serviceId];
                      if (!service) return null;
                      const Icon = service.icon;
                      return (
                        <div
                          key={serviceId}
                          className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border"
                        >
                          <div className="h-10 w-10 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div>
                            <div className="font-medium">{tServices(serviceId as any)}</div>
                            <div className="text-sm text-muted-foreground">
                              {service.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* About Section */}
              {driver.description && (
                <Card className="border-border bg-card">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">{t('about', { name: driver.name })}</h2>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {driver.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Vehicle Section */}
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Car className="h-5 w-5 text-yellow-400" />
                    {t('vehicle')}
                  </h2>
                  
                  {/* Si hay vehículos en la nueva tabla */}
                  {driver.vehicles && driver.vehicles.length > 0 ? (
                    <div className="space-y-3">
                      {driver.vehicles.map((vehicle, idx) => {
                        const typeInfo = vehicleTypeConfig[vehicle.vehicleType] || vehicleTypeConfig.taxi;
                        return (
                          <div 
                            key={vehicle.id} 
                            className={`flex items-center gap-4 p-4 rounded-lg border ${
                              vehicle.isPrimary 
                                ? 'bg-yellow-400/5 border-yellow-400/30' 
                                : 'bg-muted/50 border-border'
                            }`}
                          >
                            <div className="text-3xl">{typeInfo.icon}</div>
                            <div className="flex-1">
                              <div className="font-medium text-lg flex flex-wrap items-center gap-2">
                                {vehicle.brand} {vehicle.model}
                                <Badge variant="outline" className="text-xs">
                                  {tVehicleTypes(vehicle.vehicleType as any)}
                                </Badge>
                                {vehicle.isPrimary && (
                                  <Badge className="bg-yellow-400 text-black text-xs">
                                    {t('primaryVehicle')}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                {vehicle.year && <span>{t('yearLabel', { year: vehicle.year })}</span>}
                                {vehicle.color && <span>{t('colorLabel', { color: vehicle.color })}</span>}
                                {vehicle.passengerCapacity && (
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {t('passengers', { count: vehicle.passengerCapacity })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Fallback a los datos antiguos */
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex -space-x-2">
                        {vehicleInfos.map((vi, idx) => (
                          <div key={idx} className="text-3xl" style={{ marginLeft: idx > 0 ? '-8px' : '0' }}>
                            {vi.icon}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-lg flex flex-wrap items-center gap-2">
                          {driver.vehicleBrand} {driver.vehicleModel}
                          <div className="flex flex-wrap gap-1">
                            {vehicleTypesList.map((vt, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tVehicleTypes(vt as any)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          {driver.vehicleYear && <span>{t('yearLabel', { year: driver.vehicleYear })}</span>}
                          {driver.vehicleColor && <span>{t('colorLabel', { color: driver.vehicleColor })}</span>}
                          {driver.passengerCapacity && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {t('passengers', { count: driver.passengerCapacity })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Zones */}
              {driver.serviceZones && driver.serviceZones.length > 0 && (
                <Card className="border-border bg-card">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-yellow-400" />
                      {t('serviceZones')}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {driver.serviceZones.map((zone, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-sm py-1.5 px-3"
                        >
                          <MapPin className="mr-1.5 h-3 w-3" />
                          {zone}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews Section */}
              <ReviewsSection
                driverId={driver.id}
                driverName={driver.name}
                initialRating={driver.rating}
                initialCount={driver.reviewCount}
              />
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Contact Card - Solo sticky en desktop para evitar overlap */}
              <Card className="border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-transparent lg:sticky lg:top-24 lg:z-10">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">{t('contactDriver')}</h3>
                  
                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-yellow-400 text-black hover:bg-yellow-500 h-12 text-lg"
                      onClick={handleCall}
                    >
                      <Phone className="mr-2 h-5 w-5" />
                      {tDrivers('call')}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-green-500 text-green-500 hover:bg-green-500 hover:text-white h-12 text-lg"
                      onClick={handleWhatsApp}
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      {tCommon('whatsapp')}
                    </Button>
                  </div>

                  {/* Phone number */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">{t('phoneLabel')}</div>
                    <a
                      href={`tel:${driver.phone}`}
                      className="text-lg font-medium text-yellow-400 hover:underline"
                    >
                      {driver.phone}
                    </a>
                  </div>

                  {/* Availability */}
                  {driver.isAvailable24h && (
                    <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-2 text-green-500">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{t('availableNow')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('service24h')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Languages Card */}
              {driver.languages && driver.languages.length > 0 && (
                <Card className="border-border bg-card">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Globe className="h-5 w-5 text-yellow-400" />
                      {t('languages')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {driver.languages.map((langId) => {
                        const lang = languageConfig[langId];
                        if (!lang) return null;
                        return (
                          <Badge
                            key={langId}
                            variant="secondary"
                            className="text-sm py-1.5"
                          >
                            <span className="mr-1.5">{lang.flag}</span>
                            {lang.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Location Card */}
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-yellow-400" />
                    {t('locationLabel')}
                  </h3>
                  <div className="space-y-2">
                    <div className="font-medium">{driver.city.name}</div>
                    <div className="text-muted-foreground">
                      {driver.canton.name}, {tSearch('switzerland')}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live Location Card - Solo si tiene GPS activado */}
              {driver.trackingEnabled && (
                <Card className="border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                        {t('liveLocation')}
                      </h3>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                        {t('live')}
                      </Badge>
                    </div>

                    {/* Mini mapa o botón para expandir */}
                    {!showLiveMap ? (
                      <div className="space-y-3">
                        {liveLocation ? (
                          <>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {t('updatedAgo', { time: liveLocation.age < 60 ? `${liveLocation.age}s` : '1 min' })}
                            </div>
                            {liveLocation.speed && (
                              <div className="flex items-center gap-2 text-sm">
                                <Navigation className="h-4 w-4 text-yellow-400" />
                                {Math.round(liveLocation.speed)} km/h
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {t('gettingLocation')}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setShowLiveMap(true)}
                          >
                            <MapPin className="mr-1 h-4 w-4" />
                            {t('viewMap')}
                          </Button>
                          <Link href={`/track/${driver.id}`} className="flex-1">
                            <Button size="sm" className="w-full bg-red-500 hover:bg-red-600">
                              <ExternalLink className="mr-1 h-4 w-4" />
                              {t('fullscreen')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="h-48 rounded-lg overflow-hidden border border-border">
                          {liveLocation && (
                            <DriverLiveMap
                              latitude={liveLocation.latitude}
                              longitude={liveLocation.longitude}
                              heading={liveLocation.heading}
                              driverName={driver.name}
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowLiveMap(false)}
                          >
                            {t('hideMap')}
                          </Button>
                          <Link href={`/track/${driver.id}`}>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="mr-1 h-4 w-4" />
                              {t('fullscreen')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom CTA - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border lg:hidden z-50">
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500 h-14"
            onClick={handleCall}
          >
            <Phone className="mr-2 h-5 w-5" />
            {tDrivers('call')}
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-green-500 text-green-500 hover:bg-green-500 hover:text-white h-14"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            {tCommon('whatsapp')}
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-12 pb-20 lg:pb-0">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500">
                <Car className="h-4 w-4 text-black" />
              </div>
              <span className="text-lg font-bold">
                <span className="text-yellow-400">ei</span>
                <span className="text-white">taxi</span>
              </span>
            </Link>
            
            {/* Enlaces legales */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link href="/privacidad" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('privacyPolicy')}
              </Link>
              <span className="text-muted-foreground/50">•</span>
              <Link href="/terminos" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('termsOfService')}
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {tFooter('copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
