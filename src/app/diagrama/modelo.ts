// Modelo y geometría del diagrama. Funciones puras: no tocan el DOM, así se pueden calcular las
// rutas de las aristas y el recorrido del paquete sin medir nada en pantalla.

// Formas de la notación C4: el tipo de elemento se lee por la forma, no por el color.
export type FormaNodo = 'persona' | 'componente' | 'contenedor' | 'base-datos' | 'externo';
export type EstadoNodo = 'normal' | 'trabajando' | 'ok' | 'error' | 'caido';
// lapiz: dependencia pendiente · tinta: confirmada · error: cortada.
export type EstadoArista = 'lapiz' | 'tinta' | 'error';
export type EstadoFila = 'vacia' | 'llena' | 'ok' | 'error';

export interface FilaNodo {
  id: string;
  texto: string;
  estado?: EstadoFila;
}

export interface NodoDiagrama {
  id: string;
  titulo: string;
  tipo: string; // se dibuja entre corchetes, como en C4: [Componente: Angular]
  forma: FormaNodo;
  x: number;
  y: number;
  ancho: number;
  detalle?: string; // una línea de código bajo el título (por ejemplo, el endpoint)
  filas?: FilaNodo[]; // compartimentos, como los atributos de una clase UML
  estado?: EstadoNodo;
  marca?: string; // insignia en la esquina: "401", "sin respuesta"…
}

export interface AristaDiagrama {
  id: string;
  de: string;
  a: string;
  deFila?: string; // sale del lado derecho de una fila del nodo de origen
  estado: EstadoArista;
  etiqueta?: string;
}

export interface Punto {
  x: number;
  y: number;
}

export const ALTO_CABECERA = 44;
export const ALTO_DETALLE = 18;
export const ALTO_FILA = 20;
const CABEZA_PERSONA = 16;

export function altoNodo(nodo: NodoDiagrama): number {
  if (nodo.forma === 'persona') return CABEZA_PERSONA + 40;
  const filas = nodo.filas?.length ?? 0;
  return ALTO_CABECERA + (nodo.detalle ? ALTO_DETALLE : 0) + (filas ? filas * ALTO_FILA + 8 : 0) + 4;
}

// Dónde empiezan las filas dentro del nodo.
export function inicioFilas(nodo: NodoDiagrama): number {
  return ALTO_CABECERA + (nodo.detalle ? ALTO_DETALLE : 0);
}

// Primera línea de texto: la persona lleva la cabeza encima del cuerpo.
export function margenSuperior(nodo: NodoDiagrama): number {
  return nodo.forma === 'persona' ? CABEZA_PERSONA : 0;
}

// Contorno de cada forma como un solo path, para poder "dibujarlo" con stroke-dashoffset.
export function contorno(nodo: NodoDiagrama): string {
  const w = nodo.ancho;
  const h = altoNodo(nodo);
  if (nodo.forma === 'base-datos') {
    const e = 7;
    return `M0 ${e} A${w / 2} ${e} 0 0 1 ${w} ${e} V${h - e} A${w / 2} ${e} 0 0 1 0 ${h - e} Z`;
  }
  if (nodo.forma === 'persona') return rectangulo(0, CABEZA_PERSONA, w, h - CABEZA_PERSONA, 14);
  return rectangulo(0, 0, w, h, 3);
}

// Trazos extra de cada forma: la tapa del cilindro y las dos pestañas del componente UML.
export function adornos(nodo: NodoDiagrama): string | null {
  const w = nodo.ancho;
  if (nodo.forma === 'base-datos') return `M0 7 A${w / 2} 7 0 0 0 ${w} 7`;
  if (nodo.forma === 'componente') return 'M-6 12h12v7h-12Z M-6 25h12v7h-12Z';
  return null;
}

function rectangulo(x: number, y: number, w: number, h: number, r: number): string {
  return (
    `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}` +
    `Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}` +
    `V${y + r}Q${x} ${y} ${x + r} ${y}Z`
  );
}

