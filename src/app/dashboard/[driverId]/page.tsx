"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  User,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Check,
  Star,
  Building2,
  Route,
  Plane,
  Shield,
  Upload,
  X,
  Globe,
  Users,
  Eye,
  DollarSign,
  Plus,
  Trash2,
  Instagram,
  Facebook,
  Link as LinkIcon,
  Edit3,
  BarChart3,
  Settings,
  Save,
  Loader2,
  ArrowLeft,
  Calendar,
  CalendarDays,
  Navigation,
  AlertTriangle,
  Radio,
  Bell,
  BellRing,
  Smartphone,
  FileText,
  Key,
  Mail,
  Lock,
  Calculator,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import ScheduleSelector, { DaySchedule, TimeSlot } from "@/components/ScheduleSelector";
import PlaceSearch, { PlaceResult } from "@/components/PlaceSearch";
import { Progress } from "@/components/ui/progress";
import GPSTracking from "@/components/GPSTracking";
import RoutesZonesManager from "@/components/RoutesZonesManager";
import VehicleManager from "@/components/VehicleManager";
import FixedRoutesManager, { FixedRoute } from "@/components/FixedRoutesManager";
import DashboardBookingsTab from "@/components/DashboardBookingsTab";
import DashboardChatTab from "@/components/DashboardChatTab";
import DashboardTrashTab from "@/components/DashboardTrashTab";
import DriverNotificationsPanel from "@/components/dashboard/DriverNotificationsPanel";
import { useSession } from "@/hooks/useSession";
import { AuthGuard } from "@/components/SessionGuard";
import { LogOut } from "lucide-react";
import { SERVICE_OPTIONS as serviceOptions, LANGUAGE_OPTIONS as languageOptions, VEHICLE_TYPES as vehicleTypes } from "@/lib/constants";
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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
}

interface DriverRoute {
  id?: string;
  origin: string;
  originLat?: number;
  originLon?: number;
  destination: string;
  destinationLat?: number;
  destinationLon?: number;
  price?: number | null;
  distance?: number | null;
  isVerified?: boolean;
}

// Using DaySchedule from ScheduleSelector component instead of old Schedule format

interface Vehicle {
  id: string;
  driverId: string;
  vehicleType: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  passengerCapacity: number | null;
  licensePlate: string | null;
  imageUrl: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  contacts: number;
  services: string[];
  languages: string[];
  serviceZones: string[];
  basePrice: number | null;
  pricePerKm: number | null;
  hourlyRate: number | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  city: City;
  canton: Canton;
  driverRoutes: DriverRoute[];
  schedules: DaySchedule[];
}

// Constants - imported from shared constants file
// vehicleTypes, languageOptions are now imported from @/lib/constants

// Service icons mapping (for dashboard UI)
const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  airport: Plane,
  city: Building2,
  long_distance: Route,
  limousine: Car,
  corporate: Shield,
  events: Star,
  delivery: Route,
  night: Clock,
};

// Merge serviceOptions with icons for dashboard use
const serviceOptionsWithIcons = serviceOptions.map(s => ({
  ...s,
  icon: SERVICE_ICONS[s.id] || Building2,
}));

export default function DriverDashboardPageWrapper() {
  return (
    <AuthGuard>
      <DriverDashboardPage />
    </AuthGuard>
  );
}

function DriverDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const driverId = params.driverId as string;

  // Translations
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    experience: 1,
    description: "",
    vehicleType: "taxi",
    vehicleTypes: [] as string[],
    vehicleBrand: "",
    vehicleModel: "",
    vehicleYear: undefined as number | undefined,
    vehicleColor: "",
    passengerCapacity: undefined as number | undefined,
    isAvailable24h: true,
    services: [] as string[],
    languages: [] as string[],
    serviceZones: [] as string[],
    basePrice: undefined as number | undefined,
    pricePerKm: undefined as number | undefined,
    hourlyRate: undefined as number | undefined,
    website: "",
    instagram: "",
    facebook: "",
  });

  // Toggle vehicle type selection
  const toggleVehicleType = (typeId: string) => {
    setFormData(prev => {
      const isSelected = prev.vehicleTypes.includes(typeId);
      const newTypes = isSelected
        ? prev.vehicleTypes.filter(t => t !== typeId)
        : [...prev.vehicleTypes, typeId];
      return {
        ...prev,
        vehicleTypes: newTypes,
        vehicleType: newTypes[0] || "taxi"
      };
    });
  };

  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [is24h, setIs24h] = useState(true);

  // Service zones with exclusions
  const [serviceZonesWithExclusions, setServiceZonesWithExclusions] = useState<Array<{
    id?: string;
    zoneName: string;
    zoneType: string;
    zoneMode: string;
    exclusions: string[];
  }>>([]);
  const [zonesWarningDismissed, setZonesWarningDismissed] = useState(false);

  // Vehicles state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicleType: "taxi",
    brand: "",
    model: "",
    year: undefined as number | undefined,
    color: "",
    passengerCapacity: undefined as number | undefined,
    licensePlate: "",
  });

  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // GPS Tracking state
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [gpsReminderDismissed, setGpsReminderDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [autoExpandBookingId, setAutoExpandBookingId] = useState<string | null>(null);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const handleOpenBooking = useCallback((bookingId: string) => {
    setAutoExpandBookingId(bookingId);
    setActiveTab("bookings");
  }, []);

  const tabParam = searchParams.get('tab');
  const bookingParam = searchParams.get('booking');

  // Handle URL params from notification links
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
    if (bookingParam) {
      setAutoExpandBookingId(bookingParam);
    }
  }, [tabParam, bookingParam]);

  // Polling del contador de mensajes sin leer (siempre activo)
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/chat/driver");
        const data = await res.json();
        if (data.success && typeof data.data?.totalUnread === "number") {
          setChatUnreadCount(data.data.totalUnread);
        }
      } catch {
        // silencio
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  // Security/Account state - for changing password and email
  const [showSecurityForm, setShowSecurityForm] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityForm, setSecurityForm] = useState({
    newEmail: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Price calculator state
  const [customDistance, setCustomDistance] = useState<number>(10);

  // Calculate price based on distance
  const calculatePrice = (distance: number): number => {
    const basePrice = formData.basePrice || 0;
    const pricePerKm = formData.pricePerKm || 0;
    return basePrice + (pricePerKm * distance);
  };

  // Fetch GPS tracking status
  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const res = await fetch(`/api/driver/tracking?driverId=${driverId}`);
        const data = await res.json();
        if (data.success) {
          setTrackingEnabled(data.tracking?.enabled || false);
        }
      } catch (err) {
        console.error("Error fetching tracking status:", err);
      }
    };
    
    if (driverId) {
      fetchTracking();
      const interval = setInterval(fetchTracking, 30000);
      return () => clearInterval(interval);
    }
  }, [driverId]);

  // Fetch driver data
  useEffect(() => {
    const fetchDriver = async () => {
      try {
        const res = await fetch(`/api/drivers?id=${driverId}`);
        const data = await res.json();

        if (data.success) {
          setDriver(data.data);
          // Initialize form data
          setFormData({
            name: data.data.name || "",
            phone: data.data.phone || "",
            whatsapp: data.data.whatsapp || "",
            email: data.data.email || "",
            address: data.data.address || "",
            experience: data.data.experience || 1,
            description: data.data.description || "",
            vehicleType: data.data.vehicleType || "taxi",
            vehicleTypes: data.data.vehicleTypes || (data.data.vehicleType ? [data.data.vehicleType] : ["taxi"]),
            vehicleBrand: data.data.vehicleBrand || "",
            vehicleModel: data.data.vehicleModel || "",
            vehicleYear: data.data.vehicleYear || undefined,
            vehicleColor: data.data.vehicleColor || "",
            passengerCapacity: data.data.passengerCapacity || undefined,
            isAvailable24h: data.data.isAvailable24h ?? true,
            services: data.data.services || [],
            languages: data.data.languages || [],
            serviceZones: data.data.serviceZones || [],
            basePrice: data.data.basePrice || undefined,
            pricePerKm: data.data.pricePerKm || undefined,
            hourlyRate: data.data.hourlyRate || undefined,
            website: data.data.website || "",
            instagram: data.data.instagram || "",
            facebook: data.data.facebook || "",
          });
          setRoutes(data.data.driverRoutes || []);
          // Handle schedules - prefer workingHours (new format) over schedules (old format)
          console.log('🔍 Dashboard - Datos del driver:', {
            workingHours: data.data.workingHours,
            schedules: data.data.schedules,
            isAvailable24h: data.data.isAvailable24h
          });
          
          if (data.data.workingHours && Array.isArray(data.data.workingHours) && data.data.workingHours.length > 0) {
            console.log('🔍 Dashboard - Usando workingHours:', data.data.workingHours);
            setSchedules(data.data.workingHours);
          } else if (data.data.schedules && Array.isArray(data.data.schedules) && data.data.schedules.length > 0) {
            const convertedSchedules: DaySchedule[] = (data.data.schedules as Array<{
              dayOfWeek: number;
              startTime: string;
              endTime: string;
              isActive: boolean;
            }>).map(s => ({
              dayOfWeek: s.dayOfWeek,
              mode: s.isActive ? 'specific' as const : 'closed' as const,
              slots: s.isActive ? [{ id: Math.random().toString(36).substring(7), startTime: s.startTime, endTime: s.endTime }] : []
            }));
            console.log('🔍 Dashboard - Horarios convertidos de formato antiguo:', convertedSchedules);
            setSchedules(convertedSchedules);
          } else {
            console.log('🔍 Dashboard - Sin horarios guardados');
            setSchedules([]);
          }
          const hasRealSchedules = data.data.hasRealSchedules ?? false;
          const finalIs24h = !hasRealSchedules;
          setIs24h(finalIs24h);
          console.log('🔍 Dashboard - hasRealSchedules:', hasRealSchedules, 'is24h final:', finalIs24h);
          setImagePreview(data.data.imageUrl || null);
          setServiceZonesWithExclusions(data.data.driverServiceZones || []);
          fetchVehicles();
        } else {
          setError(data.error || t('notFound'));
        }
      } catch (err) {
        setError(t('loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (driverId) {
      fetchDriver();
    }
  }, [driverId, t]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t('imageSizeError'));
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle functions
  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const toggleLanguage = (langId: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(langId)
        ? prev.languages.filter(l => l !== langId)
        : [...prev.languages, langId],
    }));
  };

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      const res = await fetch(`/api/vehicles?driverId=${driverId}`);
      const data = await res.json();
      if (data.success) {
        setVehicles(data.data);
      }
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    }
  };

  // Add vehicle
  const handleAddVehicle = async () => {
    if (!newVehicle.vehicleType) {
      setError(t('selectVehicleType'));
      return;
    }

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          ...newVehicle,
          year: newVehicle.year || null,
          passengerCapacity: newVehicle.passengerCapacity || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVehicles([...vehicles, data.data]);
        setNewVehicle({
          vehicleType: "taxi",
          brand: "",
          model: "",
          year: undefined,
          color: "",
          passengerCapacity: undefined,
          licensePlate: "",
        });
        setShowVehicleForm(false);
        setSuccess(t('vehicle.added'));
      } else {
        setError(data.error || t('vehicle.addError'));
      }
    } catch (err) {
      setError(tCommon('connectionError'));
    }
  };

  // Update vehicle
  const handleUpdateVehicle = async () => {
    if (!editingVehicle) return;

    try {
      const res = await fetch("/api/vehicles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingVehicle.id,
          driverId,
          vehicleType: editingVehicle.vehicleType,
          brand: editingVehicle.brand,
          model: editingVehicle.model,
          year: editingVehicle.year,
          color: editingVehicle.color,
          passengerCapacity: editingVehicle.passengerCapacity,
          licensePlate: editingVehicle.licensePlate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVehicles(vehicles.map(v => v.id === data.data.id ? data.data : v));
        setEditingVehicle(null);
        setSuccess(t('vehicle.updated'));
      } else {
        setError(data.error || t('vehicle.updateError'));
      }
    } catch (err) {
      setError(tCommon('connectionError'));
    }
  };

  // Delete vehicle
  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm(t('vehicle.confirmDelete'))) return;

    try {
      const res = await fetch(`/api/vehicles?id=${vehicleId}&driverId=${driverId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setVehicles(vehicles.filter(v => v.id !== vehicleId));
        setSuccess(t('vehicle.deleted'));
      } else {
        setError(data.error || t('vehicle.deleteError'));
      }
    } catch (err) {
      setError(tCommon('connectionError'));
    }
  };

  // Set primary vehicle
  const handleSetPrimaryVehicle = async (vehicleId: string) => {
    try {
      const res = await fetch("/api/vehicles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: vehicleId,
          driverId,
          isPrimary: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVehicles(vehicles.map(v => ({
          ...v,
          isPrimary: v.id === vehicleId
        })));
        setSuccess(t('vehicle.primaryUpdated'));
      }
    } catch (err) {
      setError(t('vehicle.primaryUpdateError'));
    }
  };

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload image if changed
      let imageUrl = driver?.imageUrl;
      if (imageFile) {
        const formDataImg = new FormData();
        formDataImg.append("file", imageFile);
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formDataImg,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          imageUrl = uploadData.url;
        }
      }

      const response = await fetch("/api/drivers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: driverId,
          ...formData,
          isAvailable24h: is24h,
          imageUrl,
          routes,
          schedules: is24h ? null : schedules,
          serviceZones: serviceZonesWithExclusions.map(z => z.zoneName),
          serviceZonesWithExclusions: serviceZonesWithExclusions,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDriver(data.data);

        if (data.data.driverServiceZones) {
          setServiceZonesWithExclusions(data.data.driverServiceZones);
        }

        // Refrescar horarios inmediatamente para que el GPS se sincronice al instante
        if (data.data.workingHours && Array.isArray(data.data.workingHours) && data.data.workingHours.length > 0) {
          setSchedules(data.data.workingHours);
          const hasRealSchedules = data.data.workingHours.some(
            (s: { mode: string; slots?: unknown[] }) => s.mode !== 'closed' && s.slots && s.slots.length > 0
          );
          setIs24h(!hasRealSchedules);
        } else {
          setSchedules([]);
          setIs24h(true);
        }

        setSuccess(t('profileUpdated'));
        setTimeout(() => setSuccess(null), 3000);
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          setError(data.errors.join('\n'));
        } else {
          setError(data.error || t('profileUpdateError'));
        }
      }
    } catch (err) {
      setError(tCommon('connectionError'));
    } finally {
      setSaving(false);
    }
  };

  // Handle security changes (email and password)
  const handleSecurityChange = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (securityForm.newEmail && !securityForm.currentPassword) {
      setError(t('emailChangePasswordRequired'));
      return;
    }

    if (securityForm.newPassword) {
      if (securityForm.newPassword.length < 6) {
        setError(t('security.minPassword'));
        return;
      }
      if (!securityForm.currentPassword) {
        setError(t('security.currentPasswordRequired'));
        return;
      }
      if (securityForm.newPassword !== securityForm.confirmPassword) {
        setError(t('security.passwordMismatch'));
        return;
      }
    }

    if (!securityForm.newEmail && !securityForm.newPassword) {
      setError(t('noChanges'));
      return;
    }

    setSecurityLoading(true);

    try {
      const response = await fetch("/api/driver/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          currentPassword: securityForm.currentPassword,
          newEmail: securityForm.newEmail || null,
          newPassword: securityForm.newPassword || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || t('changesSaved'));
        setSecurityForm({
          newEmail: "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowSecurityForm(false);
        
        // Update driver email in local state if changed
        if (data.newEmail) {
          setFormData(prev => ({ ...prev, email: data.newEmail }));
          if (driver) {
            setDriver({ ...driver, email: data.newEmail });
          }
        }
        
        // Update session if email changed
        if (data.newEmail) {
          const session = localStorage.getItem('eitaxi_session');
          if (session) {
            const sessionData = JSON.parse(session);
            sessionData.email = data.newEmail;
            localStorage.setItem('eitaxi_session', JSON.stringify(sessionData));
          }
        }
        
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || t('saveError'));
      }
    } catch (err) {
      setError(tCommon('connectionError'));
    } finally {
      setSecurityLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !driver) {
    const handleLogout = async () => {
      try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
      localStorage.removeItem('eitaxi_session');
      localStorage.removeItem('eitaxi_driver_id');
      document.cookie = 'eitaxi_driver_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push('/login');
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center border-border">
          <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('notFound')}</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleLogout}
              className="bg-yellow-400 text-black hover:bg-yellow-500"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('loginButton')}
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('backToHome')}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const publicUrl = driver ? `/${driver.canton.slug}/${driver.city.slug}/${driver.slug}` : "";

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
            <div className="flex items-center gap-1 sm:gap-3">
              <DriverNotificationsPanel />
              <LanguageSwitcher />
              <Link href={publicUrl} target="_blank" className="hidden sm:block">
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  {t('viewPublicProfile')}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={async () => {
                  if (confirm(t('confirmLogout'))) {
                    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
                    localStorage.removeItem('eitaxi_session');
                    localStorage.removeItem('eitaxi_driver_id');
                    document.cookie = 'eitaxi_driver_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                    router.push('/');
                  }
                }}
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </Button>
              <Button
                className="bg-yellow-400 text-black hover:bg-yellow-500"
                onClick={handleSave}
                disabled={saving}
                size="sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-1 sm:mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">{t('saving')}</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{t('saveChanges')}</span>
                    <span className="sm:hidden">{t('save')}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Success/Error messages */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500"
          >
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive whitespace-pre-line"
          >
            {error}
          </motion.div>
        )}

        {/* GPS Reminder Banner */}
        <AnimatePresence>
          {!trackingEnabled && !gpsReminderDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-6 relative overflow-hidden"
            >
              <div className="relative p-4 sm:p-6 rounded-xl bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 border-2 border-orange-500/50 shadow-lg shadow-orange-500/10">
                {/* Animated background pulse */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 animate-pulse" />
                
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Icon with animation */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <BellRing className="h-10 w-10 text-orange-400 animate-bounce" />
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500"></span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      {t('gpsReminder')}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('gpsReminderDesc')}
                      <span className="text-orange-400 font-medium">{t('gpsReminderHighlight')}</span>
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold shadow-lg"
                      onClick={() => {
                        setActiveTab("gps");
                        setTimeout(() => {
                          tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      {t('activateGps')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setGpsReminderDismissed(true)}
                    >
                      {t('remindLater')}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zones Warning Banner */}
        <AnimatePresence>
          {serviceZonesWithExclusions.filter(z => z.zoneMode === 'pickup').length === 0 && !zonesWarningDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-6 relative overflow-hidden"
            >
              <div className="relative p-4 sm:p-6 rounded-xl bg-gradient-to-r from-red-500/20 via-red-600/20 to-red-500/20 border-2 border-red-500/50 shadow-lg shadow-red-500/10">
                {/* Animated background pulse */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 animate-pulse" />
                
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Icon with animation */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <MapPin className="h-10 w-10 text-red-400" />
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      {t('zonesWarning')}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('zonesWarningDesc')}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold shadow-lg"
                      onClick={() => {
                        setActiveTab("zones");
                        setTimeout(() => {
                          tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      {t('configureZones')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setZonesWarningDismissed(true)}
                    >
                      {t('remindLater')}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GPS Status Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            trackingEnabled 
              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
            <Radio className={`h-4 w-4 ${trackingEnabled ? "animate-pulse" : ""}`} />
            GPS {trackingEnabled ? t('gpsActivated') : t('gpsDeactivated')}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{driver?.views || 0}</div>
                  <div className="text-xs text-muted-foreground">{t('stats.profileViews')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-400/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{driver?.contacts || 0}</div>
                  <div className="text-xs text-muted-foreground">{t('stats.contacts')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-400/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{driver?.rating.toFixed(1) || "5.0"}</div>
                  <div className="text-xs text-muted-foreground">{t('stats.rating')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-400/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{driver?.experience || 0}</div>
                  <div className="text-xs text-muted-foreground">{t('stats.yearsExperience')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile completion */}
        <Card className="border-border bg-card mb-8">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{t('completeness')}</span>
              <span className="text-yellow-400 font-medium">
                {Math.round(
                  ([
                    formData.name,
                    formData.phone,
                    formData.description,
                    imagePreview,
                    formData.vehicleBrand,
                    formData.services.length > 0,
                    formData.languages.length > 0,
                    routes.length > 0,
                  ].filter(Boolean).length / 8) * 100
                )}%
              </span>
            </div>
            <Progress
              value={Math.round(
                ([
                  formData.name,
                  formData.phone,
                  formData.description,
                  imagePreview,
                  formData.vehicleBrand,
                  formData.services.length > 0,
                  formData.languages.length > 0,
                  routes.length > 0,
                ].filter(Boolean).length / 8) * 100
              )}
              className="h-2"
            />
          </CardContent>
        </Card>

        {/* Public URL */}
        <Card className="border-yellow-400/30 bg-yellow-400/5 mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium mb-1">{t('publicUrl')}</h3>
                <code className="text-yellow-400 text-sm">
                  eitaxi.ch{publicUrl}
                </code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(`https://eitaxi.ch${publicUrl}`)}
              >
                {t('copyLink')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Widget / Quick GPS Access */}
        <Card className="border-purple-400/30 bg-purple-400/5 mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">{t('quickGps')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('quickGpsDesc')}
                  </p>
                </div>
              </div>
              <Link href={`/widget?driverId=${driverId}`} target="_blank">
                <Button
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  {t('openGpsPage')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div ref={tabsRef}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="w-full overflow-x-auto pb-2 -mb-2 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full md:grid md:grid-cols-11 md:w-full">
              <TabsTrigger value="basic" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <User className="mr-1.5 h-4 w-4" />
                {t('tabs.basic')}
              </TabsTrigger>
              <TabsTrigger value="vehicle" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <Car className="mr-1.5 h-4 w-4" />
                {t('tabs.vehicle')}
              </TabsTrigger>
              <TabsTrigger value="services" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <Star className="mr-1.5 h-4 w-4" />
                {t('tabs.services')}
              </TabsTrigger>
              <TabsTrigger value="prices" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <DollarSign className="mr-1.5 h-4 w-4" />
                {t('tabs.prices')}
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <Clock className="mr-1.5 h-4 w-4" />
                {t('tabs.schedule')}
              </TabsTrigger>
              <TabsTrigger value="zones" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <MapPin className="mr-1.5 h-4 w-4" />
                {t('tabs.zones')}
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap relative">
                <CalendarDays className="mr-1.5 h-4 w-4" />
                Reservas
                {chatUnreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap relative">
                <MessageCircle className="mr-1.5 h-4 w-4" />
                Chat
                {chatUnreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {chatUnreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="trash" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <Trash2 className="mr-1.5 h-4 w-4" />
                Papelera
              </TabsTrigger>
              <TabsTrigger value="gps" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <Navigation className="mr-1.5 h-4 w-4" />
                {t('tabs.gps')}
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <Shield className="mr-1.5 h-4 w-4" />
                {t('tabs.privacy')}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-yellow-400" />
                  {t('basicInfo.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Photo */}
                <div>
                  <Label>{t('basicInfo.profilePhoto')}</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="w-24 h-24 object-cover rounded-lg border border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-yellow-400 hover:bg-yellow-400/5 transition-all"
                      >
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="text-sm text-muted-foreground">
                      <p>{t('basicInfo.photoHint')}</p>
                      <p>{t('basicInfo.photoRecommended')}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">{t('basicInfo.name')} *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">{t('basicInfo.yearsExperience')}</Label>
                    <Input
                      id="experience"
                      type="number"
                      min={0}
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">{t('basicInfo.phone')} *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp || ""}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">{t('basicInfo.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="description">{t('basicInfo.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1.5 min-h-[120px]"
                    placeholder={t('basicInfo.descriptionPlaceholder')}
                  />
                </div>

                <Separator />

                {/* Social Media */}
                <h3 className="font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-yellow-400" />
                  {t('basicInfo.socialMedia')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="website">{t('basicInfo.website')}</Label>
                    <div className="relative mt-1.5">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website"
                        value={formData.website || ""}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="pl-10"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="instagram">{t('basicInfo.instagram')}</Label>
                    <div className="relative mt-1.5">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="instagram"
                        value={formData.instagram || ""}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        className="pl-10"
                        placeholder="@usuario"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="facebook">{t('basicInfo.facebook')}</Label>
                    <div className="relative mt-1.5">
                      <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="facebook"
                        value={formData.facebook || ""}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                        className="pl-10"
                        placeholder="pagina"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicle Tab */}
          <TabsContent value="vehicle">
            <Card className="border-border bg-card">
              <CardContent className="pt-6">
                <VehicleManager
                  mode="edit"
                  driverId={driverId}
                  initialVehicles={vehicles}
                  onError={(err) => setError(err)}
                  onSuccess={(msg) => {
                    setSuccess(msg);
                    setTimeout(() => setSuccess(null), 3000);
                    fetchVehicles();
                  }}
                  showTitle={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  {t('servicesAndLanguages')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>{t('servicesOffered')}</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {serviceOptionsWithIcons.map((service) => {
                      const isSelected = formData.services.includes(service.id);
                      const Icon = service.icon;
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            isSelected
                              ? "border-yellow-400 bg-yellow-400/10"
                              : "border-border hover:border-yellow-400/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-5 w-5 ${isSelected ? "text-yellow-400" : "text-muted-foreground"}`} />
                            <span className="font-medium">{service.label}</span>
                            {isSelected && <Check className="h-4 w-4 text-yellow-400 ml-auto" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>{t('languagesSpoken')}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {languageOptions.map((lang) => {
                      const isSelected = formData.languages.includes(lang.id);
                      return (
                        <Badge
                          key={lang.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer transition-all ${
                            isSelected
                              ? "bg-yellow-400 text-black hover:bg-yellow-500"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => toggleLanguage(lang.id)}
                        >
                          <span className="mr-1.5">{lang.flag}</span>
                          {lang.label}
                          {isSelected && <Check className="ml-1 h-3 w-3" />}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prices Tab */}
          <TabsContent value="prices">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-400" />
                  {t('prices.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Base prices */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="basePrice">{t('prices.basePrice')}</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      min={0}
                      value={formData.basePrice || ""}
                      onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || undefined })}
                      className="mt-1.5"
                      placeholder="Ej: 5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t('prices.initialRate')}</p>
                  </div>
                  <div>
                    <Label htmlFor="pricePerKm">{t('prices.pricePerKm')}</Label>
                    <Input
                      id="pricePerKm"
                      type="number"
                      min={0}
                      step="0.1"
                      value={formData.pricePerKm || ""}
                      onChange={(e) => setFormData({ ...formData, pricePerKm: parseFloat(e.target.value) || undefined })}
                      className="mt-1.5"
                      placeholder="Ej: 2.50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t('prices.perKm')}</p>
                  </div>
                  <div>
                    <Label htmlFor="hourlyRate">{t('prices.hourlyRate')}</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      min={0}
                      value={formData.hourlyRate || ""}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || undefined })}
                      className="mt-1.5"
                      placeholder="Ej: 60"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t('prices.forLimousines')}</p>
                  </div>
                </div>

                {/* Price Calculator */}
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="h-5 w-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold">{t('prices.calculator')}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('prices.calculatorDesc')}
                  </p>

                  {/* Quick Examples */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { distance: 5, label: t('prices.shortTrip'), example: t('prices.cityCenter') },
                      { distance: 15, label: t('prices.mediumTrip'), example: t('prices.nearbyTowns') },
                      { distance: 30, label: t('prices.longTrip'), example: t('prices.neighboringCity') },
                      { distance: 50, label: t('prices.longDistance'), example: t('prices.anotherCanton') },
                    ].map((item) => (
                      <motion.div
                        key={item.distance}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          customDistance === item.distance
                            ? "border-yellow-400 bg-yellow-400/10"
                            : "border-border bg-card hover:border-yellow-400/50"
                        }`}
                        onClick={() => setCustomDistance(item.distance)}
                      >
                        <div className="text-center">
                          <div className="text-3xl font-bold text-yellow-400 mb-1">
                            {calculatePrice(item.distance).toFixed(2)} CHF
                          </div>
                          <div className="text-sm font-medium">{item.distance} km</div>
                          <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                          <div className="text-xs text-muted-foreground">{item.example}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Custom Distance Calculator */}
                  <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-400/5 via-orange-400/5 to-yellow-400/5 border border-yellow-400/20">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-yellow-400" />
                      <h4 className="font-semibold">{t('prices.customCalculator')}</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Distance Input */}
                      <div>
                        <Label htmlFor="customDistance">{t('prices.tripDistance')}</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <input
                            type="range"
                            id="customDistance"
                            min="1"
                            max="200"
                            value={customDistance}
                            onChange={(e) => setCustomDistance(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-yellow-400"
                          />
                          <Input
                            type="number"
                            min="1"
                            max="500"
                            value={customDistance}
                            onChange={(e) => setCustomDistance(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-24 text-center"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('prices.sliderHint')}
                        </p>
                      </div>

                      {/* Price Result */}
                      <div className="flex flex-col justify-center">
                        <div className="text-center p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/30">
                          <div className="text-sm text-muted-foreground mb-1">{t('prices.estimatedPrice')}</div>
                          <div className="text-4xl font-bold text-yellow-400">
                            {calculatePrice(customDistance).toFixed(2)} CHF
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {formData.basePrice || 0} CHF base + {((formData.pricePerKm || 0) * customDistance).toFixed(2)} CHF por {customDistance} km
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="mt-6 p-4 rounded-lg bg-muted/50">
                      <h5 className="font-medium mb-3 text-sm">{t('prices.priceBreakdown')}</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('prices.base')}</span>
                          <span className="font-medium">{(formData.basePrice || 0).toFixed(2)} CHF</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('prices.perKmLabel')}</span>
                          <span className="font-medium">{(formData.pricePerKm || 0).toFixed(2)} CHF/km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('prices.distanceLabel')}</span>
                          <span className="font-medium">{customDistance} km</span>
                        </div>
                        <div className="border-t border-border pt-2 mt-2 flex justify-between">
                          <span className="font-medium">{t('prices.total')}</span>
                          <span className="font-bold text-yellow-400">{calculatePrice(customDistance).toFixed(2)} CHF</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Popular Routes Examples */}
                  {(formData.basePrice || formData.pricePerKm) && (
                    <div className="mt-6">
                      <h5 className="font-medium mb-3 text-sm flex items-center gap-2">
                        <Route className="h-4 w-4 text-yellow-400" />
                        {t('prices.popularRoutes')}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { from: "Zúrich", to: "Basilea", dist: 85 },
                          { from: "Ginebra", to: "Lausana", dist: 62 },
                          { from: "Bern", to: "Zúrich", dist: 125 },
                          { from: "Zúrich", to: "Lucerna", dist: 52 },
                          { from: "Basilea", to: "Bern", dist: 97 },
                          { from: "Zúrich", to: "Aeropuerto", dist: 12 },
                        ].map((route, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setCustomDistance(route.dist)}
                          >
                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                              <MapPin className="h-3 w-3" />
                              <span>{route.from} → {route.to}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">{route.dist} km</span>
                              <span className="font-bold text-yellow-400">{calculatePrice(route.dist).toFixed(2)} CHF</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Info box */}
                {!formData.basePrice && !formData.pricePerKm && (
                  <div className="mt-4 p-4 rounded-lg bg-blue-400/10 border border-blue-400/30">
                    <p className="text-sm text-blue-400">
                      {t('prices.priceTip')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-400" />
                  {t('schedule.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScheduleSelector
                  initialSchedules={schedules}
                  onSchedulesChange={setSchedules}
                  is24h={is24h}
                  on24hChange={setIs24h}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Zonas Tab */}
          <TabsContent value="zones">
            {/* Explicación para el taxista */}
            <Card className="border-blue-400/30 bg-blue-400/5 mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-400 mb-2">{t('zones.whatAreZones')}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {t('zones.zonesDesc')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>{t('zones.canton')}</strong> {t('zones.cantonDesc')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>{t('zones.district')}</strong> {t('zones.districtDesc')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>{t('zones.municipality')}</strong> {t('zones.municipalityDesc')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>{t('zones.exclusions')}</strong> {t('zones.exclusionsDesc')}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      💡 {t('zones.zonesTip')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {driver && (
              <RoutesZonesManager 
                driverId={driverId} 
                baseCity={driver.city?.name || ''} 
                baseCanton={driver.canton?.name || ''}
                onZonesChange={(zones) => {
                  setServiceZonesWithExclusions(zones);
                }}
              />
            )}

            {/* Rutas con precio fijo */}
            <div className="mt-6">
              <FixedRoutesManager
                initialRoutes={routes}
                onRoutesChange={(updatedRoutes) => {
                  setRoutes(updatedRoutes);
                }}
                mode="edit"
                driverId={driverId}
                onError={(err) => setError(err)}
                onSuccess={(msg) => {
                  setSuccess(msg);
                  setTimeout(() => setSuccess(null), 3000);
                }}
              />
            </div>
          </TabsContent>

          {/* GPS Tab */}
          <TabsContent value="gps">
            <GPSTracking
              driverId={driverId}
              onTrackingChange={(enabled) => setTrackingEnabled(enabled)}
              schedules={schedules}
              is24h={is24h}
              onIs24hChange={(value) => setIs24h(value)}
              onNavigateToSchedules={() => {
                setActiveTab("schedule");
                setTimeout(() => {
                  tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }}
            />
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-yellow-400" />
                  Reservas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {driver && <DashboardBookingsTab driverId={driver.id} autoExpandBookingId={autoExpandBookingId} />}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-yellow-400" />
                  Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                {driver && <DashboardChatTab driverId={driver.id} onOpenBooking={handleOpenBooking} onUnreadCountChange={setChatUnreadCount} autoOpenConvId={activeTab === "chat" ? autoExpandBookingId : null} />}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trash Tab */}
          <TabsContent value="trash">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-yellow-400" />
                  Papelera
                </CardTitle>
              </CardHeader>
              <CardContent>
                {driver && <DashboardTrashTab driverId={driver.id} />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <div className="space-y-6">
              {/* Data Info Card */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-yellow-400" />
                    {t('privacy.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">
                    {t('privacy.nDSGDesc')}
                  </p>

                  {/* Data stored */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-medium mb-3">{t('privacy.dataStored')}</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>{t('privacy.profileData')}</strong> {t('privacy.profileDataDesc')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>{t('privacy.professionalData')}</strong> {t('privacy.professionalDataDesc')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>{t('privacy.locationData')}</strong> {t('privacy.locationDataDesc')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>{t('privacy.statsData')}</strong> {t('privacy.statsDataDesc')}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Export Data */}
                    <Card className="border-blue-400/30 bg-blue-400/5">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-blue-400" />
                          {t('dataManagement.exportData')}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          {t('dataManagement.exportDescription')}
                        </p>
                        <Button
                          variant="outline"
                          className="w-full border-blue-400 text-blue-400 hover:bg-blue-400/10"
                          onClick={() => {
                            if (driver) {
                              const exportData = {
                                perfil: {
                                  nombre: driver.name,
                                  email: driver.email,
                                  telefono: driver.phone,
                                  whatsapp: driver.whatsapp,
                                  experiencia: driver.experience,
                                  descripcion: driver.description,
                                },
                                vehiculo: {
                                  tipo: driver.vehicleType,
                                  marca: driver.vehicleBrand,
                                  modelo: driver.vehicleModel,
                                  año: driver.vehicleYear,
                                  color: driver.vehicleColor,
                                  capacidad: driver.passengerCapacity,
                                },
                                servicios: driver.services,
                                idiomas: driver.languages,
                                zonas: driver.serviceZones,
                                ubicacion: {
                                  canton: driver.canton?.name,
                                  ciudad: driver.city?.name,
                                },
                                estadisticas: {
                                  vistas: driver.views,
                                  contactos: driver.contacts,
                                  valoracion: driver.rating,
                                  reseñas: driver.reviewCount,
                                },
                                exportadoEn: new Date().toISOString(),
                              };
                              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `eitaxi-datos-${driver.slug}.json`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }
                          }}
                        >
                          {t('privacy.downloadJson')}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Request Data Access */}
                    <Card className="border-purple-400/30 bg-purple-400/5">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-400" />
                          {t('privacy.requestAccess')}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          {t('privacy.requestAccessDesc')}
                        </p>
                        <a href="mailto:privacidad@eitaxi.ch?subject=Solicitud de acceso a datos - eitaxi">
                          <Button
                            variant="outline"
                            className="w-full border-purple-400 text-purple-400 hover:bg-purple-400/10"
                          >
                            {t('privacy.sendRequest')}
                          </Button>
                        </a>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Security Card - Change Email & Password */}
              <Card className="border-yellow-400/30 bg-yellow-400/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-yellow-400" />
                    {t('security.accountSecurity')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t('security.currentEmail')} <span className="text-foreground font-medium">{driver?.email}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('security.changeCredentials')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowSecurityForm(!showSecurityForm)}
                      className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      {showSecurityForm ? tCommon('cancel') : t('security.changeCredentials')}
                    </Button>
                  </div>

                  {/* Security Form */}
                  <AnimatePresence>
                    {showSecurityForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 border-t border-border space-y-4">
                          {/* New Email */}
                          <div>
                            <Label htmlFor="newEmail" className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {t('security.newEmailHint')}
                            </Label>
                            <Input
                              id="newEmail"
                              type="text"
                              placeholder="nuevo@email.com"
                              value={securityForm.newEmail}
                              onChange={(e) => setSecurityForm({ ...securityForm, newEmail: e.target.value })}
                              className="mt-1.5"
                            />
                          </div>

                          {/* Current Password */}
                          <div>
                            <Label htmlFor="currentPassword" className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              {t('security.currentPassword')} *
                            </Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              placeholder="Tu contraseña actual"
                              value={securityForm.currentPassword}
                              onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                              className="mt-1.5"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('security.passwordRequiredHint')}
                            </p>
                          </div>

                          {/* New Password */}
                          <div>
                            <Label htmlFor="newPassword" className="flex items-center gap-2">
                              <Key className="h-4 w-4" />
                              {t('security.newPasswordHint')}
                            </Label>
                            <Input
                              id="newPassword"
                              type="password"
                              placeholder="Mínimo 6 caracteres"
                              value={securityForm.newPassword}
                              onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                              className="mt-1.5"
                            />
                          </div>

                          {/* Confirm New Password */}
                          {securityForm.newPassword && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                            >
                              <Label htmlFor="confirmPassword">{t('security.confirmNewPassword')}</Label>
                              <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Repite la nueva contraseña"
                                value={securityForm.confirmPassword}
                                onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                                className="mt-1.5"
                              />
                            </motion.div>
                          )}

                          {/* Submit Button */}
                          <div className="flex justify-end gap-3 pt-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowSecurityForm(false);
                                setSecurityForm({
                                  newEmail: "",
                                  currentPassword: "",
                                  newPassword: "",
                                  confirmPassword: "",
                                });
                              }}
                            >
                              {tCommon('cancel')}
                            </Button>
                            <Button
                              className="bg-yellow-400 text-black hover:bg-yellow-500"
                              onClick={handleSecurityChange}
                              disabled={securityLoading}
                            >
                              {securityLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {t('saving')}
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  {t('saveChanges')}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Delete Account Card */}
              <Card className="border-red-400/30 bg-red-400/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    {t('privacy.dangerZone')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <h4 className="font-medium text-red-400 mb-2">{t('dataManagement.deleteAccount')}</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('privacy.deleteAccountDesc')}
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                      <li>• {t('privacy.deleteBullet1')}</li>
                      <li>• {t('privacy.deleteBullet2')}</li>
                      <li>• {t('privacy.deleteBullet3')}</li>
                      <li>• {t('privacy.deleteBullet4')}</li>
                    </ul>
                    <Button
                      variant="destructive"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        if (confirm(t('dataManagement.deleteConfirm'))) {
                          const subject = encodeURIComponent('Solicitud de eliminación de cuenta y datos');
                          const body = encodeURIComponent(`Hola,

Deseo solicitar la eliminación completa de mi cuenta y todos mis datos personales de eitaxi.

Mis datos:
- ID de conductor: ${driverId}
- Nombre: ${driver?.name || ''}
- Email: ${driver?.email || ''}

Confirmo que entiendo que:
- Esta acción es irreversible
- Mi perfil será eliminado inmediatamente
- Todos mis datos serán eliminados en un plazo de 30 días según la nDSG

Atentamente,
${driver?.name || ''}`);
                          window.location.href = `mailto:privacidad@eitaxi.ch?subject=${subject}&body=${body}`;
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('privacy.requestDeleteAccount')}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {t('privacy.nDSGArticle')}
                  </p>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card className="border-yellow-400/30 bg-yellow-400/5">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-yellow-400" />
                    {t('privacy.dataQuestions')}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('privacy.dataQuestionsDesc')}
                  </p>
                  <a
                    href="mailto:privacidad@eitaxi.ch"
                    className="text-yellow-400 hover:underline text-sm"
                  >
                    privacidad@eitaxi.ch
                  </a>
                  <p className="text-xs text-muted-foreground mt-3">
                    {t('privacy.complaintText')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </div>

        {/* Save button fixed at bottom on mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border md:hidden z-50">
          <Button
            className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('saveChanges')}
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
