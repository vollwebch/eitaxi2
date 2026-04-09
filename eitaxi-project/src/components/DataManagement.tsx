"use client";

import { useState } from "react";
import {
  Shield,
  Eye,
  FileText,
  UserX,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Database,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DataManagementProps {
  driverId: string;
  driverName: string;
  driverEmail: string;
}

export default function DataManagement({ driverId, driverName, driverEmail }: DataManagementProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Export user data
  const handleExportData = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const response = await fetch(`/api/driver/data-export?driverId=${driverId}`);
      const data = await response.json();

      if (data.success) {
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `eitaxi-datos-${driverId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExportSuccess(true);
      } else {
        alert("Error al exportar datos: " + data.error);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsExporting(false);
    }
  };

  // Delete account and all data
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "ELIMINAR") {
      alert("Debes escribir ELIMINAR para confirmar");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/driver/delete?driverId=${driverId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        // Clear local storage
        localStorage.removeItem("eitaxi_session");
        localStorage.removeItem("gps-tracking-consent");
        localStorage.removeItem("widget-driverId");
        
        alert("Tu cuenta y todos tus datos han sido eliminados correctamente.");
        window.location.href = "/";
      } else {
        alert("Error al eliminar cuenta: " + data.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-yellow-400" />
          Datos y Privacidad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Banner */}
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <p className="text-sm text-blue-400">
            Tienes control total sobre tus datos personales. Puedes acceder, descargar 
            o eliminar tu información en cualquier momento, conforme a la nDSG (Ley Federal 
            de Protección de Datos de Suiza).
          </p>
        </div>

        {/* Data Summary */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Datos almacenados
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-yellow-400" />
                <span className="font-medium">Datos de cuenta</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Nombre, email, teléfono, dirección
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-green-400" />
                <span className="font-medium">Ubicaciones</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Última ubicación conocida, zonas de servicio
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-orange-400" />
                <span className="font-medium">Actividad</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Horarios, valoraciones, historial
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-purple-400" />
                <span className="font-medium">Consentimientos</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                GPS, notificaciones, términos
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Rights */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Tus derechos (nDSG)
          </Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Right: Access */}
            <div className="p-4 rounded-lg border border-border hover:border-yellow-400/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-yellow-400" />
                  <span className="font-medium">Acceso</span>
                </div>
                <Badge variant="outline" className="text-xs">Art. 25 nDSG</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Descarga una copia de todos tus datos personales.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar mis datos
                  </>
                )}
              </Button>
              {exportSuccess && (
                <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Datos exportados correctamente
                </p>
              )}
            </div>

            {/* Right: Rectification */}
            <div className="p-4 rounded-lg border border-border hover:border-yellow-400/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <span className="font-medium">Rectificación</span>
                </div>
                <Badge variant="outline" className="text-xs">Art. 26 nDSG</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Modifica tus datos personales desde el perfil.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <FileText className="mr-2 h-4 w-4" />
                Ir a mi perfil
              </Button>
            </div>

            {/* Right: Deletion */}
            <div className="p-4 rounded-lg border border-red-500/30 hover:border-red-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-red-400" />
                  <span className="font-medium">Supresión</span>
                </div>
                <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">Art. 27 nDSG</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Elimina tu cuenta y todos tus datos permanentemente.
              </p>
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar mi cuenta
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="h-5 w-5" />
                      Eliminar cuenta permanentemente
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Esta acción es <strong>irreversible</strong>. Se eliminarán:
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Tu perfil público y todos los datos</li>
                      <li>• Tu historial de ubicaciones</li>
                      <li>• Tus valoraciones y reviews</li>
                      <li>• Cualquier configuración guardada</li>
                    </ul>
                    
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-xs text-red-400">
                        <strong>Atención:</strong> Tu URL pública dejará de funcionar y no 
                        podrás recuperar tu cuenta después de eliminarla.
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="confirm-delete" className="text-sm">
                        Escribe <strong>ELIMINAR</strong> para confirmar:
                      </Label>
                      <input
                        id="confirm-delete"
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="mt-2 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                        placeholder="ELIMINAR"
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteDialogOpen(false);
                        setDeleteConfirmText("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || deleteConfirmText !== "ELIMINAR"}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar permanentemente
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Right: Portability */}
            <div className="p-4 rounded-lg border border-border hover:border-yellow-400/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-purple-400" />
                  <span className="font-medium">Portabilidad</span>
                </div>
                <Badge variant="outline" className="text-xs">Art. 28 nDSG</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Recibe tus datos en formato estructurado (JSON).
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleExportData}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar datos (JSON)
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact */}
        <div className="p-4 rounded-lg bg-muted/30">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-yellow-400" />
            ¿Necesitas ayuda?
          </h4>
          <p className="text-sm text-muted-foreground">
            Para ejercer otros derechos o resolver dudas sobre tus datos, contacta con 
            nuestro Delegado de Protección de Datos:
          </p>
          <a
            href="mailto:privacidad@eitaxi.ch"
            className="inline-flex items-center gap-2 text-yellow-400 hover:underline mt-2 text-sm"
          >
            privacidad@eitaxi.ch
          </a>
        </div>

        {/* Consent status */}
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <h4 className="font-medium mb-2 text-green-400 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Consentimientos activos
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Términos de Servicio</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aceptado</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Política de Privacidad</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aceptado</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Seguimiento GPS</span>
              <Badge variant="outline">
                {typeof window !== 'undefined' && localStorage.getItem('gps-tracking-consent') === 'true'
                  ? 'Aceptado'
                  : 'Pendiente'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
