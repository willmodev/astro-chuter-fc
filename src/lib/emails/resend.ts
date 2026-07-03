import { Resend } from 'resend';

const apiKey = import.meta.env.RESEND_API_KEY;

// Cliente único de Resend. Server-only: RESEND_API_KEY nunca lleva prefijo PUBLIC_.
const resend = apiKey ? new Resend(apiKey) : null;

export interface CorreoParams {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function enviarCorreo({
  to,
  from,
  subject,
  html,
  replyTo,
}: CorreoParams): Promise<void> {
  if (!resend) {
    throw new Error('RESEND_API_KEY no está configurada en el entorno.');
  }

  const { error } = await resend.emails.send({
    to,
    from,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    throw new Error(`Resend rechazó el envío: ${error.message}`);
  }
}
