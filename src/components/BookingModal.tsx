"use client";

import { useState, useMemo } from "react";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Users,
  StickyNote,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Car,
  AlertCircle,
  XCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTranslations } from 'next-intl';
import { checkDriverAvailability, type DaySchedule, type TimeSlot } from '@/lib/schedule-check';

interface DriverInfo {
  id: string;
  name: string;
  photo?: string | null;
  vehicle?: string;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleType?: string;
  city?: { name: string };
  canton?: { name: string };
  isAvailable24h?: boolean;
  workingHours?: DaySchedule[];
}

interface BookingStopData {
  text: string;
  latitude?: number;
  longitude?: number;
}

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  driver: DriverInfo | null;
  origin?: string;
  destination?: string;
  stops?: BookingStopData[];
  estimatedPrice?: { minPrice: number; maxPrice: number } | { min: number; max: number } | null;
}

type Step = 1 | 2 | 3;

const DAY_LABELS = [
  { js: 0, key: 'sunday', short: 'sun', full: 'sundayFull' },
  { js: 1, key: 'monday', short: 'mon', full: 'mondayFull' },
  { js: 2, key: 'tuesday', short: 'tue', full: 'tuesdayFull' },
  { js: 3, key: 'wednesday', short: 'wed', full: 'wednesdayFull' },
  { js: 4, key: 'thursday', short: 'thu', full: 'thursdayFull' },
  { js: 5, key: 'friday', short: 'fri', full: 'fridayFull' },
  { js: 6, key: 'saturday', short: 'sat', full: 'saturdayFull' },
];

// Generate 30-min time slots between two times
function generateTimeSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let totalMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (totalMin <= endMin) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    totalMin += 30;
  }
  return slots;
}

