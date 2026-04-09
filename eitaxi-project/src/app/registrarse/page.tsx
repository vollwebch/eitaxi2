"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  User,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Check,
  ArrowLeft,
  Star,
  Sparkles,
  Loader2,
  Building2,
  Route,
  Plane,
  Shield,
  Upload,
  X,
  Globe,
  Users,
  Wand2,
  FileText,
  Eye,
  DollarSign,
  Plus,
  Trash2,
  Instagram,
  Facebook,
  Link as LinkIcon,
  Mail,
  Lock,
  RefreshCw,
  Search,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  SWISS_CANTONS,
  LIECHTENSTEIN,
  POPULAR_PLACES,
  getMunicipalitiesByCanton,
  getMunicipalitiesByDistrict
} from "@/lib/geo-data";
import { SERVICE_OPTIONS as serviceOptionsBase, LANGUAGE_OPTIONS as languageOptions, VEHICLE_TYPES as vehicleTypes } from "@/lib/constants";
import ZoneSelector, { ServiceZone } from "@/components/ZoneSelector";
import ScheduleSelector, { DaySchedule, TimeSlot } from "@/components/ScheduleSelector";
import PlaceSearch, { PlaceResult } from "@/components/PlaceSearch";
import VehicleManager, { Vehicle } from "@/components/VehicleManager";
import FixedRoutesManager, { FixedRoute } from "@/components/FixedRoutesManager";

// Service icons mapping (for registration UI) - same as dashboard
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

// Merge serviceOptions with icons
const serviceOptions = serviceOptionsBase.map(s => ({
  ...s,
  icon: SERVICE_ICONS[s.id] || Building2,
}));

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
}

interface DriverRoute {
  origin: string;
  originLat?: number;
  originLon?: number;
  destination: string;
  destinationLat?: number;
  destinationLon?: number;
  price?: number;
}

// Step config - now 8 steps
const steps = [
  { id: 1, title: "Datos básicos", description: "Tu información" },
  { id: 2, title: "Ubicación", description: "Dónde operas" },
  { id: 3, title: "Vehículo", description: "Tu vehículo" },
  { id: 4, title: "Servicios", description: "Qué ofreces" },
  { id: 5, title: "Rutas y precios", description: "Tus tarifas" },
  { id: 6, title: "Horarios", description: "Disponibilidad" },
  { id: 7, title: "Descripción", description: "Sobre ti" },
  { id: 8, title: "Vista previa", description: "Confirmar" },
];

// 🔍 MAPA DE VALIDACIÓN: Campo -> Paso y mensaje de error
const FIELD_TO_STEP_MAP: Record<string, { step: number; label: string; fieldLabel: string }> = {
  // Step 1: Datos básicos
  name: { step: 1, label: "Datos básicos", fieldLabel: "Nombre completo" },
  phone: { step: 1, label: "Datos básicos", fieldLabel: "Teléfono" },
  email: { step: 1, label: "Datos básicos", fieldLabel: "Email" },
  password: { step: 1, label: "Datos básicos", fieldLabel: "Contraseña" },
  confirmPassword: { step: 1, label: "Datos básicos", fieldLabel: "Confirmar contraseña" },
  passwordLength: { step: 1, label: "Datos básicos", fieldLabel: "Contraseña (mínimo 6 caracteres)" },
  passwordMatch: { step: 1, label: "Datos básicos", fieldLabel: "Las contraseñas no coinciden" },
  // Step 2: Ubicación
  cantonId: { step: 2, label: "Ubicación", fieldLabel: "Cantón" },
  cityId: { step: 2, label: "Ubicación", fieldLabel: "Ciudad" },
  baseCanton: { step: 2, label: "Ubicación", fieldLabel: "Cantón base" },
  baseCity: { step: 2, label: "Ubicación", fieldLabel: "Ciudad base" },
  // Step 3: Vehículo
  vehicleTypes: { step: 3, label: "Vehículo", fieldLabel: "Tipo de vehículo" },
  vehicleType: { step: 3, label: "Vehículo", fieldLabel: "Tipo de vehículo" },
  // Step 4: Servicios
  services: { step: 4, label: "Servicios", fieldLabel: "Servicios ofrecidos" },
  // Step 5: Rutas y precios
  pickupZones: { step: 5, label: "Rutas y precios", fieldLabel: "Zonas de recogida" },
  // Step 6: Horarios
  schedules: { step: 6, label: "Horarios", fieldLabel: "Horarios de disponibilidad" },
  // Términos
  terms: { step: 8, label: "Vista previa", fieldLabel: "Términos de servicio" },
  privacy: { step: 8, label: "Vista previa", fieldLabel: "Política de privacidad" },
};

