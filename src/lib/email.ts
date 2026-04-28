import { Resend } from 'resend';

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

interface SendResetEmailParams {
  to: string;
  name: string;
  resetUrl: string;
}

export async function sendResetPasswordEmail({ to, name, resetUrl }: SendResetEmailParams): Promise<boolean> {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log('📧 [DEV MODE] Reset email would be sent to:', to);
      console.log('📧 [DEV MODE] Name:', name);
      console.log('📧 [DEV MODE] Reset URL:', resetUrl);
      return true;
    }

    const { error } = await resend.emails.send({
      from: 'eitaxi <noreply@eitaxi.ch>',
      to: [to],
      subject: 'eitaxi - Restablecer tu contraseña',
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;color:#e5e5e5;"><div style="max-width:480px;margin:0 auto;padding:32px 16px;"><div style="text-align:center;margin-bottom:32px;"><h1 style="font-size:32px;color:#facc15;margin:0;">🚕 eitaxi</h1></div><div style="background-color:#1a1a1a;border:1px solid #333;border-radius:12px;padding:32px;"><h2 style="color:#fff;margin:0 0 16px;">Hola ${name}</h2><p style="color:#a3a3a3;line-height:1.6;margin:0 0 24px;">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva:</p><div style="text-align:center;margin:24px 0;"><a href="${resetUrl}" style="background-color:#facc15;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block;">Restablecer contraseña</a></div><p style="color:#737373;font-size:13px;line-height:1.5;margin:0;">Si no solicitaste este cambio, puedes ignorar este email. El enlace expira en 1 hora.</p></div><div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #333;"><p style="color:#525252;font-size:12px;margin:0;">eitaxi - Tu taxi en Suiza</p></div></div></body></html>`
    });

    if (error) {
      console.error('Error sending reset email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception sending reset email:', error);
    return false;
  }
}

export async function sendDailyReportEmail(email: string, name: string, stats: any): Promise<boolean> {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log('📧 [DEV MODE] Daily report would be sent to:', email);
      return true;
    }

    const { error } = await resend.emails.send({
      from: 'eitaxi <noreply@eitaxi.ch>',
      to: [email],
      subject: `eitaxi - Reporte diario - ${new Date().toLocaleDateString('es-ES')}`,
      html: `<h2>Reporte diario para ${name}</h2><p>Reservas: ${stats.totalBookings || 0}</p>`
    });

    if (error) {
      console.error('Error sending daily report:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Exception sending daily report:', error);
    return false;
  }
}

export async function sendAdminDailyReportEmail(adminEmail: string, allStats: any): Promise<boolean> {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log('📧 [DEV MODE] Admin daily report would be sent to:', adminEmail);
      return true;
    }

    const { error } = await resend.emails.send({
      from: 'eitaxi <noreply@eitaxi.ch>',
      to: [adminEmail],
      subject: `eitaxi - Reporte admin diario - ${new Date().toLocaleDateString('es-ES')}`,
      html: `<h2>Reporte administrativo diario</h2><p>Total reservas: ${allStats.totalBookings || 0}</p>`
    });

    if (error) {
      console.error('Error sending admin daily report:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Exception sending admin daily report:', error);
    return false;
  }
}
