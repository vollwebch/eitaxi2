"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Save,
  Loader2,
  LogOut,
  CheckCircle,
  AlertCircle,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface ClientUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface ProfileTabProps {
  user: ClientUser;
  onUserUpdate: (user: ClientUser) => void;
  onLogout: () => void;
}

export default function ProfileTab({ user, onUserUpdate, onLogout }: ProfileTabProps) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const t = useTranslations("client.profile");

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const body: { name?: string; phone?: string } = {};
      if (name.trim() !== user.name) body.name = name.trim();
      if (phone.trim() !== (user.phone || "")) body.phone = phone.trim();

      if (Object.keys(body).length === 0) {
        setMessage({ type: "error", text: t("noChanges") });
        setSaving(false);
        return;
      }

      const res = await fetch("/api/auth/client/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success && data.data) {
        onUserUpdate(data.data);
        setMessage({ type: "success", text: t("updated") });
      } else {
        setMessage({
          type: "error",
          text: data.message || t("updateError"),
        });
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setMessage({ type: "error", text: t("connectionError") });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-yellow-400/20 to-yellow-400/5" />
        <CardContent className="p-4 pt-0 -mt-8">
          <div className="flex items-end gap-4">
            <div className="w-16 h-16 rounded-2xl bg-yellow-400/20 border-4 border-card flex items-center justify-center flex-shrink-0">
              <User className="h-8 w-8 text-yellow-400" />
            </div>
            <div className="pb-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate">
                {user.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-base">
            <Shield className="h-4 w-4 text-yellow-400" />
            {t("editProfile")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name field */}
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {t("fullName")}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("fullNamePlaceholder")}
              className="bg-background border-border text-white placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {t('email')}
            </label>
            <Input
              value={user.email}
              disabled
              className="bg-background/50 border-border text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground/60">
              {t('emailHint')}
            </p>
          </div>

          {/* Phone field */}
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {t('phone')}
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+41 xxx xxx xxx"
              className="bg-background border-border text-white placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Feedback message */}
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
            {t('saveChanges')}
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-400/30 text-red-400 hover:bg-red-400/10 hover:text-red-300 gap-2"
          >
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
