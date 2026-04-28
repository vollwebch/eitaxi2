"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Phone,
  User,
  Users,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  PhoneCall,
  Save,
  ShieldAlert,
  EyeOff,
  Clock,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

interface SOSAlertData {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  trackingToken: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function EmergencyTab() {
  const t = useTranslations("client.emergencyContacts");
  const tSos = useTranslations("client.sos");

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<SOSAlertData | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const MAX_CONTACTS = 5;

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/client/emergency-contacts");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setContacts(data.data);
      } else {
        setError(data.message || t("loadError"));
      }
    } catch (err) {
      console.error("Error fetching emergency contacts:", err);
      setError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchActiveAlert = useCallback(async () => {
    try {
      const res = await fetch("/api/sos");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const active = data.data.find((a: SOSAlertData) => a.status === "active" && a.trackingToken);
        setActiveAlert(active || null);
      }
    } catch (err) {
      console.error("Error fetching SOS alerts:", err);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchActiveAlert();
  }, [fetchContacts, fetchActiveAlert]);

  const resetForm = () => {
    setName("");
    setPhone("");
    setRelation("");
    setFormMessage(null);
    setShowForm(false);
  };

  const handleAddContact = async () => {
    if (!name.trim() || !phone.trim() || !relation.trim()) {
      setFormMessage({ type: "error", text: t("allFieldsRequired") });
      return;
    }

    if (contacts.length >= MAX_CONTACTS) {
      setFormMessage({ type: "error", text: t("maxReached") });
      return;
    }

    setSaving(true);
    setFormMessage(null);

    try {
      const res = await fetch("/api/client/emergency-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          relation: relation.trim(),
        }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        setContacts((prev) => [...prev, data.data]);
        setFormMessage({ type: "success", text: t("added") });
        resetForm();
      } else {
        setFormMessage({
          type: "error",
          text: data.message || t("addError"),
        });
      }
    } catch (err) {
      console.error("Error adding emergency contact:", err);
      setFormMessage({ type: "error", text: t("connectionError") });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/client/emergency-contacts?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Error deleting emergency contact:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeactivateAlert = async () => {
    if (!activeAlert) return;
    setConfirmDeactivate(false);
    setDeactivating(true);
    try {
      await fetch(`/api/sos/${activeAlert.id}`, {
        method: "PATCH",
      });
      setActiveAlert(null);
    } catch (err) {
      console.error("Error deactivating SOS alert:", err);
    } finally {
      setDeactivating(false);
    }
  };

  const handleCopyTrackingLink = async () => {
    if (!activeAlert?.trackingToken) return;
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/track/sos/${activeAlert.trackingToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getTrackingUrl = () => {
    if (!activeAlert?.trackingToken) return "";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/track/sos/${activeAlert.trackingToken}`;
  };

  const getWhatsAppUrl = (phoneNumber: string) => {
    const url = getTrackingUrl();
    if (!url) return "#";
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, "");
    const text = encodeURIComponent(`${tSos("whatsappMessage")}\n\n${url}`);
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <p className="text-muted-foreground mb-4 font-medium">{error}</p>
        <Button
          onClick={fetchContacts}
          className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold gap-2"
        >
          <Loader2 className="h-4 w-4" />
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active SOS Alert Banner */}
      {activeAlert && (
        <Card className="border-red-500/30 bg-red-950/30 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldAlert className="h-5 w-5 text-red-400 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-red-400">
                    {tSos("alertActive")}
                  </p>
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {new Date(activeAlert.createdAt).toLocaleString()}
                </p>

                {/* Tracking link info */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border">
                  <ExternalLink className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {getTrackingUrl()}
                  </span>
                </div>

                {/* Send to contacts */}
                {contacts.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      {tSos("sendViaWhatsApp")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {contacts.map((contact) => (
                        <Button
                          key={contact.id}
                          size="sm"
                          asChild
                          className="bg-green-600 hover:bg-green-500 text-white h-7 text-xs gap-1 px-2"
                        >
                          <a
                            href={getWhatsAppUrl(contact.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="h-3 w-3" />
                            {contact.name}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyTrackingLink}
                    className="flex-1 border-border text-muted-foreground hover:bg-muted/50 gap-1.5 h-8"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-green-400">{tSos("copied")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        {tSos("copyLink")}
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 gap-1.5 h-8 font-semibold"
                    onClick={() => setConfirmDeactivate(true)}
                    disabled={deactivating}
                  >
                    {deactivating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                    {tSos("deactivateLink")}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deactivate confirmation overlay */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 mx-4 max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <EyeOff className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">
                  {tSos("deactivateConfirmTitle")}
                </h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {tSos("deactivateConfirmHint")}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-border text-muted-foreground hover:bg-muted/50"
                onClick={() => setConfirmDeactivate(false)}
              >
                {tSos("cancel")}
              </Button>
              <Button
                className="flex-1 bg-orange-500 text-white hover:bg-orange-600 font-semibold gap-2"
                onClick={handleDeactivateAlert}
                disabled={deactivating}
              >
                {deactivating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                {tSos("deactivateLink")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-yellow-400" />
          <h2 className="text-lg font-bold text-white">
            {t("title")}
          </h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {contacts.length}/{MAX_CONTACTS}
        </span>
      </div>

      {/* Contact list */}
      {contacts.length === 0 && !showForm ? (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Phone className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground mb-1 font-medium">
            {t("empty")}
          </p>
          <p className="text-sm text-muted-foreground/60 mb-6">
            {t("emptyHint")}
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("addFirst")}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3">
            {contacts.map((contact) => (
              <Card
                key={contact.id}
                className="border-border bg-card overflow-hidden"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-yellow-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">
                        {contact.name}
                      </p>
                      <p className="text-sm text-yellow-400 font-medium">
                        {contact.relation}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-sm text-muted-foreground hover:text-yellow-400 transition-colors"
                        >
                          {contact.phone}
                        </a>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        asChild
                        className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                      >
                        <a href={`tel:${contact.phone}`}>
                          <PhoneCall className="h-5 w-5" />
                          <span className="sr-only">{t("call")}</span>
                        </a>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setConfirmDeleteId(contact.id)}
                        disabled={deletingId === contact.id}
                        className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                      >
                        {deletingId === contact.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                        <span className="sr-only">{t("delete")}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add contact button / form */}
          {contacts.length < MAX_CONTACTS && (
            <>
              {!showForm ? (
                <Button
                  onClick={() => setShowForm(true)}
                  variant="outline"
                  className="w-full border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300 gap-2 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  {t("addContact")}
                </Button>
              ) : (
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-white text-base">
                      <Plus className="h-4 w-4 text-yellow-400" />
                      {t("addContact")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Name field */}
                    <div className="space-y-1.5">
                      <label className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {t("name")}
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("namePlaceholder")}
                        className="bg-background border-border text-white placeholder:text-muted-foreground/50"
                      />
                    </div>

                    {/* Phone field */}
                    <div className="space-y-1.5">
                      <label className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {t("phone")}
                      </label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+41 xxx xxx xxx"
                        type="tel"
                        className="bg-background border-border text-white placeholder:text-muted-foreground/50"
                      />
                    </div>

                    {/* Relation field */}
                    <div className="space-y-1.5">
                      <label className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {t("relation")}
                      </label>
                      <Input
                        value={relation}
                        onChange={(e) => setRelation(e.target.value)}
                        placeholder={t("relationPlaceholder")}
                        className="bg-background border-border text-white placeholder:text-muted-foreground/50"
                      />
                    </div>

                    {/* Form feedback */}
                    {formMessage && (
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                          formMessage.type === "success"
                            ? "bg-green-400/10 text-green-400 border border-green-400/20"
                            : "bg-red-400/10 text-red-400 border border-red-400/20"
                        }`}
                      >
                        {formMessage.type === "success" ? (
                          <Save className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        )}
                        {formMessage.text}
                      </div>
                    )}

                    {/* Form buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={resetForm}
                        variant="outline"
                        className="flex-1 border-border text-muted-foreground hover:bg-muted/50"
                      >
                        {t("cancel")}
                      </Button>
                      <Button
                        onClick={handleAddContact}
                        disabled={saving}
                        className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500 font-semibold gap-2"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {t("save")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Max contacts reached notice */}
          {contacts.length >= MAX_CONTACTS && (
            <p className="text-center text-sm text-muted-foreground/60">
              {t("maxReached")}
            </p>
          )}
        </>
      )}

      {/* Delete confirmation overlay */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 mx-4 max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">{t("deleteConfirm")}</h3>
                <p className="text-sm text-muted-foreground">
                  {contacts.find(c => c.id === confirmDeleteId)?.name}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {t("deleteHint")}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-border text-muted-foreground hover:bg-muted/50"
                onClick={() => setConfirmDeleteId(null)}
              >
                {t("cancel")}
              </Button>
              <Button
                className="flex-1 bg-red-500 text-white hover:bg-red-600 font-semibold gap-2"
                onClick={() => handleDeleteContact(confirmDeleteId)}
              >
                <Trash2 className="h-4 w-4" />
                {t("delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
