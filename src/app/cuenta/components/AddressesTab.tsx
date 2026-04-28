"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  MapPin,
  Plus,
  Trash2,
  Home,
  Briefcase,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type AddressType = "home" | "work" | "custom";

interface SavedAddress {
  id: string;
  type: AddressType;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationSuggestion {
  id: string;
  name: string;
  type: string;
  icon?: string;
  city?: string | null;
  state?: string | null;
  street?: string | null;
  housenumber?: string | null;
  postcode?: string | null;
  poiName?: string | null;
  fullAddress?: string;
  shortAddress?: string;
  country?: string;
  lat?: number;
  lon?: number;
}

const TYPE_CONFIG: Record<
  AddressType,
  { emoji: string; labelKey: string; color: string }
> = {
  home: {
    emoji: "🏠",
    labelKey: "home",
    color: "bg-yellow-400/20 text-yellow-400",
  },
  work: {
    emoji: "💼",
    labelKey: "work",
    color: "bg-blue-400/20 text-blue-400",
  },
  custom: {
    emoji: "📍",
    labelKey: "custom",
    color: "bg-purple-400/20 text-purple-400",
  },
};

const MAX_ADDRESSES = 10;

const initialFormState = {
  type: "home" as AddressType,
  name: "",
  address: "",
  latitude: 0,
  longitude: 0,
};

export default function AddressesTab() {
  const t = useTranslations("client.addresses");
  const tSearch = useTranslations("search");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Geocoding suggestions state
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const addressContainerRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/client/addresses");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAddresses(data.data);
      } else {
        setError(data.message || t("errorSave"));
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setError(t("errorSave"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Debounced geocoding search when address input changes
  useEffect(() => {
    if (!showForm) return;

    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (form.address.trim().length >= 2) {
        setSuggestionsLoading(true);
        try {
          const controller = new AbortController();
          const res = await fetch(
            `/api/locations?q=${encodeURIComponent(form.address.trim())}`,
            { signal: controller.signal }
          );
          const data = await res.json();
          if (data.success) {
            const results = Array.isArray(data.data)
              ? data.data
              : data.data?.combined || [];
            setSuggestions(results);
            if (results.length > 0) {
              setShowSuggestions(true);
            }
          }
        } catch (err: any) {
          if (err.name !== "AbortError") {
            console.error("Error fetching address suggestions:", err);
          }
        } finally {
          setSuggestionsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [form.address, showForm]);

  // Click outside to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addressContainerRef.current &&
        !addressContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    isSelectingRef.current = true;

    let displayValue =
      suggestion.shortAddress || suggestion.fullAddress || suggestion.name;

    if (suggestion.poiName) {
      displayValue = suggestion.shortAddress || suggestion.poiName;
    }

    if (!displayValue) {
      if (suggestion.street) {
        displayValue = suggestion.housenumber
          ? `${suggestion.street} ${suggestion.housenumber}`
          : suggestion.street;
        const cityName = suggestion.city;
        if (cityName) displayValue += `, ${cityName}`;
      } else if (suggestion.city) {
        displayValue = suggestion.state
          ? `${suggestion.name}, ${suggestion.state}`
          : suggestion.name;
      } else {
        displayValue = suggestion.name;
      }
    }

    setForm((prev) => ({
      ...prev,
      address: displayValue,
      latitude: suggestion.lat || 0,
      longitude: suggestion.lon || 0,
    }));
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleAddressInputChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      address: value,
      // Reset lat/lng when user types manually (not from suggestion)
      latitude: 0,
      longitude: 0,
    }));
  };

  const hasHome = addresses.some((a) => a.type === "home");
  const hasWork = addresses.some((a) => a.type === "work");
  const isMaxReached = addresses.length >= MAX_ADDRESSES;

  const availableTypes = (
    ["home", "work", "custom"] as AddressType[]
  ).filter((type) => {
    if (type === "home") return !hasHome;
    if (type === "work") return !hasWork;
    return true;
  });

  const handleOpenForm = () => {
    setForm({
      type: availableTypes[0] || "custom",
      name: "",
      address: "",
      latitude: 0,
      longitude: 0,
    });
    setMessage(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setForm(initialFormState);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      setMessage({ type: "error", text: t("name") });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/client/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          name: form.name.trim(),
          address: form.address.trim(),
          latitude: form.latitude,
          longitude: form.longitude,
        }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        setAddresses((prev) => [...prev, data.data]);
        handleCloseForm();
        setMessage({ type: "success", text: t("saved") });
        // Clear success message after 3s
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: "error",
          text: data.message || t("errorSave"),
        });
      }
    } catch (err) {
      console.error("Error saving address:", err);
      setMessage({ type: "error", text: t("errorSave") });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/client/addresses`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Error deleting address:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (error && addresses.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-400/60" />
        </div>
        <p className="text-muted-foreground mb-1 font-medium">{error}</p>
        <p className="text-sm text-muted-foreground/60 mb-6">
          {t("emptyHint")}
        </p>
        <Button
          onClick={fetchAddresses}
          variant="outline"
          className="border-border text-muted-foreground hover:bg-muted hover:text-white gap-2"
        >
          <Loader2 className="h-4 w-4" />
          {t("add")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">
          {addresses.length} / {MAX_ADDRESSES}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenForm}
          disabled={isMaxReached}
          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("add")}
        </Button>
      </div>

      {/* Success / Error banner */}
      {message && !showForm && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-400/10 text-green-400 border border-green-400/20"
              : "bg-red-400/10 text-red-400 border border-red-400/20"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Add address form */}
      {showForm && (
        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="p-4 space-y-4">
            {/* Form header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-400/20 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-yellow-400" />
                </div>
                <h3 className="font-semibold text-white text-sm">
                  {t("title")}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseForm}
                className="text-muted-foreground hover:text-white hover:bg-muted h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Type selector */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground font-medium">
                {t("type")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["home", "work", "custom"] as AddressType[]).map((type) => {
                  const config = TYPE_CONFIG[type];
                  const isDisabled =
                    (type === "home" && hasHome) ||
                    (type === "work" && hasWork);
                  const isSelected = form.type === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={isDisabled}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, type }))
                      }
                      className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-medium transition-all border ${
                        isDisabled
                          ? "opacity-40 cursor-not-allowed border-border bg-background/30 text-muted-foreground"
                          : isSelected
                            ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-400"
                            : "border-border bg-background text-muted-foreground hover:border-yellow-400/30 hover:text-white"
                      }`}
                    >
                      <span className="text-lg">{config.emoji}</span>
                      <span>{t(config.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name input */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                {form.type === "home" ? (
                  <Home className="h-3.5 w-3.5" />
                ) : form.type === "work" ? (
                  <Briefcase className="h-3.5 w-3.5" />
                ) : (
                  <MapPin className="h-3.5 w-3.5" />
                )}
                {t("name")}
              </label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={t("namePlaceholder")}
                className="bg-background border-border text-white placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Address input with geocoding suggestions */}
            <div className="space-y-1.5" ref={addressContainerRef}>
              <label className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {t("address")}
              </label>
              <div className="relative">
                <Input
                  ref={addressInputRef}
                  value={form.address}
                  onChange={(e) => handleAddressInputChange(e.target.value)}
                  onFocus={() => {
                    if (
                      form.address.trim().length >= 2 &&
                      suggestions.length > 0
                    ) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder={t("addressPlaceholder")}
                  className="bg-background border-border text-white placeholder:text-muted-foreground/50 pr-10"
                />
                {/* Loading spinner and clear button */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {suggestionsLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {form.address && !suggestionsLoading && (
                    <button
                      type="button"
                      onClick={() => {
                        handleAddressInputChange("");
                      }}
                      className="p-1 hover:bg-muted rounded-full"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && (
                <div className="absolute left-4 right-4 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                  {suggestionsLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <div className="animate-spin h-5 w-5 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                      {tSearch("placeholder")}
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="py-1">
                      {suggestions.map((suggestion, index) => {
                        const getIconDisplay = () => {
                          if (suggestion.icon) {
                            return <span className="text-lg">{suggestion.icon}</span>;
                          }
                          return (
                            <Building2 className="h-4 w-4 text-yellow-400" />
                          );
                        };

                        const getSubtitle = () => {
                          if (suggestion.fullAddress) {
                            return suggestion.fullAddress;
                          }
                          if (suggestion.shortAddress) {
                            return suggestion.shortAddress;
                          }
                          const cityName = suggestion.city;
                          const stateName = suggestion.state;
                          if (cityName) {
                            return stateName
                              ? `${cityName}, ${stateName}`
                              : cityName;
                          }
                          return tSearch("switzerland");
                        };

                        return (
                          <button
                            key={`${suggestion.type}-${suggestion.id}-${index}`}
                            type="button"
                            onClick={() =>
                              handleSelectSuggestion(suggestion)
                            }
                            className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-yellow-400/10 transition-colors text-left"
                          >
                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-yellow-400/20 flex items-center justify-center">
                              {getIconDisplay()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">
                                {suggestion.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {getSubtitle()}
                              </div>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  ) : form.address.trim().length >= 2 ? (
                    <div className="p-3 text-center text-muted-foreground text-sm">
                      {tSearch("noResults")}
                    </div>
                  ) : null}
                </div>
              )}

              <p className="text-xs text-muted-foreground/60">
                {t("addHint")}
              </p>
            </div>

            {/* Coord indicator */}
            {form.latitude !== 0 && form.longitude !== 0 && (
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <CheckCircle className="h-3 w-3" />
                <span>
                  {t("coordsSaved", undefined, {
                    lat: form.latitude.toFixed(4),
                    lon: form.longitude.toFixed(4),
                  })}
                </span>
              </div>
            )}

            {/* Hidden lat/lng */}
            <input type="hidden" name="latitude" value={form.latitude} />
            <input type="hidden" name="longitude" value={form.longitude} />

            {/* Form error message */}
            {message && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-green-400/10 text-green-400 border border-green-400/20"
                    : "bg-red-400/10 text-red-400 border border-red-400/20"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                {message.text}
              </div>
            )}

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-semibold gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t("add")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Addresses list */}
      {!showForm && addresses.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground mb-1 font-medium">
            {t("empty")}
          </p>
          <p className="text-sm text-muted-foreground/60 mb-6">
            {t("emptyHint")}
          </p>
          <Button
            onClick={handleOpenForm}
            className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("add")}
          </Button>
        </div>
      )}

      {!showForm && addresses.length > 0 && (
        <div className="space-y-3">
          {addresses.map((addr) => {
            const config = TYPE_CONFIG[addr.type];
            return (
              <Card
                key={addr.id}
                className="border-border bg-card overflow-hidden transition-all hover:border-border/80"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${config.color}`}
                    >
                      {config.emoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white truncate">
                          {addr.name}
                        </p>
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${config.color}`}
                        >
                          {t(config.labelKey)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {addr.address}
                      </p>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(addr.id)}
                      disabled={deletingId === addr.id}
                      className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 flex-shrink-0 h-8 w-8"
                    >
                      {deletingId === addr.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