export default function RegistrarsePage() {
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // 🔴 Estado para tracking de pasos con errores
  const [errorSteps, setErrorSteps] = useState<Set<number>>(new Set());
  // 🔴 Estado para errores de campos específicos (para mostrar mensajes debajo de inputs)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // 🔴 Estado para error de caracteres especiales en email
  const [emailCharError, setEmailCharError] = useState<string | null>(null);
  
  // AI Generated descriptions state
  const [aiDescriptions, setAiDescriptions] = useState<Record<string, { text: string; generatedBy: string }>>({});
  const [selectedAiStyle, setSelectedAiStyle] = useState<string | null>(null);
  
  // Ref para scroll al inicio del formulario
  const formRef = useRef<HTMLDivElement>(null);
  
  // Base location state - using local geographic data
  const [selectedBaseCanton, setSelectedBaseCanton] = useState<string>("");
  
  // Available municipalities based on selected canton (filtered strictly)
  const availableMunicipalities = useMemo(() => {
    if (!selectedBaseCanton) return [];
    if (selectedBaseCanton === "liechtenstein") {
      return LIECHTENSTEIN.municipalities;
    }
    const canton = SWISS_CANTONS.find(c => c.id === selectedBaseCanton);
    if (!canton) return [];
    // Get all municipalities from all districts in the canton
    const municipalities = new Set<string>();
    canton.districts.forEach(district => {
      district.municipalities.forEach(m => municipalities.add(m));
    });
    return Array.from(municipalities).sort();
  }, [selectedBaseCanton]);
  
  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form data with new fields
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    password: "",
    confirmPassword: "",
    cityId: "",
    cantonId: "",
    // Base location (where the taxi is based)
    baseCanton: "",
    baseCity: "",
    address: "",
    experience: 1 as number | undefined,
    description: "",
    originalDescription: "",
    services: [] as string[],
    languages: [] as string[],
    serviceZones: [] as string[],
    isAvailable24h: true,
    vehicleTypes: [] as string[],
    vehicleBrand: "",
    vehicleModel: "",
    vehicleYear: undefined as number | undefined,
    vehicleColor: "",
    passengerCapacity: undefined as number | undefined,
    // New price fields
    basePrice: undefined as number | undefined,
    pricePerKm: undefined as number | undefined,
    hourlyRate: undefined as number | undefined,
    // Social media
    website: "",
    instagram: "",
    facebook: "",
    subscription: "free",
  });

  // Routes state
  const [routes, setRoutes] = useState<DriverRoute[]>([]);

  // Service zones with exclusions (using shared ServiceZone type)
  const [serviceZonesWithExclusions, setServiceZonesWithExclusions] = useState<ServiceZone[]>([]);

  // Schedule state - using new DaySchedule format with multiple time slots per day
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  
  // 24/7 mode state
  const [is24h, setIs24h] = useState(false);

  // Vehicles state - usando VehicleManager compartido
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

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

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle service toggle
  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  // Handle vehicle type toggle (multiple selection)
  const toggleVehicleType = (typeId: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(typeId)
        ? prev.vehicleTypes.filter((t) => t !== typeId)
        : [...prev.vehicleTypes, typeId],
    }));
  };

  // Handle language toggle
  const toggleLanguage = (langId: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(langId)
        ? prev.languages.filter((l) => l !== langId)
        : [...prev.languages, langId],
    }));
  };

  // Generate AI description
  const generateAIDescription = async () => {
    if (!formData.name || formData.services.length === 0) {
      setError("Por favor completa tu nombre y selecciona al menos un servicio");
      return;
    }

    setIsGeneratingAI(true);
    setError(null);
    setAiDescriptions({});

    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          services: formData.services,
          experience: formData.experience,
          vehicleTypes: formData.vehicleTypes,
          vehicleBrand: formData.vehicleBrand,
          vehicleModel: formData.vehicleModel,
          passengerCapacity: formData.passengerCapacity,
          city: formData.baseCity,
          canton: formData.baseCanton === "liechtenstein" 
            ? "Liechtenstein" 
            : SWISS_CANTONS.find(c => c.id === formData.baseCanton)?.name || "",
          languages: formData.languages,
          style: "all" // Request all 3 styles
        }),
      });

      const data = await response.json();

      if (data.success && data.descriptions) {
        setAiDescriptions(data.descriptions);
        // Auto-select the first style
        const firstStyle = Object.keys(data.descriptions)[0];
        if (firstStyle && data.descriptions[firstStyle]) {
          setSelectedAiStyle(firstStyle);
          setFormData((prev) => ({
            ...prev,
            description: data.descriptions[firstStyle].text,
          }));
        }
      } else {
        setError(data.error || "Error al generar descripciones");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Select an AI-generated description
  const selectAiDescription = (style: string) => {
    if (aiDescriptions[style]) {
      setSelectedAiStyle(style);
      setFormData((prev) => ({
        ...prev,
        description: aiDescriptions[style].text,
      }));
    }
  };

  // Improve existing text with AI
  const improveExistingText = async () => {
    if (!formData.description || formData.description.trim().length < 10) {
      setError("Escribe algo de texto primero para que la IA pueda mejorarlo");
      return;
    }

    setIsGeneratingAI(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          services: formData.services,
          experience: formData.experience,
          vehicleTypes: formData.vehicleTypes,
          vehicleBrand: formData.vehicleBrand,
          vehicleModel: formData.vehicleModel,
          passengerCapacity: formData.passengerCapacity,
          city: formData.baseCity,
          canton: formData.baseCanton === "liechtenstein" 
            ? "Liechtenstein" 
            : SWISS_CANTONS.find(c => c.id === formData.baseCanton)?.name || "",
          languages: formData.languages,
          mode: "improve",
          existingText: formData.description
        }),
      });

      const data = await response.json();

      if (data.success && data.improvedText) {
        setFormData((prev) => ({
          ...prev,
          description: data.improvedText,
        }));
        // Clear the AI options since we're now in "improved" mode
        setAiDescriptions({});
        setSelectedAiStyle(null);
      } else {
        setError(data.error || "Error al mejorar el texto");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Analyze existing text with AI
  const analyzeExistingText = async () => {
    if (!formData.description || formData.description.trim().length < 10) {
      setError("Escribe algo de texto primero para que la IA pueda analizarlo");
      return;
    }

    setIsGeneratingAI(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          services: formData.services,
          experience: formData.experience,
          vehicleTypes: formData.vehicleTypes,
          vehicleBrand: formData.vehicleBrand,
          vehicleModel: formData.vehicleModel,
          passengerCapacity: formData.passengerCapacity,
          city: formData.baseCity,
          canton: formData.baseCanton === "liechtenstein" 
            ? "Liechtenstein" 
            : SWISS_CANTONS.find(c => c.id === formData.baseCanton)?.name || "",
          languages: formData.languages,
          mode: "analyze",
          existingText: formData.description
        }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        // Show the improved version from analysis
        if (data.analysis.improvedVersion) {
          setFormData((prev) => ({
            ...prev,
            description: data.analysis.improvedVersion,
          }));
        }
        // Clear AI options
        setAiDescriptions({});
        setSelectedAiStyle(null);
      } else {
        setError(data.error || "Error al analizar el texto");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Validate current step - returns object with validation result and missing fields
  const validateStep = (step?: number): { valid: boolean; missingFields: string[] } => {
    const stepToValidate = step ?? currentStep;
    const missingFields: string[] = [];
    
    switch (stepToValidate) {
      case 1:
        if (!formData.name?.trim()) missingFields.push('name');
        if (!formData.phone?.trim()) missingFields.push('phone');
        if (!formData.email?.trim()) missingFields.push('email');
        if (!formData.password) missingFields.push('password');
        else if (formData.password.length < 6) missingFields.push('passwordLength');
        if (!formData.confirmPassword) missingFields.push('confirmPassword');
        else if (formData.password !== formData.confirmPassword) missingFields.push('passwordMatch');
        break;
      case 2:
        if (!formData.baseCanton && !formData.cantonId) missingFields.push('cantonId');
        if (!formData.baseCity && !formData.cityId) missingFields.push('cityId');
        break;
      case 3:
        // Validar que hay al menos un vehículo
        if (vehicles.length === 0) missingFields.push('vehicleTypes');
        break;
      case 4:
        if (formData.services.length === 0) missingFields.push('services');
        break;
      case 5:
        // OBLIGATORIO: Al menos una zona de RECOGIDA (pickup)
        const hasPickupZones = serviceZonesWithExclusions.some(z => z.zoneMode === 'pickup');
        if (!hasPickupZones) missingFields.push('pickupZones');
        break;
      case 6:
      case 7:
        // Optional steps - no required fields
        break;
      case 8:
        if (!acceptedTerms) missingFields.push('terms');
        if (!acceptedPrivacy) missingFields.push('privacy');
        break;
    }
    
    return { valid: missingFields.length === 0, missingFields };
  };

  // 🔴 Función para actualizar errores de campos y pasos
  const updateFieldErrors = (missingFields: string[]) => {
    const newFieldErrors: Record<string, string> = {};
    const newErrorSteps = new Set<number>();
    
    missingFields.forEach(field => {
      const fieldInfo = FIELD_TO_STEP_MAP[field];
      if (fieldInfo) {
        newFieldErrors[field] = `⚠️ ${fieldInfo.fieldLabel} es obligatorio`;
        newErrorSteps.add(fieldInfo.step);
      }
    });
    
    setFieldErrors(newFieldErrors);
    setErrorSteps(newErrorSteps);
    
    return newErrorSteps;
  };

  // 🔴 Validar TODOS los pasos y retornar errores completos
  const validateAllSteps = (): { valid: boolean; allErrors: string[]; errorSteps: Set<number> } => {
    const allErrors: string[] = [];
    
    for (let step = 1; step <= 8; step++) {
      const result = validateStep(step);
      allErrors.push(...result.missingFields);
    }
    
    const errorStepsSet = updateFieldErrors(allErrors);
    
    return {
      valid: allErrors.length === 0,
      allErrors,
      errorSteps: errorStepsSet
    };
  };

  // Handle next step
  const nextStep = () => {
    const validation = validateStep();
    
    if (validation.valid) {
      setError(null);
      setValidationErrors([]);
      setFieldErrors({});
      // Limpiar el paso actual de los errores
      setErrorSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentStep);
        return newSet;
      });
      setCurrentStep((prev) => Math.min(prev + 1, 8));
    } else {
      // Actualizar errores visuales
      updateFieldErrors(validation.missingFields);
      
      // Crear mensaje de error detallado
      const errorMessages = validation.missingFields.map(f => {
        const info = FIELD_TO_STEP_MAP[f];
        return info ? info.fieldLabel : f;
      });
      
      setError(`Por favor completa: ${errorMessages.join(', ')}`);
      setValidationErrors(validation.missingFields);
      
      // Scroll al inicio del formulario
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Handle previous step
  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError(null);
  };

  // 🔴 Función helper para navegar al primer paso con error
  const navigateToFirstErrorStep = (errorSteps: Set<number>) => {
    if (errorSteps.size > 0) {
      const firstErrorStep = Math.min(...Array.from(errorSteps));
      setCurrentStep(firstErrorStep);
      // Scroll al inicio del formulario
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // 🔍 VALIDACIÓN COMPLETA DE TODOS LOS PASOS
    const fullValidation = validateAllSteps();
    
    if (!fullValidation.valid) {
      // 🔍 LOG DETALLADO DE ERRORES
      console.error('🔴 ERRORES DE VALIDACIÓN DETECTADOS:');
      fullValidation.allErrors.forEach(err => {
        const info = FIELD_TO_STEP_MAP[err];
        console.error(`  ❌ Paso ${info?.step || '?'}: ${info?.fieldLabel || err} es obligatorio`);
      });
      
      // Crear mensaje de error resumido
      const errorStepsArray = Array.from(fullValidation.errorSteps);
      const errorStepsLabels = errorStepsArray.map(stepNum => {
        const step = steps.find(s => s.id === stepNum);
        return `Paso ${stepNum} (${step?.title || 'Desconocido'})`;
      });
      
      setError(`Por favor, revisa: ${errorStepsLabels.join(', ')}`);
      
      // 🔴 NAVEGACIÓN AUTOMÁTICA al primer paso con error
      navigateToFirstErrorStep(fullValidation.errorSteps);
      return;
    }

    // 🔍 LOGS DE VERIFICACIÓN ANTES DE ENVIAR
    console.log('🔍 VERIFICACIÓN PRE-ENVÍO:');
    console.log('  - name:', formData.name ? '✓' : '❌ FALTA');
    console.log('  - phone:', formData.phone ? '✓' : '❌ FALTA');
    console.log('  - email:', formData.email ? '✓' : '❌ FALTA');
    console.log('  - password:', formData.password ? '✓' : '❌ FALTA');
    console.log('  - baseCanton:', formData.baseCanton || formData.cantonId || '(usar cityId/cantonId)');
    console.log('  - baseCity:', formData.baseCity || formData.cityId || '(usar cityId)');
    console.log('  - vehicles:', vehicles.length > 0 ? `✓ (${vehicles.length} vehículo(s))` : '❌ FALTA');
    console.log('  - services:', formData.services.length > 0 ? '✓' : '❌ FALTA');
    console.log('  - pickupZones:', serviceZonesWithExclusions.filter(z => z.zoneMode === 'pickup').length);
    console.log('  - schedules:', schedules.length, 'días');
    console.log('  - routes:', routes.length, 'rutas');
    console.log('  - serviceZonesWithExclusions:', serviceZonesWithExclusions.length, 'zonas');

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload image first if exists - CON MANEJO DE ERRORES ROBUSTO
      let imageUrl = null;
      if (imageFile) {
        try {
          const formDataImg = new FormData();
          formDataImg.append("file", imageFile);
          
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formDataImg,
          });
          
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.success) {
              imageUrl = uploadData.url;
              console.log('✅ Imagen subida correctamente:', imageUrl);
            }
          } else {
            console.warn('⚠️ Error al subir imagen, continuando sin imagen');
          }
        } catch (uploadError) {
          // No bloquear el registro si falla la imagen
          console.warn('⚠️ Error de conexión al subir imagen, continuando sin imagen:', uploadError);
          // Opcional: mostrar aviso al usuario
          // setError("No se pudo subir la imagen, pero tu perfil se creará sin ella.");
        }
      }

      // 🔴 ASEGURAR QUE LOS CAMPOS NUNCA SEAN NULL - SOLO ENVIAR CAMPOS VÁLIDOS
      const payload = {
        // Campos básicos
        name: formData.name?.trim() || "",
        phone: formData.phone?.trim() || "",
        whatsapp: formData.whatsapp?.trim() || null,
        email: formData.email?.trim().toLowerCase() || "",
        password: formData.password,
        
        // Ubicación - usar cityId y cantonId para el backend
        cityId: formData.baseCity || formData.cityId || "",
        cantonId: formData.baseCanton || formData.cantonId || "",
        baseCity: formData.baseCity || formData.cityId || "",
        baseCanton: formData.baseCanton || formData.cantonId || "",
        address: formData.address?.trim() || null,
        
        // Experiencia y descripción
        experience: formData.experience ?? 1,
        description: formData.description?.trim() || null,
        originalDescription: formData.originalDescription?.trim() || null,
        
        // Vehículos - usar datos del vehículo principal
        vehicleType: vehicles.find(v => v.isPrimary)?.vehicleType || vehicles[0]?.vehicleType || "taxi",
        vehicleTypes: vehicles.length > 0 ? vehicles.map(v => v.vehicleType) : ["taxi"],
        vehicleBrand: vehicles.find(v => v.isPrimary)?.brand || vehicles[0]?.brand || null,
        vehicleModel: vehicles.find(v => v.isPrimary)?.model || vehicles[0]?.model || null,
        vehicleYear: vehicles.find(v => v.isPrimary)?.year || vehicles[0]?.year || null,
        vehicleColor: vehicles.find(v => v.isPrimary)?.color || vehicles[0]?.color || null,
        passengerCapacity: vehicles.find(v => v.isPrimary)?.passengerCapacity || vehicles[0]?.passengerCapacity || null,
        // Vehículos completos para crear en la tabla Vehicle
        vehicles: vehicles.map(v => ({
          vehicleType: v.vehicleType,
          brand: v.brand,
          model: v.model,
          year: v.year,
          color: v.color,
          passengerCapacity: v.passengerCapacity,
          licensePlate: v.licensePlate,
          isPrimary: v.isPrimary,
        })),
        
        // Servicios e idiomas
        services: formData.services.length > 0 ? formData.services : ["city"],
        languages: formData.languages || [],
        
        // Zonas
        serviceZones: formData.serviceZones || [],
        serviceZonesWithExclusions: serviceZonesWithExclusions || [],
        
        // Disponibilidad
        isAvailable24h: is24h,
        schedules: is24h ? null : schedules,
        
        // Rutas
        routes: routes || [],
        
        // Precios
        basePrice: formData.basePrice || null,
        pricePerKm: formData.pricePerKm || null,
        hourlyRate: formData.hourlyRate || null,
        
        // Redes sociales
        website: formData.website?.trim() || null,
        instagram: formData.instagram?.trim() || null,
        facebook: formData.facebook?.trim() || null,
        
        // Imagen y suscripción
        imageUrl,
        subscription: formData.subscription || "free",
      };

      console.log('📦 ENVIANDO PAYLOAD:', JSON.stringify(payload, null, 2));

      const response = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ PERFIL CREADO EXITOSAMENTE');
        setSuccess(true);
        setProfileUrl(data.profileUrl);
        setDriverId(data.data.id);
      } else {
        // 🔴 MANEJO DETALLADO DE ERRORES DEL BACKEND
        console.error('❌ ERROR DEL BACKEND COMPLETO:');
        console.error('  - success:', data.success);
        console.error('  - error:', data.error);
        console.error('  - details:', data.details);
        console.error('  - missingFields:', data.missingFields);
        console.error('  - fieldErrors:', data.fieldErrors);
        console.error('  - field:', data.field);
        
        // Mostrar detalles técnicos si existen (para debugging)
        if (data.details) {
          console.error('❌ DETALLES TÉCNICOS DEL ERROR:');
          console.error('  - Código:', data.details.code);
          console.error('  - Mensaje:', data.details.message);
          console.error('  - Meta:', data.details.meta);
          console.error('  - Campo problemático:', data.details.field);
        }
        
        if (data.detailedErrors && Array.isArray(data.detailedErrors)) {
          // Errores detallados con pasos
          const errorSteps = new Set<number>();
          data.detailedErrors.forEach((errMsg: string) => {
            console.error(`  ❌ ${errMsg}`);
            // Extraer número de paso del mensaje si existe
            const stepMatch = errMsg.match(/Paso (\d+):/);
            if (stepMatch) {
              errorSteps.add(parseInt(stepMatch[1]));
            }
          });
          
          setErrorSteps(errorSteps);
          setError(data.detailedErrors.join('\n'));
          
          // Navegar al primer paso con error
          navigateToFirstErrorStep(errorSteps);
        } else if (data.missingFields && Array.isArray(data.missingFields)) {
          // Campos faltantes
          const fieldErrors: Record<string, string> = {};
          const errorSteps = new Set<number>();
          
          data.missingFields.forEach((field: string) => {
            const info = FIELD_TO_STEP_MAP[field];
            if (info) {
              fieldErrors[field] = `${info.fieldLabel} es obligatorio`;
              errorSteps.add(info.step);
            }
          });
          
          setFieldErrors(fieldErrors);
          setErrorSteps(errorSteps);
          setError(`Faltan campos: ${data.missingFields.join(', ')}`);
          
          // Navegar al primer paso con error
          navigateToFirstErrorStep(errorSteps);
        } else if (data.field) {
          // Error en campo específico
          const info = FIELD_TO_STEP_MAP[data.field];
          if (info) {
            setFieldErrors({ [data.field]: data.error || 'Error en este campo' });
            setErrorSteps(new Set([info.step]));
            setCurrentStep(info.step);
          }
          setError(data.error || "Error al crear el perfil");
        } else if (data.details?.field) {
          // Error de Prisma con campo específico
          setError(`Error en el campo '${data.details.field}': ${data.error}`);
        } else {
          // Mostrar el error con detalles si están disponibles
          const errorMsg = data.details?.message 
            ? `${data.error}\n\nDetalles técnicos: ${data.details.message}`
            : data.error || "Error al crear el perfil";
          setError(errorMsg);
        }
      }
    } catch (err) {
      console.error('❌ ERROR DE CONEXIÓN:', err);
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress percentage
  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

  // Get city and canton names for preview
  const cityName = formData.baseCity;
  const cantonName = formData.baseCanton === "liechtenstein" 
    ? "Liechtenstein" 
    : SWISS_CANTONS.find(c => c.id === formData.baseCanton)?.name || "";

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">¡Perfil creado!</h1>
          <p className="text-muted-foreground mb-6">
            Tu perfil profesional ha sido creado exitosamente y está activo.
          </p>
          
          {profileUrl && (
            <Card className="mb-6 border-yellow-400/30 bg-yellow-400/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Tu URL pública:</p>
                <code className="block bg-background p-3 rounded text-yellow-400 text-lg font-mono break-all">
                  eitaxi.ch{profileUrl}
                </code>
              </CardContent>
            </Card>
          )}

          {driverId && (
            <Card className="mb-6 border-blue-400/30 bg-blue-400/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Tu panel de control:</p>
                <code className="block bg-background p-3 rounded text-blue-400 text-sm font-mono break-all">
                  eitaxi.ch/dashboard/{driverId}
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Guarda este enlace para editar tu perfil
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-3">
            <Button 
              className="w-full bg-yellow-400 text-black hover:bg-yellow-500" 
              onClick={() => window.location.href = profileUrl || "/"}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver mi perfil
            </Button>
            {driverId && (
              <Button 
                variant="outline"
                className="w-full border-blue-400 text-blue-400 hover:bg-blue-400/10" 
                onClick={() => window.location.href = `/dashboard/${driverId}`}
              >
                Ir a mi panel
              </Button>
            )}
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              Ir al inicio
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500">
              <Car className="h-7 w-7 text-black" />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-yellow-400">ei</span>
              <span className="text-white">taxi</span>
            </span>
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Únete como conductor</h1>
          <p className="text-muted-foreground">
            Crea tu perfil profesional y conecta con miles de pasajeros en Suiza
          </p>
          <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-500 border-green-500/30">
            <Check className="mr-1 h-3 w-3" />
            Registro gratuito - Sin pagos
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <Progress value={progressPercent} className="h-2 bg-muted" />
          <div className="flex justify-between mt-4 overflow-x-auto">
            {steps.map((step) => {
              const hasError = errorSteps.has(step.id);
              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center min-w-[60px]"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      hasError
                        ? "bg-red-500 text-white ring-2 ring-red-500/50"
                        : currentStep >= step.id
                        ? "bg-yellow-400 text-black"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {hasError ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : currentStep > step.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className={`text-xs mt-1 hidden md:block whitespace-nowrap ${
                    hasError ? "text-red-500 font-medium" : "text-muted-foreground"
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🔴 Error alert con resumen detallado */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorSteps.size > 1 && (
                <div className="mb-2 font-semibold">
                  ⚠️ Errores en {errorSteps.size} pasos:
                </div>
              )}
              <div className="whitespace-pre-line">{error}</div>
              {errorSteps.size > 0 && (
                <div className="mt-3 pt-3 border-t border-red-500/30">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToFirstErrorStep(errorSteps)}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    Ir al primer error (Paso {Math.min(...Array.from(errorSteps))})
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Card ref={formRef} className="border-border bg-card">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-yellow-400" />
                      Información básica
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nombre o nombre comercial *</Label>
                        <Input
                          id="name"
                          placeholder="Ej: Taxi Paco, Taxi Martínez, Luis Gómez..."
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            // Limpiar error del campo cuando el usuario empieza a escribir
                            if (fieldErrors.name) {
                              setFieldErrors(prev => { const newErrors = { ...prev }; delete newErrors.name; return newErrors; });
                            }
                          }}
                          className={`mt-1.5 ${fieldErrors.name ? 'border-red-500 focus-visible:ring-red-500 ring-2 ring-red-500/20' : ''}`}
                        />
                        {fieldErrors.name && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {fieldErrors.name}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Teléfono principal *</Label>
                          <div className="relative mt-1.5">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="phone"
                              placeholder="+41 79 123 45 67"
                              value={formData.phone}
                              onChange={(e) => {
                                setFormData({ ...formData, phone: e.target.value });
                                if (fieldErrors.phone) {
                                  setFieldErrors(prev => { const newErrors = { ...prev }; delete newErrors.phone; return newErrors; });
                                }
                              }}
                              className={`pl-10 ${fieldErrors.phone ? 'border-red-500 focus-visible:ring-red-500 ring-2 ring-red-500/20' : ''}`}
                            />
                          </div>
                          {fieldErrors.phone && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {fieldErrors.phone}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="whatsapp">WhatsApp</Label>
                          <div className="relative mt-1.5">
                            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="whatsapp"
                              placeholder="+41 79 123 45 67"
                              value={formData.whatsapp}
                              onChange={(e) =>
                                setFormData({ ...formData, whatsapp: e.target.value })
                              }
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email * (para acceder a tu panel)</Label>
                        <div className="relative mt-1.5">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={formData.email}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFormData({ ...formData, email: value });
                              
                              // Validar caracteres especiales en tiempo real
                              const specialChars = /[ñçáéíóúàèìòùâêîôûäëïöü]/i;
                              if (specialChars.test(value)) {
                                setEmailCharError('Los caracteres especiales (ñ, ç, acentos) no son válidos en emails. Usa letras sin acento (ej: n en lugar de ñ)');
                              } else {
                                setEmailCharError(null);
                              }
                              
                              if (validationErrors.includes('email')) setValidationErrors(prev => prev.filter(f => f !== 'email'));
                            }}
                            onInvalid={(e) => {
                              const input = e.target as HTMLInputElement;
                              if (input.value && /[ñçáéíóúàèìòùâêîôûäëïöü]/i.test(input.value)) {
                                input.setCustomValidity('Los caracteres especiales como ñ, ç, acentos no son válidos en direcciones de email. Por favor, usa solo letras sin acentos (ej: n en lugar de ñ)');
                              } else {
                                input.setCustomValidity('Por favor, introduce una dirección de email válida');
                              }
                            }}
                            onInput={(e) => {
                              (e.target as HTMLInputElement).setCustomValidity('');
                            }}
                            className={`pl-10 ${(validationErrors.includes('email') || emailCharError) ? 'border-red-500 focus-visible:ring-red-500 ring-2 ring-red-500/20' : ''}`}
                            autoComplete="email"
                          />
                        </div>
                        {emailCharError ? (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {emailCharError}
                          </p>
                        ) : validationErrors.includes('email') ? (
                          <p className="text-xs text-red-500 mt-1">Este campo es obligatorio</p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">
                            Usarás este email para iniciar sesión en tu panel
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="password">Contraseña * (mín. 6 caracteres)</Label>
                          <div className="relative mt-1.5">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="password"
                              type="password"
                              placeholder="••••••••"
                              value={formData.password}
                              onChange={(e) => {
                                setFormData({ ...formData, password: e.target.value });
                                if (validationErrors.includes('password')) setValidationErrors(prev => prev.filter(f => f !== 'password'));
                              }}
                              className={`pl-10 ${validationErrors.includes('password') ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                          </div>
                          {validationErrors.includes('password') && (
                            <p className="text-xs text-red-500 mt-1">Mínimo 6 caracteres</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                          <div className="relative mt-1.5">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="••••••••"
                              value={formData.confirmPassword}
                              onChange={(e) =>
                                setFormData({ ...formData, confirmPassword: e.target.value })
                              }
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="experience">Años de experiencia</Label>
                          <Input
                            id="experience"
                            type="number"
                            min={0}
                            max={50}
                            value={formData.experience ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Permitir campo vacío mientras escribe
                              if (value === '') {
                                setFormData({ ...formData, experience: undefined });
                              } else {
                                const num = parseInt(value);
                                if (!isNaN(num) && num >= 0) {
                                  setFormData({ ...formData, experience: num });
                                }
                              }
                            }}
                            onBlur={(e) => {
                              // Asegurar valor mínimo cuando pierde foco
                              const num = parseInt(e.target.value) || 0;
                              setFormData({ ...formData, experience: Math.max(0, num) });
                            }}
                            className="mt-1.5"
                            placeholder="Ej: 5"
                          />
                        </div>
                      </div>

                      {/* Social Media */}
                      <Separator className="my-4" />
                      <h3 className="font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4 text-yellow-400" />
                        Redes sociales (opcional)
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="website">Sitio web</Label>
                          <div className="relative mt-1.5">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="website"
                              placeholder="https://tu-sitio.com"
                              value={formData.website}
                              onChange={(e) =>
                                setFormData({ ...formData, website: e.target.value })
                              }
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="instagram">Instagram</Label>
                            <div className="relative mt-1.5">
                              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="instagram"
                                placeholder="@tu_usuario"
                                value={formData.instagram}
                                onChange={(e) =>
                                  setFormData({ ...formData, instagram: e.target.value })
                                }
                                className="pl-10"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="facebook">Facebook</Label>
                            <div className="relative mt-1.5">
                              <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="facebook"
                                placeholder="tu_pagina"
                                value={formData.facebook}
                                onChange={(e) =>
                                  setFormData({ ...formData, facebook: e.target.value })
                                }
                                className="pl-10"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Location */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-yellow-400" />
                      Tu Ubicación Base (Sede)
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta es tu ubicación principal. Se mostrará a los clientes cuando no tengas el GPS activo.
                    </p>

                    <div className="space-y-4">
                      {/* Cantón selector */}
                      <div>
                        <Label className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          Cantón *
                        </Label>
                        <Select
                          value={selectedBaseCanton}
                          onValueChange={(value) => {
                            setSelectedBaseCanton(value);
                            setFormData(prev => ({ 
                              ...prev, 
                              baseCanton: value,
                              baseCity: "", // Reset city when canton changes
                              cantonId: value === "liechtenstein" ? "li" : value
                            }));
                            if (validationErrors.includes('cantonId')) {
                              setValidationErrors(prev => prev.filter(f => f !== 'cantonId'));
                            }
                          }}
                        >
                          <SelectTrigger className={`mt-1.5 ${validationErrors.includes('cantonId') ? 'border-red-500 ring-red-500' : ''}`}>
                            <SelectValue placeholder="Selecciona tu cantón" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            <SelectItem value="liechtenstein">
                              🇱🇮 Liechtenstein
                            </SelectItem>
                            {SWISS_CANTONS.map((canton) => (
                              <SelectItem key={canton.id} value={canton.id}>
                                {canton.name} ({canton.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors.includes('cantonId') && (
                          <p className="text-xs text-red-500 mt-1">⚠️ Selecciona un cantón</p>
                        )}
                      </div>

                      {/* Municipio selector - filtered by canton */}
                      <div>
                        <Label className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Ciudad / Municipio *
                        </Label>
                        <Select
                          value={formData.baseCity}
                          onValueChange={(value) => {
                            setFormData(prev => ({ ...prev, baseCity: value }));
                            if (validationErrors.includes('cityId')) {
                              setValidationErrors(prev => prev.filter(f => f !== 'cityId'));
                            }
                          }}
                          disabled={!selectedBaseCanton}
                        >
                          <SelectTrigger className={`mt-1.5 ${validationErrors.includes('cityId') ? 'border-red-500 ring-red-500' : ''}`}>
                            <SelectValue placeholder={selectedBaseCanton ? "Selecciona tu ciudad" : "Primero selecciona un cantón"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {availableMunicipalities.map((municipality) => (
                              <SelectItem key={municipality} value={municipality}>
                                {municipality}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors.includes('cityId') && (
                          <p className="text-xs text-red-500 mt-1">⚠️ Selecciona una ciudad</p>
                        )}
                        {selectedBaseCanton && availableMunicipalities.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {availableMunicipalities.length} municipios disponibles
                          </p>
                        )}
                      </div>

                      {/* Address - optional */}
                      <div>
                        <Label htmlFor="address" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Dirección / Calle <span className="text-muted-foreground font-normal">(opcional)</span>
                        </Label>
                        <Input
                          id="address"
                          placeholder="Calle y número (ej: Hauptstrasse 15)"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({ ...formData, address: e.target.value })
                          }
                          className="mt-1.5"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Solo si quieres mostrar tu dirección exacta a los clientes
                        </p>
                      </div>

                      {/* Info box */}
                      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <p className="text-sm text-yellow-400">
                          💡 <strong>Esta ubicación</strong> se usará para mostrarte en búsquedas cuando no tengas el GPS activo. 
                          Las zonas donde operas las configurarás en el siguiente paso.
                        </p>
                      </div>

                      {/* Preview */}
                      {selectedBaseCanton && formData.baseCity && (
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                          <p className="text-sm text-green-400 font-medium mb-1">✓ Tu sede:</p>
                          <p className="text-lg font-semibold">
                            {formData.baseCity}, {selectedBaseCanton === "liechtenstein" 
                              ? "Liechtenstein" 
                              : SWISS_CANTONS.find(c => c.id === selectedBaseCanton)?.name}
                          </p>
                          {formData.address && (
                            <p className="text-sm text-muted-foreground">{formData.address}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Vehicle - Usando VehicleManager compartido */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Car className="h-5 w-5 text-yellow-400" />
                      Vehículos
                    </h2>

                    {/* Error de validación */}
                    {validationErrors.includes('vehicleTypes') && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <p className="text-sm text-red-500 font-medium">
                          ⚠️ Debes añadir al menos un vehículo
                        </p>
                      </div>
                    )}

                    {/* VehicleManager Component */}
                    <VehicleManager
                      mode="create"
                      initialVehicles={vehicles}
                      onVehiclesChange={(updatedVehicles) => {
                        setVehicles(updatedVehicles);
                        // Limpiar error si hay vehículos
                        if (updatedVehicles.length > 0 && validationErrors.includes('vehicleTypes')) {
                          setValidationErrors(prev => prev.filter(f => f !== 'vehicleTypes'));
                        }
                      }}
                      onError={(err) => setError(err)}
                      onSuccess={(msg) => console.log(msg)}
                      showTitle={true}
                    />

                    {/* Info box */}
                    <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="text-sm text-blue-400">
                        💡 <strong>Consejo:</strong> Puedes añadir varios vehículos si tienes una flota.
                        El vehículo marcado como "Principal" será el que se muestre por defecto en tu perfil.
                      </p>
                    </div>

                    {/* Imagen de perfil - separada de los vehículos */}
                    <div className="mt-6">
                      <Separator className="mb-4" />
                      <h3 className="font-medium mb-3">Foto de perfil</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Una foto profesional tuya o de tu vehículo principal (máx. 5MB)
                      </p>

                      {imagePreview ? (
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-48 h-48 object-cover rounded-lg border border-border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="w-48 h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-yellow-400 hover:bg-yellow-400/5 transition-all"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">
                            Subir foto
                          </span>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Services */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-400" />
                      Servicios e idiomas
                    </h2>

                    <div className="space-y-6">
                      {/* Services */}
                      <div className={`p-4 rounded-lg ${validationErrors.includes('services') ? 'border-2 border-red-500 bg-red-500/5' : ''}`}>
                        <Label>Servicios que ofreces *</Label>
                        <p className="text-xs text-muted-foreground mb-3">
                          Selecciona al menos un servicio
                        </p>
                        {validationErrors.includes('services') && (
                          <p className="text-xs text-red-500 mb-2 font-medium">⚠️ Selecciona al menos un servicio</p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {serviceOptions.map((service) => {
                            const Icon = service.icon;
                            const isSelected = formData.services.includes(service.id);
                            
                            return (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => {
                                  toggleService(service.id);
                                  if (validationErrors.includes('services')) setValidationErrors(prev => prev.filter(f => f !== 'services'));
                                }}
                                className={`p-4 rounded-lg border text-left transition-all ${
                                  isSelected
                                    ? "border-yellow-400 bg-yellow-400/10"
                                    : "border-border hover:border-yellow-400/50"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Icon
                                    className={`h-5 w-5 ${
                                      isSelected ? "text-yellow-400" : "text-muted-foreground"
                                    }`}
                                  />
                                  <span className="font-medium">{service.label}</span>
                                  {isSelected && (
                                    <Check className="h-4 w-4 text-yellow-400 ml-auto" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Languages */}
                      <div>
                        <Label className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Idiomas que hablas
                        </Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Ayuda a los pasajeros a comunicarse contigo
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {languageOptions.map((lang) => {
                            const isSelected = formData.languages.includes(lang.id);
                            return (
                              <Badge
                                key={lang.id}
                                variant={isSelected ? "default" : "outline"}
                                className={`cursor-pointer transition-all text-sm py-1.5 ${
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
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Routes, Zones and Prices */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Globe className="h-5 w-5 text-yellow-400" />
                      Zonas de servicio, rutas y precios
                    </h2>

                    <div className="space-y-6">
                      {/* Service Zones - Using Shared Component */}
                      <div className={`p-4 rounded-lg border ${validationErrors.includes('pickupZones') ? 'border-red-500 bg-red-500/5' : 'border-purple-500/30 bg-purple-500/5'}`}>
                        <ZoneSelector
                          initialZones={serviceZonesWithExclusions}
                          onZonesChange={(zones) => {
                            setServiceZonesWithExclusions(zones);
                            // Clear validation error if pickup zones are added
                            if (zones.some(z => z.zoneMode === 'pickup') && validationErrors.includes('pickupZones')) {
                              setValidationErrors(prev => prev.filter(f => f !== 'pickupZones'));
                            }
                          }}
                          validationError={validationErrors.includes('pickupZones')}
                          mode="register"
                        />
                      </div>

                      <Separator className="my-4" />

                      {/* Base prices */}
                      <div>
                        <Label className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Tarifas base
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                          <div>
                            <Label htmlFor="basePrice" className="text-xs text-muted-foreground">Precio base (CHF)</Label>
                            <Input
                              id="basePrice"
                              type="number"
                              min={0}
                              placeholder="Ej: 5"
                              value={formData.basePrice || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  basePrice: parseFloat(e.target.value) || undefined,
                                })
                              }
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="pricePerKm" className="text-xs text-muted-foreground">Precio por km (CHF)</Label>
                            <Input
                              id="pricePerKm"
                              type="number"
                              min={0}
                              step="0.1"
                              placeholder="Ej: 2.50"
                              value={formData.pricePerKm || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  pricePerKm: parseFloat(e.target.value) || undefined,
                                })
                              }
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="hourlyRate" className="text-xs text-muted-foreground">Tarifa hora (CHF)</Label>
                            <Input
                              id="hourlyRate"
                              type="number"
                              min={0}
                              placeholder="Ej: 60"
                              value={formData.hourlyRate || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  hourlyRate: parseFloat(e.target.value) || undefined,
                                })
                              }
                              className="mt-1.5"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* Rutas con precio fijo - Componente compartido con el dashboard */}
                      <FixedRoutesManager
                        initialRoutes={routes}
                        onRoutesChange={(updatedRoutes) => {
                          setRoutes(updatedRoutes);
                        }}
                        mode="create"
                        showTitle={true}
                        onError={(err) => setError(err)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 6: Schedule */}
              {currentStep === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-400" />
                      Horarios de disponibilidad
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      ¿Cuándo estás disponible para trabajar?
                    </p>

                    <div className="space-y-4">
                      <ScheduleSelector
                        initialSchedules={schedules}
                        onSchedulesChange={setSchedules}
                        is24h={is24h}
                        on24hChange={setIs24h}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 7: Description */}
              {currentStep === 7 && (
                <motion.div
                  key="step7"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-yellow-400" />
                      Descripción de tu perfil
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Una buena descripción ayuda a los clientes a conocerte. Usa nuestra IA para generar opciones profesionales.
                    </p>

                    <div className="space-y-4">
                      {/* AI Generation Section */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-400" />
                            <span className="font-medium text-purple-400">Generador de descripción con IA</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={generateAIDescription}
                            disabled={isGeneratingAI}
                            className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10"
                          >
                            {isGeneratingAI ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generando...
                              </>
                            ) : (
                              <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                {aiDescriptions && Object.keys(aiDescriptions).length > 0 ? "Regenerar" : "Generar opciones"}
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          La IA generará 3 opciones con diferentes estilos. Elige la que más te guste o edita el texto.
                        </p>
                      </div>

                      {/* AI Generated Options */}
                      {aiDescriptions && Object.keys(aiDescriptions).length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <Label className="text-sm font-medium">Opciones generadas (selecciona una):</Label>
                          
                          <div className="grid gap-3">
                            {/* Profesional */}
                            {aiDescriptions.profesional && (
                              <button
                                type="button"
                                onClick={() => selectAiDescription("profesional")}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${
                                  selectedAiStyle === "profesional"
                                    ? "border-blue-500 bg-blue-500/10"
                                    : "border-border hover:border-blue-500/50 hover:bg-blue-500/5"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg">💼</span>
                                  <span className="font-semibold">Profesional</span>
                                  <span className="text-xs text-muted-foreground">• Formal y destacando experiencia</span>
                                  {selectedAiStyle === "profesional" && (
                                    <Check className="h-4 w-4 text-blue-500 ml-auto" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {aiDescriptions.profesional.text}
                                </p>
                              </button>
                            )}

                            {/* Cercano */}
                            {aiDescriptions.cercano && (
                              <button
                                type="button"
                                onClick={() => selectAiDescription("cercano")}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${
                                  selectedAiStyle === "cercano"
                                    ? "border-green-500 bg-green-500/10"
                                    : "border-border hover:border-green-500/50 hover:bg-green-500/5"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg">😊</span>
                                  <span className="font-semibold">Cercano</span>
                                  <span className="text-xs text-muted-foreground">• Amigable y personal</span>
                                  {selectedAiStyle === "cercano" && (
                                    <Check className="h-4 w-4 text-green-500 ml-auto" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {aiDescriptions.cercano.text}
                                </p>
                              </button>
                            )}

                            {/* Ejecutivo */}
                            {aiDescriptions.ejecutivo && (
                              <button
                                type="button"
                                onClick={() => selectAiDescription("ejecutivo")}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${
                                  selectedAiStyle === "ejecutivo"
                                    ? "border-yellow-500 bg-yellow-500/10"
                                    : "border-border hover:border-yellow-500/50 hover:bg-yellow-500/5"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg">✨</span>
                                  <span className="font-semibold">Ejecutivo</span>
                                  <span className="text-xs text-muted-foreground">• Premium para clientes VIP</span>
                                  {selectedAiStyle === "ejecutivo" && (
                                    <Check className="h-4 w-4 text-yellow-500 ml-auto" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {aiDescriptions.ejecutivo.text}
                                </p>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}

                      <Separator className="my-4" />

                      {/* Improve existing text section */}
                      {formData.description && formData.description.trim().length >= 10 && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <RefreshCw className="h-4 w-4 text-green-400" />
                              </div>
                              <div>
                                <span className="font-medium text-green-400 text-sm">¿Ya tienes texto?</span>
                                <span className="text-xs text-muted-foreground block">La IA puede mejorarlo manteniendo tu estilo</span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={improveExistingText}
                              disabled={isGeneratingAI}
                              className="border-green-400/50 text-green-400 hover:bg-green-400/10"
                            >
                              {isGeneratingAI ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Mejorando...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="mr-2 h-4 w-4" />
                                  Mejorar con IA
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Editable textarea */}
                      <div>
                        <Label htmlFor="description" className="flex items-center gap-2">
                          Tu descripción
                          {selectedAiStyle && (
                            <Badge variant="outline" className="text-xs">
                              Estilo: {selectedAiStyle}
                            </Badge>
                          )}
                        </Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Puedes editar el texto generado o escribir tu propia descripción
                        </p>
                        <Textarea
                          id="description"
                          placeholder="Escribe una descripción profesional sobre tu servicio de taxi..."
                          value={formData.description}
                          onChange={(e) => {
                            setFormData({ ...formData, description: e.target.value });
                            setSelectedAiStyle(null); // Clear selection when manually editing
                          }}
                          className="min-h-[180px]"
                        />
                        <div className="flex justify-between mt-2">
                          <p className="text-xs text-muted-foreground">
                            {formData.description.length} caracteres
                          </p>
                          {formData.description.length > 500 && (
                            <p className="text-xs text-yellow-500">
                              Recomendado: menos de 500 caracteres
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 8: Preview */}
              {currentStep === 8 && (
                <motion.div
                  key="step8"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Eye className="h-5 w-5 text-yellow-400" />
                      Vista previa de tu perfil
                    </h2>

                    <div className="space-y-6">
                      {/* Profile preview card */}
                      <Card className="border-border overflow-hidden">
                        <div className="h-32 bg-gradient-to-br from-yellow-400/20 to-yellow-400/5" />
                        <CardContent className="p-4 -mt-8">
                          <div className="flex items-end gap-4">
                            {imagePreview ? (
                              <img
                                src={imagePreview}
                                alt="Profile"
                                className="w-20 h-20 rounded-lg object-cover border-4 border-background"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-lg bg-yellow-400/20 border-4 border-background flex items-center justify-center">
                                <Car className="h-8 w-8 text-yellow-400" />
                              </div>
                            )}
                            <div>
                              <h3 className="text-xl font-bold">{formData.name || "Tu nombre"}</h3>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {cityName || "Ciudad"}, {cantonName || "Cantón"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex flex-wrap gap-2">
                            {formData.services.map(serviceId => {
                              const service = serviceOptions.find(s => s.id === serviceId);
                              return service ? (
                                <Badge key={serviceId} variant="secondary">
                                  {service.label}
                                </Badge>
                              ) : null;
                            })}
                          </div>

                          {is24h && (
                            <Badge className="mt-3 bg-green-500/10 text-green-500 border-green-500/30">
                              <Clock className="mr-1 h-3 w-3" />
                              Disponible 24/7
                            </Badge>
                          )}

                          {formData.description && (
                            <p className="mt-4 text-sm text-muted-foreground">
                              {formData.description}
                            </p>
                          )}

                          <Separator className="my-4" />

                          {/* Prices preview */}
                          {(formData.basePrice || formData.pricePerKm || formData.hourlyRate) && (
                            <div className="grid grid-cols-3 gap-4 text-center">
                              {formData.basePrice && (
                                <div>
                                  <div className="text-lg font-bold text-yellow-400">
                                    CHF {formData.basePrice}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Precio base</div>
                                </div>
                              )}
                              {formData.pricePerKm && (
                                <div>
                                  <div className="text-lg font-bold text-yellow-400">
                                    CHF {formData.pricePerKm}/km
                                  </div>
                                  <div className="text-xs text-muted-foreground">Por kilómetro</div>
                                </div>
                              )}
                              {formData.hourlyRate && (
                                <div>
                                  <div className="text-lg font-bold text-yellow-400">
                                    CHF {formData.hourlyRate}/h
                                  </div>
                                  <div className="text-xs text-muted-foreground">Tarifa hora</div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Routes preview */}
                          {routes.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Route className="h-4 w-4 text-yellow-400" />
                                Rutas
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {routes.map((route, i) => (
                                  <Badge key={i} variant="outline">
                                    {route.origin} → {route.destination}
                                    {route.price && ` (CHF ${route.price})`}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Social media preview */}
                          {(formData.website || formData.instagram || formData.facebook) && (
                            <div className="mt-4 flex gap-3">
                              {formData.website && (
                                <LinkIcon className="h-5 w-5 text-muted-foreground" />
                              )}
                              {formData.instagram && (
                                <Instagram className="h-5 w-5 text-pink-500" />
                              )}
                              {formData.facebook && (
                                <Facebook className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                        {/* Terms and Privacy Checkboxes */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id="terms"
                              checked={acceptedTerms}
                              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                              className="mt-0.5"
                            />
                            <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                              Acepto los{" "}
                              <Link href="/terminos" className="text-yellow-400 hover:underline" target="_blank">
                                Términos de Servicio
                              </Link>{" "}
                              y las condiciones de uso de la plataforma.
                            </label>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id="privacy"
                              checked={acceptedPrivacy}
                              onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                              className="mt-0.5"
                            />
                            <label htmlFor="privacy" className="text-sm text-muted-foreground cursor-pointer">
                              Acepto la{" "}
                              <Link href="/privacidad" className="text-yellow-400 hover:underline" target="_blank">
                                Política de Privacidad
                              </Link>
                              , incluyendo el tratamiento de mi ubicación en tiempo real cuando active el GPS para mostrar mi posición a clientes potenciales.
                            </label>
                          </div>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <p className="text-xs text-muted-foreground">
                          Al crear tu perfil, tu información profesional será visible públicamente en la plataforma. 
                          Puedes gestionar tu visibilidad desde tu panel de control en cualquier momento.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>

              {currentStep < 8 ? (
                <Button
                  type="button"
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                  onClick={nextStep}
                >
                  Siguiente
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando perfil...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Crear perfil
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