// Ruta ortogonal de una arista. Sale por abajo y entra por arriba si el destino está debajo;
// si están lado a lado, va de un costado al otro. Las aristas que salen de una fila usan un
// carril propio a la derecha del nodo para no encimarse.
export function rutaArista(
  arista: AristaDiagrama,
  nodos: Map<string, NodoDiagrama>,
  carril = 0,
  totalCarriles = 1,
): Punto[] {
  const origen = nodos.get(arista.de);
  const destino = nodos.get(arista.a);
  if (!origen || !destino) return [];
  const altoOrigen = altoNodo(origen);
  const altoDestino = altoNodo(destino);

  if (arista.deFila && origen.filas) {
    const indice = origen.filas.findIndex((fila) => fila.id === arista.deFila);
    const y = origen.y + inicioFilas(origen) + 4 + indice * ALTO_FILA + ALTO_FILA / 2;
    const xSalida = origen.x + origen.ancho;
    const xCarril = xSalida + 18 + carril * 12;
    const desplazamiento = (carril - (totalCarriles - 1) / 2) * 16;
    const xEntrada = destino.x + destino.ancho / 2 + desplazamiento;
    const yQuiebre = destino.y - 12 - carril * 7;
    return [
      { x: xSalida, y },
      { x: xCarril, y },
      { x: xCarril, y: yQuiebre },
      { x: xEntrada, y: yQuiebre },
      { x: xEntrada, y: destino.y },
    ];
  }

  if (destino.y >= origen.y + altoOrigen - 1) {
    const x1 = origen.x + origen.ancho / 2;
    const y1 = origen.y + altoOrigen;
    const x2 = destino.x + destino.ancho / 2;
    const y2 = destino.y;
    if (Math.abs(x1 - x2) < 1) return [{ x: x1, y: y1 }, { x: x1, y: y2 }];
    const medio = (y1 + y2) / 2;
    return [
      { x: x1, y: y1 },
      { x: x1, y: medio },
      { x: x2, y: medio },
      { x: x2, y: y2 },
    ];
  }

  const haciaDerecha = destino.x > origen.x;
  const x1 = haciaDerecha ? origen.x + origen.ancho : origen.x;
  const x2 = haciaDerecha ? destino.x : destino.x + destino.ancho;
  const y1 = origen.y + altoOrigen / 2;
  const y2 = destino.y + altoDestino / 2;
  if (Math.abs(y1 - y2) < 1) return [{ x: x1, y: y1 }, { x: x2, y: y1 }];
  const medio = (x1 + x2) / 2;
  return [
    { x: x1, y: y1 },
    { x: medio, y: y1 },
    { x: medio, y: y2 },
    { x: x2, y: y2 },
  ];
}

export function pathDe(puntos: Punto[]): string {
  return puntos.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join('');
}

export function longitud(puntos: Punto[]): number {
  let total = 0;
  for (let i = 1; i < puntos.length; i++) {
    total += Math.abs(puntos[i].x - puntos[i - 1].x) + Math.abs(puntos[i].y - puntos[i - 1].y);
  }
  return total;
}

// Punto a una fracción (0–1) del recorrido. Sirve para la etiqueta y el corte de la arista.
export function puntoEn(puntos: Punto[], fraccion: number): Punto {
  const objetivo = longitud(puntos) * fraccion;
  let recorrido = 0;
  for (let i = 1; i < puntos.length; i++) {
    const a = puntos[i - 1];
    const b = puntos[i];
    const tramo = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    if (recorrido + tramo >= objetivo && tramo > 0) {
      const t = (objetivo - recorrido) / tramo;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    recorrido += tramo;
  }
  return puntos[puntos.length - 1] ?? { x: 0, y: 0 };
}

// Punta de flecha al final de la ruta, orientada según el último tramo.
export function punta(puntos: Punto[]): string {
  if (puntos.length < 2) return '';
  const fin = puntos[puntos.length - 1];
  const antes = puntos[puntos.length - 2];
  const dx = Math.sign(fin.x - antes.x);
  const dy = Math.sign(fin.y - antes.y);
  const largo = 7;
  const ancho = 4;
  const bx = fin.x - dx * largo;
  const by = fin.y - dy * largo;
  return `M${bx - dy * ancho} ${by - dx * ancho}L${fin.x} ${fin.y}L${bx + dy * ancho} ${by + dx * ancho}`;
}

// Caja que contiene todo el diagrama, con margen para los carriles y las etiquetas.
export function marco(nodos: NodoDiagrama[]): { x: number; y: number; ancho: number; alto: number } {
  if (!nodos.length) return { x: 0, y: 0, ancho: 100, alto: 100 };
  const minX = Math.min(...nodos.map((n) => n.x)) - 14;
  const minY = Math.min(...nodos.map((n) => n.y)) - 8;
  const maxX = Math.max(...nodos.map((n) => n.x + n.ancho)) + 48;
  const maxY = Math.max(...nodos.map((n) => n.y + altoNodo(n))) + 10;
  return { x: minX, y: minY, ancho: maxX - minX, alto: maxY - minY };
}