export default function BookingModal({
  open,
  onClose,
  driver,
  origin = "",
  destination = "",
  stops = [] as BookingStopData[],
  estimatedPrice = null,
}: BookingModalProps) {
  const t = useTranslations('booking');
  const tCommon = useTranslations('common');
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);

  // Step 1: Contact info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Step 2: Trip details
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [notes, setNotes] = useState("");

  // Driver schedule info
  const is24hDriver = driver?.isAvailable24h ?? true;
  const workingHours = driver?.workingHours || [];

  // Get schedule for the selected day
  const selectedDaySchedule = useMemo(() => {
    if (!scheduledDate || is24hDriver) return null;
    const dayOfWeek = new Date(scheduledDate + 'T12:00:00').getDay();
    return workingHours.find(s => s.dayOfWeek === dayOfWeek) || null;
  }, [scheduledDate, workingHours, is24hDriver]);

  const isDayClosed = selectedDaySchedule
    ? selectedDaySchedule.mode === 'closed'
    : (workingHours.length > 0 && !is24hDriver && scheduledDate);

  const isDayAllDay = selectedDaySchedule?.mode === 'all_day';

  // Generate available time slots for selected day
  const availableTimeSlots = useMemo(() => {
    if (!selectedDaySchedule || selectedDaySchedule.mode !== 'specific' || !selectedDaySchedule.slots.length) return [];
    const allSlots: string[] = [];
    for (const slot of selectedDaySchedule.slots) {
      allSlots.push(...generateTimeSlots(slot.startTime, slot.endTime));
    }
    // Deduplicate and sort
    return [...new Set(allSlots)].sort();
  }, [selectedDaySchedule]);

  // Availability check
  const availabilityCheck = useMemo(() => {
    if (!driver) return { isAvailable: true, reason: '' };
    return checkDriverAvailability(
      workingHours,
      is24hDriver,
      scheduledDate || null,
      scheduledTime || null
    );
  }, [driver, workingHours, is24hDriver, scheduledDate, scheduledTime]);

  const isDriverUnavailable = !availabilityCheck.isAvailable;

  // When date changes and the new day is closed or has different hours, reset time
  const handleDateChange = (newDate: string) => {
    setScheduledDate(newDate);
    setScheduledTime("");
    setError(null);
  };

  // Reset on open/close
  const handleClose = () => {
    setStep(1);
    setLoading(false);
    setError(null);
    setBookingRef(null);
    setCustomerName("");
    setCustomerPhone("");
    setScheduledDate("");
    setScheduledTime("");
    setPassengerCount(1);
    setNotes("");
    onClose();
  };

  const getPriceDisplay = () => {
    if (!estimatedPrice) return null;
    const min = (estimatedPrice as any).minPrice || (estimatedPrice as any).min;
    const max = (estimatedPrice as any).maxPrice || (estimatedPrice as any).max;
    if (!min && !max) return null;
    return `${min}-${max} CHF`;
  };

  const handleSubmit = async () => {
    if (!driver) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          pickupAddress: origin,
          dropoffAddress: destination || null,
          driverId: driver.id,
          scheduledDate: scheduledDate || null,
          scheduledTime: scheduledTime || null,
          passengerCount,
          notes: notes || null,
          stops: stops.length > 0 ? stops.map(s => ({
            address: s.text,
            latitude: s.latitude || null,
            longitude: s.longitude || null,
          })) : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setBookingRef(data.data.reference);
        setStep(3);
      } else {
        setError(data.error || t('errorCreate'));
      }
    } catch (err) {
      setError(tCommon('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  if (!driver) return null;

  const vehicleLabel =
    driver.vehicle ||
    `${driver.vehicleBrand || ""} ${driver.vehicleModel || ""}`.trim() ||
    "Taxi";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-card border-border sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-400">
            <Car className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && t('step1Title')}
            {step === 2 && t('step2Title')}
            {step === 3 && t('step3Title')}
          </DialogDescription>
        </DialogHeader>

        {/* Driver info bar */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
          {driver.photo ? (
            <img
              src={driver.photo}
              alt={driver.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
              <Car className="h-5 w-5 text-yellow-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{driver.name}</p>
            <p className="text-xs text-muted-foreground">
              {vehicleLabel}
              {driver.city && ` · ${driver.city.name}`}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-yellow-400" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Contact Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-yellow-400" />
                {t('yourName')} *
              </label>
              <Input
                placeholder={t('yourNamePlaceholder')}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-yellow-400" />
                {t('phone')} *
              </label>
              <Input
                placeholder={t('phonePlaceholder')}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                type="tel"
                className="bg-background border-border"
              />
            </div>
            <Button
              className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
              onClick={() => {
                if (!customerName.trim() || !customerPhone.trim()) {
                  setError(t('namePhoneRequired'));
                  return;
                }
                setError(null);
                setStep(2);
              }}
            >
              {tCommon('next')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          </div>
        )}

        {/* Step 2: Trip Details */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Route summary */}
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('pickup')}</p>
                  <p className="text-sm font-medium truncate">{origin || t('notSpecified')}</p>
                </div>
              </div>
              {destination && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('destination')}</p>
                    <p className="text-sm font-medium truncate">{destination}</p>
                  </div>
                </div>
              )}
              {stops.length > 0 && (
                <>
                  <div className="border-t border-border pt-2 mt-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-blue-400" />
                      {t('stops')}
                    </p>
                  </div>
                  {stops.map((stop, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('stopLabel', { number: i + 1 })}</p>
                        <p className="text-sm font-medium truncate">{stop.text}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {getPriceDisplay() && (
                <div className="pt-1 border-t border-border">
                  <p className="text-xs text-muted-foreground">{t('estimatedPrice')}</p>
                  <p className="text-sm font-bold text-yellow-400">{getPriceDisplay()}</p>
                </div>
              )}
            </div>

            {/* ==================== SCHEDULE-AWARE DATE/TIME PICKER ==================== */}
            {!is24hDriver && workingHours.length > 0 ? (
              <>
                {/* Driver schedule overview */}
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5 font-medium">
                    <Clock className="h-3.5 w-3.5 text-yellow-400" />
                    {t('driverSchedule')}
                  </p>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {DAY_LABELS.map(day => {
                      const schedule = workingHours.find(s => s.dayOfWeek === day.js);
                      const isOpen = schedule && schedule.mode !== 'closed';
                      const slots = schedule?.slots || [];
                      return (
                        <div
                          key={day.js}
                          className={`py-1.5 px-0.5 rounded-md text-[10px] leading-tight ${
                            isOpen
                              ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-400/40 border border-red-500/10'
                          }`}
                        >
                          <div className="font-bold text-[11px]">{t(day.short)}</div>
                          {!schedule || schedule.mode === 'closed' ? (
                            <div className="mt-0.5 text-[9px]">{t('closed')}</div>
                          ) : schedule.mode === 'all_day' ? (
                            <div className="mt-0.5 text-[9px]">24h</div>
                          ) : slots.length > 0 ? (
                            <div className="mt-0.5 text-[9px]">
                              {slots[0].startTime}<br />{slots[0].endTime}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Date picker */}
                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-yellow-400" />
                    {t('date')}
                  </label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className={`bg-background border-border ${isDayClosed ? 'border-red-500/50 bg-red-500/5' : ''}`}
                  />
                </div>

                {/* Closed day warning */}
                {isDayClosed && scheduledDate && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-red-400 font-medium">
                        {t('dayNotAvailable')}
                      </p>
                      <p className="text-xs text-red-400/60 mt-0.5">
                        {t('driverNotWorkingDay', { day: t(DAY_LABELS[new Date(scheduledDate + 'T12:00:00').getDay()].full) })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Time slots for open day */}
                {scheduledDate && !isDayClosed && !isDayAllDay && availableTimeSlots.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-yellow-400" />
                      {t('time')}
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {availableTimeSlots.map(slot => {
                        // For today, disable past slots
                        const isPast = scheduledDate === new Date().toISOString().split("T")[0]
                          && slot < `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
                        const isSelected = scheduledTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isPast}
                            onClick={() => {
                              setScheduledTime(slot);
                              setError(null);
                            }}
                            className={`py-2 px-1 rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/20 scale-105'
                                : isPast
                                  ? 'bg-muted/30 text-muted-foreground/30 cursor-not-allowed line-through'
                                  : 'bg-muted/50 text-muted-foreground hover:bg-yellow-400/10 hover:text-yellow-400 border border-border hover:border-yellow-400/30'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All day = free time input */}
                {scheduledDate && isDayAllDay && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-yellow-400" />
                      {t('time')}
                    </label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => { setScheduledTime(e.target.value); setError(null); }}
                      className="bg-background border-border"
                    />
                  </div>
                )}

                {/* No date selected = ASAP check */}
                {!scheduledDate && isDriverUnavailable && (
                  <div className="p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg flex items-start gap-2">
                    <Info className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-yellow-400 font-medium">
                        {t('driverNotAvailableNow')}
                      </p>
                      <p className="text-xs text-yellow-400/60 mt-0.5">
                        {t('selectGreenDate')}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* ==================== 24h / NO SCHEDULE: normal inputs ==================== */
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-yellow-400" />
                    {t('date')}
                  </label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => { setScheduledDate(e.target.value); setError(null); }}
                    min={new Date().toISOString().split("T")[0]}
                    className="bg-background border-border"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {t('emptyDate')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-yellow-400" />
                    {t('time')}
                  </label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => { setScheduledTime(e.target.value); setError(null); }}
                    className="bg-background border-border"
                  />
                </div>
              </div>
            )}

            {/* Passengers */}
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-yellow-400" />
                {t('passengers')}
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                >
                  -
                </Button>
                <span className="text-lg font-semibold w-8 text-center">{passengerCount}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setPassengerCount(Math.min(8, passengerCount + 1))}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5 text-yellow-400" />
                {t('notes')}
              </label>
              <Input
                placeholder={t('notesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {tCommon('back')}
              </Button>
              <Button
                className={`flex-1 ${isDriverUnavailable ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-yellow-400 text-black hover:bg-yellow-500'}`}
                onClick={handleSubmit}
                disabled={loading || isDriverUnavailable}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isDriverUnavailable ? (
                  <XCircle className="mr-2 h-4 w-4" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {isDriverUnavailable ? t('notAvailable') : tCommon('confirm')}
              </Button>
            </div>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && bookingRef && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-400" />
            </div>

            <div>
              <h3 className="text-xl font-bold mb-1">{t('bookingCreated')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('yourReference')}
              </p>
              <p className="text-2xl font-bold text-yellow-400 mt-1 tracking-wider">
                {bookingRef}
              </p>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg border border-border text-left text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('driver')}</span>
                <span className="font-medium">{driver.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pickup')}:</span>
                <span className="font-medium truncate ml-2 max-w-[200px]">{origin}</span>
              </div>
              {destination && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('destination')}:</span>
                  <span className="font-medium truncate ml-2 max-w-[200px]">{destination}</span>
                </div>
              )}
              {stops.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('stops')}:</span>
                  <span className="font-medium text-sm">{stops.length}</span>
                </div>
              )}
              {scheduledDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('date')}:</span>
                  <span className="font-medium">{scheduledDate}</span>
                </div>
              )}
              {scheduledTime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('time')}:</span>
                  <span className="font-medium">{scheduledTime}</span>
                </div>
              )}
              {getPriceDisplay() && (
                <div className="flex justify-between pt-1 border-t border-border">
                  <span className="text-muted-foreground">{t('estimatedPrice')}:</span>
                  <span className="font-bold text-yellow-400">{getPriceDisplay()}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {t('driverWillConfirm')}
            </p>

            <Button
              className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
              onClick={handleClose}
            >
              {t('done')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
