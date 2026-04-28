/**
 * Schedule availability checker
 * Validates if a driver is available at a given date/time based on their workingHours
 */

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface DaySchedule {
  dayOfWeek: number;
  mode: 'closed' | 'specific' | 'all_day';
  slots: TimeSlot[];
}

export interface ScheduleCheckResult {
  isAvailable: boolean;
  reason: string;
  schedule?: string; // e.g. "08:00 - 20:00"
}

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAYS_DE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAYS_IT = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/**
 * Check if a driver with given workingHours is available at a specific date/time
 * @param workingHours - Driver's schedule (DaySchedule[])
 * @param isAvailable24h - If driver is 24/7
 * @param scheduledDate - ISO date string (YYYY-MM-DD) or null for "as soon as possible"
 * @param scheduledTime - Time string (HH:MM) or null
 * @param locale - User's locale for day name
 * @returns ScheduleCheckResult
 */
export function checkDriverAvailability(
  workingHours: DaySchedule[] | null | undefined,
  isAvailable24h: boolean,
  scheduledDate: string | null | undefined,
  scheduledTime: string | null | undefined,
  locale: string = 'es'
): ScheduleCheckResult {
  // 24/7 drivers are always available
  if (isAvailable24h) {
    return { isAvailable: true, reason: 'available24h' };
  }

  // No schedule defined = assume available (flexible mode)
  if (!workingHours || workingHours.length === 0) {
    return { isAvailable: true, reason: 'noSchedule' };
  }

  // If no specific date/time, check current time
  const checkDate = scheduledDate ? new Date(scheduledDate + 'T00:00:00') : new Date();
  const dayOfWeek = checkDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Find the schedule for this day
  const daySchedule = workingHours.find(s => s.dayOfWeek === dayOfWeek);

  // If no schedule for this day → closed
  if (!daySchedule) {
    const dayNames: Record<string, string[]> = {
      es: DAYS_ES, de: DAYS_DE, fr: DAYS_FR, it: DAYS_IT, en: DAYS_EN, pt: DAYS_PT
    };
    const dayName = (dayNames[locale] || DAYS_ES)[dayOfWeek];
    return { isAvailable: false, reason: `closedDay`, schedule: dayName };
  }

  // Closed day
  if (daySchedule.mode === 'closed') {
    const dayNames: Record<string, string[]> = {
      es: DAYS_ES, de: DAYS_DE, fr: DAYS_FR, it: DAYS_IT, en: DAYS_EN, pt: DAYS_PT
    };
    const dayName = (dayNames[locale] || DAYS_ES)[dayOfWeek];
    return { isAvailable: false, reason: 'closedDay', schedule: dayName };
  }

  // All day (00:00-23:59)
  if (daySchedule.mode === 'all_day') {
    return { isAvailable: true, reason: 'allDay', schedule: '00:00 - 23:59' };
  }

  // Specific hours - need to check the time
  if (daySchedule.mode === 'specific' && daySchedule.slots.length > 0) {
    // If no specific time provided by customer (ASAP), use current time
    let checkTime: string;
    if (scheduledTime) {
      checkTime = scheduledTime;
    } else {
      // For ASAP, check current time
      const now = new Date();
      checkTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    // Check if the time falls within any slot
    for (const slot of daySchedule.slots) {
      if (checkTime >= slot.startTime && checkTime <= slot.endTime) {
        const scheduleStr = `${slot.startTime} - ${slot.endTime}`;
        return { isAvailable: true, reason: 'inSlot', schedule: scheduleStr };
      }
    }

    // Time doesn't fall within any slot
    // Build a summary of the day's schedule
    const scheduleStr = daySchedule.slots.map(s => `${s.startTime}-${s.endTime}`).join(', ');
    return { isAvailable: false, reason: 'outsideHours', schedule: scheduleStr };
  }

  // Default: available
  return { isAvailable: true, reason: 'default' };
}

/**
 * Get a human-readable summary of a driver's schedule for a specific locale
 */
export function getScheduleSummary(
  workingHours: DaySchedule[] | null | undefined,
  isAvailable24h: boolean,
  locale: string = 'es'
): string {
  if (isAvailable24h) return '24/7';
  if (!workingHours || workingHours.length === 0) return '';

  const dayNames: Record<string, string[]> = {
    es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    de: ['Son', 'Mon', 'Die', 'Mit', 'Don', 'Fre', 'Sam'],
    fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    it: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  };

  const names = dayNames[locale] || dayNames.es;

  const activeDays = workingHours
    .filter(s => s.mode !== 'closed')
    .sort((a, b) => {
      // Sort: Mon=1, Tue=2, ..., Sun=0 (put Sunday at end)
      const order = (d: number) => d === 0 ? 7 : d;
      return order(a.dayOfWeek) - order(b.dayOfWeek);
    })
    .map(s => {
      const dayName = names[s.dayOfWeek];
      if (s.mode === 'all_day') return `${dayName} 24h`;
      const slots = s.slots.map(sl => `${sl.startTime}-${sl.endTime}`).join(', ');
      return `${dayName} ${slots}`;
    });

  return activeDays.join(' · ');
}
