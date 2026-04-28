"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Phone,
  PhoneCall,
  AlertTriangle,
  X,
  MapPin,
  Loader2,
  ShieldAlert,
  Share2,
  MessageCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export default function SOSButton() {
  const t = useTranslations("client.sos");

  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [sosId, setSosId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Start sending GPS updates to server
  const startLocationTracking = useCallback((sosAlertId: string) => {
    // Watch position continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await fetch(`/api/sos/${sosAlertId}/location`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          });
        } catch (err) {
          console.error("Error sending location update:", err);
        }
      },
      (err) => {
        console.warn("GPS tracking error:", err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    setIsTracking(true);
  }, []);

  const getGeolocation = useCallback((): Promise<{
    latitude: number;
    longitude: number;
  } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGeoError(t("geoNotSupported"));
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          let errorMsg = t("geoError");
          if (err.code === err.PERMISSION_DENIED) {
            errorMsg = t("geoPermissionDenied");
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errorMsg = t("geoUnavailable");
          } else if (err.code === err.TIMEOUT) {
            errorMsg = t("geoTimeout");
          }
          setGeoError(errorMsg);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, [t]);

  const fetchEmergencyContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/client/emergency-contacts");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setContacts(data.data);
      }
    } catch (err) {
      console.error("Error fetching emergency contacts:", err);
    }
  }, []);

  const buildWhatsAppUrl = useCallback(
    (phone: string, url: string) => {
      const cleanPhone = phone.replace(/[^0-9+]/g, "");
      const text = encodeURIComponent(
        `${t("whatsappMessage")}\n\n📍 ${url}`
      );
      return `https://wa.me/${cleanPhone}?text=${text}`;
    },
    [t]
  );

  const handleCopyLink = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, []);

  const handleCopyPhoneLink = useCallback(async (phone: string, url: string) => {
    const waUrl = buildWhatsAppUrl(phone, url);
    try {
      await navigator.clipboard.writeText(waUrl);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    } catch {
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    }
  }, [buildWhatsAppUrl]);

  const handleSOS = useCallback(async () => {
    if (sending) return;
    setSending(true);
    setGeoError(null);
    setAlertSent(false);
    setTrackingUrl(null);
    setSosId(null);

    try {
      // Step 1: Get geolocation
      const coords = await getGeolocation();

      // Step 2: Send SOS alert to server
      const body: {
        latitude?: number;
        longitude?: number;
        message: string;
      } = {
        message: "SOS Alert",
      };
      if (coords) {
        body.latitude = coords.latitude;
        body.longitude = coords.longitude;
      }

      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success && data.data) {
        setSosId(data.data.id);
        // Build full tracking URL client-side (works regardless of domain)
        const token = data.data.trackingToken;
        if (token && typeof window !== 'undefined') {
          setTrackingUrl(`${window.location.origin}/track/sos/${token}`);
        }
        if (data.contacts) {
          setContacts(data.contacts);
        }

        // Start GPS tracking in background
        startLocationTracking(data.data.id);
      }

      // If contacts not returned from SOS response, fetch separately
      if (!data.contacts) {
        await fetchEmergencyContacts();
      }

      setAlertSent(true);
      setDialogOpen(true);
    } catch (err) {
      console.error("SOS error:", err);
      await fetchEmergencyContacts();
      setDialogOpen(true);
    } finally {
      setSending(false);
    }
  }, [
    sending,
    getGeolocation,
    fetchEmergencyContacts,
    startLocationTracking,
  ]);

  const handleDeactivate = useCallback(async () => {
    if (!sosId) return;
    stopTracking();
    try {
      await fetch(`/api/sos/${sosId}`, {
        method: "PATCH",
      });
    } catch (err) {
      console.error("Error deactivating SOS:", err);
    }
    setTrackingUrl(null);
    setSosId(null);
  }, [sosId, stopTracking]);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  return (
    <>
      {/* Floating SOS Button */}
      <button
        onClick={handleSOS}
        disabled={sending}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-red-600 text-white font-bold text-lg shadow-lg shadow-red-600/30 hover:bg-red-500 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={t("buttonLabel")}
        style={{
          animation: "sos-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        }}
      >
        {sending ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : (
          <span className="flex flex-col items-center leading-none">
            <ShieldAlert className="h-6 w-6 mb-0.5" />
          </span>
        )}

        <style jsx>{`
          @keyframes sos-pulse {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
            }
            50% {
              box-shadow: 0 0 0 12px rgba(239, 68, 68, 0);
            }
          }
        `}</style>
      </button>

      {/* SOS Alert Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); else setDialogOpen(true); }}>
        <DialogContent className="bg-card border-border sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-lg">
              {alertSent ? (
                <AlertTriangle className="h-5 w-5 text-red-400" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-yellow-400" />
              )}
              {alertSent ? t("alertSent") : t("sending")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {alertSent
                ? isTracking
                  ? t("trackingActive")
                  : t("alertSentDesc")
                : t("sendingDesc")}
            </DialogDescription>
          </DialogHeader>

          {/* Geolocation error notice */}
          {geoError && alertSent && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-sm">
              <MapPin className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span className="text-yellow-400">{geoError}</span>
            </div>
          )}

          {/* Tracking link */}
          {alertSent && trackingUrl && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                  <span className="text-sm text-green-400 font-medium truncate">
                    {t("liveTracking")}
                  </span>
                </div>
                {isTracking && (
                  <Eye className="h-4 w-4 text-green-400 flex-shrink-0" />
                )}
              </div>

              {/* Share link section */}
              <div className="p-3 rounded-lg bg-background/50 border border-border space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5" />
                  {t("shareLocation")}
                </p>

                {/* Copy link button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyLink(trackingUrl)}
                  className="w-full border-border text-muted-foreground hover:bg-muted/50 gap-2"
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-green-400">{t("copied")}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      {t("copyLink")}
                    </>
                  )}
                </Button>
              </div>

              {/* Emergency contacts with WhatsApp */}
              {contacts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("sendViaWhatsApp")}
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {contact.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contact.relation}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          <Button
                            size="sm"
                            asChild
                            className="bg-green-600 hover:bg-green-500 text-white gap-1.5"
                          >
                            <a
                              href={buildWhatsAppUrl(contact.phone, trackingUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span className="text-xs">WhatsApp</span>
                            </a>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleCopyPhoneLink(contact.phone, trackingUrl)}
                            className="text-muted-foreground hover:text-white hover:bg-muted/50"
                            title={t("copyLink")}
                          >
                            {copiedPhone === contact.id ? (
                              <CheckCircle2 className="h-4 w-4 text-green-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            asChild
                            className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                          >
                            <a href={`tel:${contact.phone}`}>
                              <PhoneCall className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No contacts hint */}
              {contacts.length === 0 && (
                <div className="text-center py-3 px-3">
                  <p className="text-sm text-muted-foreground">
                    {t("noContacts")}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {t("noContactsHint")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* No tracking URL available (geo failed or server error) */}
          {alertSent && !trackingUrl && (
            <div className="space-y-3">
              {contacts.length > 0 ? (
                <>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("callEmergencyContacts")}
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {contact.name}
                          </p>
                          <p className="text-xs text-yellow-400">
                            {contact.relation}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          asChild
                          className="ml-3 bg-green-600 hover:bg-green-500 text-white gap-1.5 flex-shrink-0"
                        >
                          <a href={`tel:${contact.phone}`}>
                            <PhoneCall className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{contact.phone}</span>
                            <span className="sm:hidden">{t("call")}</span>
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 px-3">
                  <p className="text-sm text-muted-foreground">
                    {t("noContacts")}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {t("noContactsHint")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer buttons */}
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {/* Deactivate tracking link */}
            {trackingUrl && isTracking && (
              <Button
                size="lg"
                onClick={handleDeactivate}
                variant="outline"
                className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 font-bold text-base gap-2"
              >
                <EyeOff className="h-5 w-5" />
                {t("deactivateLink")}
              </Button>
            )}

            {/* Call 112 */}
            <Button
              size="lg"
              asChild
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-base gap-2 shadow-lg shadow-red-600/20"
            >
              <a href="tel:112">
                <Phone className="h-5 w-5" />
                {t("call112")}
              </a>
            </Button>

            {/* Close */}
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              className="w-full border-border text-muted-foreground hover:bg-muted/50 gap-2"
            >
              <X className="h-4 w-4" />
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
