// Email service stub - requires Resend or similar email provider
// Currently returns success without sending

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean }> {
  // Stub: In production, use Resend or similar
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ from: 'eitaxi <noreply@eitaxi.ch>', ...options });
  console.log(
    `[Email Stub] Would send email to ${options.to}: ${options.subject}`
  );
  return { success: true };
}

export async function sendWelcomeEmail(name: string, email: string) {
  return sendEmail({
    to: email,
    subject: '¡Bienvenido a eitaxi!',
    html: `<h1>¡Hola ${name}!</h1><p>Bienvenido a eitaxi, tu plataforma de taxis en Suiza.</p>`,
  });
}

export async function sendBookingConfirmation(
  name: string,
  email: string,
  bookingId: string
) {
  return sendEmail({
    to: email,
    subject: 'Confirmación de reserva - eitaxi',
    html: `<h1>Reserva confirmada</h1><p>Tu reserva ${bookingId} ha sido confirmada.</p>`,
  });
}

export async function sendPasswordReset(
  name: string,
  email: string,
  token: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/restablecer-password/${token}`;
  return sendEmail({
    to: email,
    subject: 'Restablecer contraseña - eitaxi',
    html: `<h1>Restablecer contraseña</h1><p>Hola ${name}, haz clic <a href="${resetUrl}">aquí</a> para restablecer tu contraseña.</p>`,
  });
}

// Daily report emails
export async function sendDailyReportEmail(
  driverEmail: string,
  driverName: string,
  stats: { total: number; confirmed: number; pending: number; cancelled: number; completed: number }
) {
  return sendEmail({
    to: driverEmail,
    subject: `Reporte diario de reservas - eitaxi`,
    html: `<h1>Reporte diario</h1><p>Hola ${driverName}, tus reservas de ayer: ${stats.total} total, ${stats.confirmed} confirmadas, ${stats.pending} pendientes, ${stats.completed} completadas, ${stats.cancelled} canceladas.</p>`,
  });
}

export async function sendAdminDailyReportEmail(
  adminEmail: string,
  stats: Array<{ driverName: string; total: number; confirmed: number; pending: number; cancelled: number; completed: number }>
) {
  const totalBookings = stats.reduce((sum, s) => sum + s.total, 0);
  return sendEmail({
    to: adminEmail,
    subject: `Reporte global diario - eitaxi`,
    html: `<h1>Reporte global</h1><p>${stats.length} conductores, ${totalBookings} reservas totales.</p>`,
  });
}
