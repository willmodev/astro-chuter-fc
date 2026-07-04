// Formateo de dinero en pesos colombianos (es-CO).
// `fmt` → "$45.000" · `fmtShort` → "$4.82M" / "$540k".

export function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CO');
}

export function fmtShort(n: number): string {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'k';
  return '$' + n;
}
