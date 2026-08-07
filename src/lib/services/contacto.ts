import { parseFechaNacimiento } from '@/lib/domain/alumnos';
import { categoriaDeFecha } from '@/lib/domain/categoria';
import { enviarCorreo } from '@/lib/emails/resend';
import {
  renderInscripcion,
  type CorreoInscripcion,
} from '@/lib/emails/inscripcion-template';

export interface DatosContacto {
  nombreAcudiente: string;
  telefono: string;
  nombreNino: string;
  fechaNacimiento: string; // 'YYYY-MM-DD'
  emailAcudiente?: string;
  mensaje?: string;
}

const FROM =
  import.meta.env.CONTACT_EMAIL_FROM ??
  'Chuter FC <inscripciones@chuterfc.com>';
const TO = import.meta.env.CONTACT_EMAIL_TO ?? 'olimak8@hotmail.com';

// Orquesta el envío: calcula la categoría, arma el modelo del correo,
// genera la plantilla y delega el transporte en Resend.
export async function procesarInscripcion(datos: DatosContacto): Promise<void> {
  const fecha = parseFechaNacimiento(datos.fechaNacimiento);
  const categoria = fecha ? categoriaDeFecha(fecha, new Date()) : null;

  const correo: CorreoInscripcion = {
    nombreAcudiente: datos.nombreAcudiente,
    telefono: datos.telefono,
    nombreNino: datos.nombreNino,
    fechaNacimiento: datos.fechaNacimiento,
    categoriaSugerida: categoria
      ? `${categoria.nombre} (${categoria.etiqueta})`
      : null,
    emailAcudiente: datos.emailAcudiente || undefined,
    mensaje: datos.mensaje || undefined,
  };

  const { subject, html } = renderInscripcion(correo);

  await enviarCorreo({
    to: TO,
    from: FROM,
    subject,
    html,
    replyTo: datos.emailAcudiente || undefined,
  });
}
