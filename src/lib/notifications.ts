import { db } from './db';

export async function createNotification(data: {
  clientId: string;
  title: string;
  body: string;
  type: string; // 'booking_created', 'booking_confirmed', 'booking_completed', 'booking_cancelled', 'message', 'system'
  link?: string;
  metadata?: Record<string, unknown>;
}) {
  return db.notification.create({
    data: {
      clientId: data.clientId,
      title: data.title,
      body: data.body,
      type: data.type,
      link: data.link || null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    },
  });
}

export async function getNotifications(clientId: string, limit = 50) {
  return db.notification.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getUnreadCount(clientId: string) {
  return db.notification.count({
    where: { clientId, isRead: false },
  });
}

export async function markAsRead(notificationId: string, clientId: string) {
  return db.notification.updateMany({
    where: { id: notificationId, clientId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(clientId: string) {
  return db.notification.updateMany({
    where: { clientId, isRead: false },
    data: { isRead: true },
  });
}

export async function createBookingNotification(clientId: string, bookingStatus: string, bookingId: string) {
  const statusMessages: Record<string, { title: string; body: string }> = {
    created: { title: 'Nueva reserva', body: 'Tu reserva ha sido creada correctamente' },
    confirmed: { title: 'Reserva confirmada', body: 'El conductor ha confirmado tu reserva' },
    completed: { title: 'Viaje completado', body: 'Tu viaje ha sido completado. ¡Gracias por viajar con eitaxi!' },
    cancelled: { title: 'Reserva cancelada', body: 'Tu reserva ha sido cancelada' },
  };

  const msg = statusMessages[bookingStatus] || statusMessages.created;

  return createNotification({
    clientId,
    title: msg.title,
    body: msg.body,
    type: `booking_${bookingStatus}`,
    link: `/cuenta?tab=reservas`,
    metadata: { bookingId },
  });
}
