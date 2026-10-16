// Recorta un texto para que quepa en el dibujo (el SVG no ajusta líneas solo).
export function acortar(texto: string, max: number): string {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}
