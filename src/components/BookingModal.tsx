"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, MapPin, Users, MessageSquare } from 'lucide-react';

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverId: string;
  driverName: string;
  clientSession: { clientId: string; email: string; name: string } | null;
}

export default function BookingModal({
  open,
  onOpenChange,
  driverId,
  driverName,
  clientSession,
}: BookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    pickupAddress: '',
    destAddress: '',
    scheduledFor: '',
    passengerCount: 1,
    notes: '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          pickupAddress: form.pickupAddress,
          destAddress: form.destAddress || undefined,
          scheduledFor: form.scheduledFor || undefined,
          passengerCount: form.passengerCount,
          notes: form.notes || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onOpenChange(false);
          setForm({
            pickupAddress: '',
            destAddress: '',
            scheduledFor: '',
            passengerCount: 1,
            notes: '',
          });
        }, 2000);
      } else {
        setError(data.error || 'Error al crear la reserva');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-yellow-400">
            Reservar con {driverName}
          </DialogTitle>
          <DialogDescription>
            Completa los datos de tu reserva
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-lg font-medium text-green-400">
              ¡Reserva creada!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {driverName} recibirá tu solicitud
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-400" /> Punto de
                recogida *
              </label>
              <Input
                required
                placeholder="Dirección de recogida"
                value={form.pickupAddress}
                onChange={(e) =>
                  setForm({ ...form, pickupAddress: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-400" /> Destino
              </label>
              <Input
                placeholder="Dirección de destino (opcional)"
                value={form.destAddress}
                onChange={(e) =>
                  setForm({ ...form, destAddress: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-blue-400" /> Fecha/Hora
                </label>
                <Input
                  type="datetime-local"
                  value={form.scheduledFor}
                  onChange={(e) =>
                    setForm({ ...form, scheduledFor: e.target.value })
                  }
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-400" /> Pasajeros
                </label>
                <select
                  value={form.passengerCount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      passengerCount: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'pasajero' : 'pasajeros'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-yellow-400" /> Notas
              </label>
              <Textarea
                placeholder="Instrucciones especiales para el conductor..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="bg-background border-border"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button
              type="submit"
              disabled={loading || !form.pickupAddress}
              className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
            >
              {loading ? 'Creando reserva...' : 'Confirmar Reserva'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
