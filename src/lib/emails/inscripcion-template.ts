export interface CorreoInscripcion {
  nombreAcudiente: string;
  telefono: string;
  nombreNino: string;
  anioNacimiento: number;
  categoriaSugerida: string | null;
  emailAcudiente?: string;
  mensaje?: string;
}

export interface CorreoRenderizado {
  subject: string;
  html: string;
}

const COLOR = {
  navy: '#1B3A6B',
  navyDeep: '#0F2647',
  gold: '#F5C842',
  cream: '#FBF6E4',
  text: '#1f2937',
  muted: '#6b7280',
} as const;

// Escapa texto del usuario para evitar HTML roto o inyección en el correo.
function escapar(valor: string): string {
  return valor
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function fila(label: string, valor: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f3;color:${COLOR.muted};font-size:13px;width:38%;vertical-align:top;">${escapar(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f3;color:${COLOR.text};font-size:15px;font-weight:600;">${escapar(valor)}</td>
    </tr>`;
}

function bloqueCategoria(categoria: string | null): string {
  const texto = categoria ?? 'Fuera de las categorías actuales — revisar manualmente';
  const fondo = categoria ? COLOR.cream : '#fdf1ec';
  const borde = categoria ? COLOR.gold : '#e6b8aa';
  return `
    <div style="margin:20px 0 4px;padding:14px 16px;background:${fondo};border-left:4px solid ${borde};border-radius:6px;">
      <p style="margin:0;color:${COLOR.muted};font-size:12px;text-transform:uppercase;letter-spacing:1px;">Categoría sugerida</p>
      <p style="margin:4px 0 0;color:${COLOR.navyDeep};font-size:17px;font-weight:700;">${escapar(texto)}</p>
    </div>`;
}

function bloqueMensaje(mensaje?: string): string {
  if (!mensaje) return '';
  return `
    <div style="margin-top:20px;">
      <p style="margin:0 0 6px;color:${COLOR.muted};font-size:13px;">Mensaje del acudiente</p>
      <p style="margin:0;padding:12px 14px;background:#f8fafc;border-radius:6px;color:${COLOR.text};font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapar(mensaje)}</p>
    </div>`;
}

export function renderInscripcion(datos: CorreoInscripcion): CorreoRenderizado {
  const categoriaSubject = datos.categoriaSugerida ?? 'categoría por confirmar';
  const subject = `Nueva inscripción: ${datos.nombreNino} — ${categoriaSubject}`;

  const html = `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px 12px;background:#f1f3f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(15,38,71,0.08);">
    <tr>
      <td style="background:${COLOR.navy};padding:26px 28px;">
        <p style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.5px;">CHUTER<span style="color:${COLOR.gold};">FC</span></p>
        <p style="margin:6px 0 0;color:#c9d6ea;font-size:13px;">Nueva consulta de inscripción</p>
      </td>
    </tr>
    <tr>
      <td style="padding:26px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          ${fila('Acudiente', datos.nombreAcudiente)}
          ${fila('Teléfono / WhatsApp', datos.telefono)}
          ${fila('Niño / niña', datos.nombreNino)}
          ${fila('Año de nacimiento', String(datos.anioNacimiento))}
          ${datos.emailAcudiente ? fila('Email del acudiente', datos.emailAcudiente) : ''}
        </table>
        ${bloqueCategoria(datos.categoriaSugerida)}
        ${bloqueMensaje(datos.mensaje)}
      </td>
    </tr>
    <tr>
      <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #eef0f3;">
        <p style="margin:0;color:${COLOR.muted};font-size:12px;">Este correo lo generó automáticamente el formulario de chuterfc.com</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
