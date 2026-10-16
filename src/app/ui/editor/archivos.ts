// Lógica pura del editor de código (sin DOM), para poder probarla.

export interface ArchivoEditor {
  nombre: string;
  contenido: string;
}

export const MAX_ARCHIVOS = 10;
export const SANGRIA = '  ';

// Nombre para un archivo nuevo que no choque con los existentes: archivo.js, archivo-2.js…
export function nombreLibre(existentes: string[], base = 'archivo', extension = '.js'): string {
  if (!existentes.includes(base + extension)) return base + extension;
  let n = 2;
  while (existentes.includes(`${base}-${n}${extension}`)) n++;
  return `${base}-${n}${extension}`;
}

// Tab dentro del editor inserta espacios (reemplazando la selección) en vez de mover el foco.
export function insertarSangria(
  texto: string,
  inicio: number,
  fin: number,
): { texto: string; cursor: number } {
  return {
    texto: texto.slice(0, inicio) + SANGRIA + texto.slice(fin),
    cursor: inicio + SANGRIA.length,
  };
}

export function contarLineas(texto: string): number {
  return texto.split('\n').length;
}
