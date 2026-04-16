"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { useSession } from "@/hooks/useSession";
import { LogOut } from "lucide-react";
import { SERVICE_OPTIONS as serviceOptions, LANGUAGE_OPTIONS as languageOptions, VEHICLE_TYPES as vehicleTypes } from "@/lib/constants";

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

export default function DriverDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.driverId as string;

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
        vehicleType: newTypes[0] || "taxi" // Mantener el primero como principal para compatibilidad
      };
    });
  };

  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [is24h, setIs24h] = useState(true);

  // Service zones with exclusions - MISMO NOMBRE que en Registro
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
      // Refrescar cada 30 segundos
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
          
          // Priorizar workingHours que tiene el formato nuevo { dayOfWeek, mode, slots }
          if (data.data.workingHours && Array.isArray(data.data.workingHours) && data.data.workingHours.length > 0) {
            // Use workingHours directly (new format with mode and slots)
            setSchedules(data.data.workingHours);
          } else if (data.data.schedules && Array.isArray(data.data.schedules) && data.data.schedules.length > 0) {
            // Convert old format to new format
            // El formato antiguo es: { dayOfWeek, startTime, endTime, isActive }
            // El formato nuevo es: { dayOfWeek, mode: 'specific'|'closed'|'all_day', slots: [{id, startTime, endTime}] }
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
            setSchedules(convertedSchedules);
          } else {
            setSchedules([]);
          }
          // Set 24h mode from data
          // Usar hasRealSchedules de la API si está disponible
          const hasRealSchedules = data.data.hasRealSchedules ?? false;
          
          // Lógica clara:
          // - Si hay horarios guardados → is24h = false (mostrar horarios fijos)
          // - Si no hay horarios guardados → is24h = true (modo flexible / sin horario fijo)
          const finalIs24h = !hasRealSchedules;
          setIs24h(finalIs24h);
          setImagePreview(data.data.imageUrl || null);
          // Set service zones - MISMO NOMBRE que en Registro
          setServiceZonesWithExclusions(data.data.driverServiceZones || []);
          // Fetch vehicles
          fetchVehicles();
        } else {
          setError(data.error || "Conductor no encontrado");
        }
      } catch (err) {
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    if (driverId) {
      fetchDriver();
    }
  }, [driverId]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen no puede superar los 5MB");
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
      setError("Selecciona un tipo de vehículo");
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
        setSuccess("Vehículo añadido correctamente");
      } else {
        setError(data.error || "Error al añadir vehículo");
      }
    } catch (err) {
      setError("Error de conexión");
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
        setSuccess("Vehículo actualizado correctamente");
      } else {
        setError(data.error || "Error al actualizar vehículo");
      }
    } catch (err) {
      setError("Error de conexión");
    }
  };

  // Delete vehicle
  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm("¿Estás seguro de eliminar este vehículo?")) return;

    try {
      const res = await fetch(`/api/vehicles?id=${vehicleId}&driverId=${driverId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setVehicles(vehicles.filter(v => v.id !== vehicleId));
        setSuccess("Vehículo eliminado correctamente");
      } else {
        setError(data.error || "Error al eliminar vehículo");
      }
    } catch (err) {
      setError("Error de conexión");
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
        setSuccess("Vehículo principal actualizado");
      }
    } catch (err) {
      setError("Error al actualizar vehículo principal");
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
        
        // Actualizar zonas si el API las devuelve
        if (data.data.driverServiceZones) {
          setServiceZonesWithExclusions(data.data.driverServiceZones);
        }
        setSuccess("Perfil actualizado correctamente");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Error al actualizar el perfil");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
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
      setError("Debes introducir tu contraseña actual para cambiar el email");
      return;
    }

    if (securityForm.newPassword) {
      if (securityForm.newPassword.length < 8) {
        setError("La nueva contraseña debe tener al menos 8 caracteres e incluir una letra y un número");
        return;
      }
      if (!securityForm.currentPassword) {
        setError("Debes introducir tu contraseña actual");
        return;
      }
      if (securityForm.newPassword !== securityForm.confirmPassword) {
        setError("Las contraseñas nuevas no coinciden");
        return;
      }
    }

    if (!securityForm.newEmail && !securityForm.newPassword) {
      setError("No hay cambios que guardar");
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
        setSuccess(data.message || "Cambios guardados correctamente");
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
        setError(data.error || "Error al guardar los cambios");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
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
          <p className="text-muted-foreground">Cargando panel...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !driver) {
    const handleLogout = () => {
      localStorage.removeItem('eitaxi_session');
      document.cookie = 'eitaxi_driver_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push('/login');
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center border-border">
          <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Panel no encontrado</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleLogout}
              className="bg-yellow-400 text-black hover:bg-yellow-500"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Iniciar sesión
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
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
              <Link href={publicUrl} target="_blank" className="hidden sm:block">
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  Ver perfil público
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                    localStorage.removeItem('eitaxi_session');
                    document.cookie = 'eitaxi_driver_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                    router.push('/');
                  }
                }}
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cerrar sesión</span>
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
                    <span className="hidden sm:inline">Guardando...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Guardar cambios</span>
                    <span className="sm:hidden">Guardar</span>
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
            className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive"
          >
            {error}
          </motion.div>
        )}

        {/* GPS Reminder Banner - Aparece si el GPS está desactivado */}
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
                      ¡Activa tu GPS para recibir más clientes!
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Los clientes pueden ver tu ubicación en tiempo real y contactarte más fácilmente. 
                      <span className="text-orange-400 font-medium"> Aumenta tus oportunidades de trabajo.</span>
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
                      Activar GPS
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setGpsReminderDismissed(true)}
                    >
                      Recordar después
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zones Warning Banner - Aparece si no hay zonas de pickup */}
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
                      ¡No tienes zonas de recogida configuradas!
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sin zonas de recogida, <span className="text-red-400 font-medium">los clientes NO pueden encontrarte</span> cuando buscan un taxi.
                      Configura al menos una zona para aparecer en las búsquedas.
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
                      Configurar zonas
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setZonesWarningDismissed(true)}
                    >
                      Recordar después
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GPS Status Indicator en el header de las stats */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            trackingEnabled 
              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
            <Radio className={`h-4 w-4 ${trackingEnabled ? "animate-pulse" : ""}`} />
            GPS {trackingEnabled ? "Activado" : "Desactivado"}
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
                  <div className="text-xs text-muted-foreground">Vistas del perfil</div>
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
                  <div className="text-xs text-muted-foreground">Contactos</div>
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
                  <div className="text-xs text-muted-foreground">Valoración</div>
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
                  <div className="text-xs text-muted-foreground">Años experiencia</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile completion */}
        <Card className="border-border bg-card mb-8">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Completitud del perfil</span>
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
                <h3 className="font-medium mb-1">Tu URL pública</h3>
                <code className="text-yellow-400 text-sm">
                  eitaxi.ch{publicUrl}
                </code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(`https://eitaxi.ch${publicUrl}`)}
              >
                Copiar enlace
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
                  <h3 className="font-medium mb-1">Control rápido de GPS</h3>
                  <p className="text-sm text-muted-foreground">
                    Abre esta página para activar/desactivar el GPS con un toque
                  </p>
                </div>
              </div>
              <Link href={`/widget?driverId=${driverId}`} target="_blank">
                <Button
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Abrir página GPS
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div ref={tabsRef}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="w-full overflow-x-auto pb-2 -mb-2 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full md:grid md:grid-cols-8 md:w-full">
              <TabsTrigger value="basic" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <User className="mr-1.5 h-4 w-4" />
                Básicos
              </TabsTrigger>
              <TabsTrigger value="vehicle" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <Car className="mr-1.5 h-4 w-4" />
                Vehículo
              </TabsTrigger>
              <TabsTrigger value="services" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <Star className="mr-1.5 h-4 w-4" />
                Servicios
              </TabsTrigger>
              <TabsTrigger value="prices" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <DollarSign className="mr-1.5 h-4 w-4" />
                Precios
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <Clock className="mr-1.5 h-4 w-4" />
                Horarios
              </TabsTrigger>
              <TabsTrigger value="zones" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <MapPin className="mr-1.5 h-4 w-4" />
                Zonas
              </TabsTrigger>
              <TabsTrigger value="gps" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <Navigation className="mr-1.5 h-4 w-4" />
                GPS
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                <Shield className="mr-1.5 h-4 w-4" />
                Privacidad
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-yellow-400" />
                  Información básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Photo */}
                <div>
                  <Label>Foto de perfil</Label>
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
                      <p>JPG, PNG. Máximo 5MB</p>
                      <p>Recomendado: 400x400px</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Años de experiencia</Label>
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
                    <Label htmlFor="phone">Teléfono *</Label>
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1.5 min-h-[120px]"
                    placeholder="Cuéntanos sobre tu servicio..."
                  />
                </div>

                <Separator />

                {/* Social Media */}
                <h3 className="font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-yellow-400" />
                  Redes sociales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="website">Sitio web</Label>
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
                    <Label htmlFor="instagram">Instagram</Label>
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
                    <Label htmlFor="facebook">Facebook</Label>
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

          {/* Vehicle Tab - Usando VehicleManager compartido */}
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
                    // Refrescar vehículos desde el servidor
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
                  Servicios e idiomas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Servicios que ofreces</Label>
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
                  <Label>Idiomas que hablas</Label>
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
                  Precios y tarifas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Base prices */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="basePrice">Precio base (CHF)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      min={0}
                      value={formData.basePrice || ""}
                      onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || undefined })}
                      className="mt-1.5"
                      placeholder="Ej: 5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Tarifa inicial</p>
                  </div>
                  <div>
                    <Label htmlFor="pricePerKm">Precio por km (CHF)</Label>
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
                    <p className="text-xs text-muted-foreground mt-1">Por kilómetro</p>
                  </div>
                  <div>
                    <Label htmlFor="hourlyRate">Tarifa hora (CHF)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      min={0}
                      value={formData.hourlyRate || ""}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || undefined })}
                      className="mt-1.5"
                      placeholder="Ej: 60"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Para limusinas</p>
                  </div>
                </div>

                {/* Price Calculator */}
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="h-5 w-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold">Calculadora de precios</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Calcula cuánto ganarás según la distancia del viaje. El precio se calcula como: <strong>Precio base + (Precio por km × Distancia)</strong>
                  </p>

                  {/* Quick Examples */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { distance: 5, label: "Trayecto corto", example: "Centro ciudad" },
                      { distance: 15, label: "Trayecto medio", example: "Pueblos cercanos" },
                      { distance: 30, label: "Trayecto largo", example: "Ciudad vecina" },
                      { distance: 50, label: "Larga distancia", example: "Otro cantón" },
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
                      <h4 className="font-semibold">Calculadora personalizada</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Distance Input */}
                      <div>
                        <Label htmlFor="customDistance">Distancia del viaje (km)</Label>
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
                          Arrastra el slider o escribe la distancia
                        </p>
                      </div>

                      {/* Price Result */}
                      <div className="flex flex-col justify-center">
                        <div className="text-center p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/30">
                          <div className="text-sm text-muted-foreground mb-1">Precio estimado</div>
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
                      <h5 className="font-medium mb-3 text-sm">Desglose del precio:</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Precio base:</span>
                          <span className="font-medium">{(formData.basePrice || 0).toFixed(2)} CHF</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Precio por km:</span>
                          <span className="font-medium">{(formData.pricePerKm || 0).toFixed(2)} CHF/km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Distancia:</span>
                          <span className="font-medium">{customDistance} km</span>
                        </div>
                        <div className="border-t border-border pt-2 mt-2 flex justify-between">
                          <span className="font-medium">Total:</span>
                          <span className="font-bold text-yellow-400">{calculatePrice(customDistance).toFixed(2)} CHF</span>
                        </div>
                      </div>
                    </div>

                    {/* Popular Routes Examples */}
                    {(formData.basePrice || formData.pricePerKm) && (
                      <div className="mt-6">
                        <h5 className="font-medium mb-3 text-sm flex items-center gap-2">
                          <Route className="h-4 w-4 text-yellow-400" />
                          Ejemplos de rutas populares desde Suiza:
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
                        <strong>Consejo:</strong> Configura tu precio base y precio por km arriba para ver ejemplos de precios calculados automáticamente.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-400" />
                  Horarios de disponibilidad
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
                    <h3 className="font-semibold text-blue-400 mb-2">¿Qué son las zonas de servicio?</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Las zonas definen <strong>dónde trabajas</strong>. Cuando un cliente busca un taxi en una zona que has configurado, aparecerás en los resultados.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>Cantón:</strong> Cubres todo el cantón (ej: todo Zúrich)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>Distrito:</strong> Solo una región (ej: distrito de Winterthur)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>Municipio:</strong> Solo una ciudad/pueblo específico</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>Exclusiones:</strong> Puedes excluir lugares dentro de una zona</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      💡 <strong>Consejo:</strong> Añade varias zonas para aumentar tus oportunidades. Si trabajas en Liechtenstein, selecciona "Todo Liechtenstein" para cubrir el país entero.
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
                  // Actualizar el estado de zonas - MISMO NOMBRE que en Registro
                  setServiceZonesWithExclusions(zones);
                }}
              />
            )}

            {/* Rutas con precio fijo - Componente compartido con el registro */}
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

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <div className="space-y-6">
              {/* Data Info Card */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-yellow-400" />
                    Datos y Privacidad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">
                    De acuerdo con la nueva Ley Federal de Protección de Datos (nDSG) de Suiza,
                    tienes derechos sobre tus datos personales. Aquí puedes ejercerlos.
                  </p>

                  {/* Data stored */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Datos que almacenamos sobre ti:</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>Datos de perfil:</strong> Nombre, email, teléfono, foto</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>Información profesional:</strong> Experiencia, vehículo, servicios</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>Ubicación:</strong> Última ubicación conocida (solo si GPS activo)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-400 mt-0.5" />
                        <span><strong>Estadísticas:</strong> Vistas del perfil, contactos recibidos</span>
                      </li>
                    </ul>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Export Data */}
                    <Card className="border-blue-400/30 bg-blue-400/5">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-blue-400" />
                          Exportar mis datos
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Descarga todos tus datos en formato JSON.
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
                          Descargar JSON
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Request Data Access */}
                    <Card className="border-purple-400/30 bg-purple-400/5">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-400" />
                          Solicitar acceso
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Solicita información detallada sobre el tratamiento de tus datos.
                        </p>
                        <a href="mailto:privacidad@eitaxi.ch?subject=Solicitud de acceso a datos - eitaxi">
                          <Button
                            variant="outline"
                            className="w-full border-purple-400 text-purple-400 hover:bg-purple-400/10"
                          >
                            Enviar solicitud
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
                    Seguridad de la cuenta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Email actual: <span className="text-foreground font-medium">{driver?.email}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Puedes cambiar tu email o contraseña cuando quieras
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowSecurityForm(!showSecurityForm)}
                      className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      {showSecurityForm ? "Cancelar" : "Cambiar credenciales"}
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
                              Nuevo email (dejar vacío para no cambiar)
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
                              Contraseña actual *
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
                              Necesaria para verificar tu identidad
                            </p>
                          </div>

                          {/* New Password */}
                          <div>
                            <Label htmlFor="newPassword" className="flex items-center gap-2">
                              <Key className="h-4 w-4" />
                              Nueva contraseña (dejar vacío para no cambiar)
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
                              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
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
                              Cancelar
                            </Button>
                            <Button
                              className="bg-yellow-400 text-black hover:bg-yellow-500"
                              onClick={handleSecurityChange}
                              disabled={securityLoading}
                            >
                              {securityLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Guardando...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Guardar cambios
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
                    Zona de peligro
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <h4 className="font-medium text-red-400 mb-2">Eliminar mi cuenta y datos</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta acción es irreversible. Al solicitar la eliminación de tu cuenta:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                      <li>• Tu perfil público será eliminado inmediatamente</li>
                      <li>• Todos tus datos personales serán eliminados en un plazo de 30 días</li>
                      <li>• Tu historial de ubicaciones GPS será borrado</li>
                      <li>• Ya no podrás acceder a tu panel de control</li>
                    </ul>
                    <Button
                      variant="destructive"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        if (confirm('¿Estás seguro de que deseas solicitar la eliminación de tu cuenta? Esta acción no se puede deshacer.')) {
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
                      Solicitar eliminación de mi cuenta
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Conforme al artículo 32 de la nDSG, procesaremos tu solicitud en un plazo máximo
                    de 30 días. Recibirás confirmación por email.
                  </p>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card className="border-yellow-400/30 bg-yellow-400/5">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-yellow-400" />
                    ¿Tienes preguntas sobre tus datos?
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Contacta con nuestro Delegado de Protección de Datos:
                  </p>
                  <a
                    href="mailto:privacidad@eitaxi.ch"
                    className="text-yellow-400 hover:underline text-sm"
                  >
                    privacidad@eitaxi.ch
                  </a>
                  <p className="text-xs text-muted-foreground mt-3">
                    También puedes presentar una reclamación ante el Comisionado Federal de
                    Protección de Datos (PFPD) de Suiza si consideras que tus derechos no
                    están siendo respetados.
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
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
