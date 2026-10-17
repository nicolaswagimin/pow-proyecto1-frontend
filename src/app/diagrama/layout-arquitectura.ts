import {
  Diagram,
  DiagramType,
  Edge,
  Method,
  Node,
  NodeCategory,
} from '../gen/codetodiagram/v1/diagram_pb';
import { DiffVista } from './diff';
import { AristaDiagrama, FilaNodo, FormaNodo, NodoDiagrama, altoNodo, marco } from './modelo';
import { MarcasCambio, VistaDiff, conFantasmas, diagramaDeVista } from './vistas';
import { acortar } from './texto';

export type { MarcasCambio, VistaDiff } from './vistas';

// Layout determinista por capas: el mismo diagrama siempre se dibuja igual, sin importar el orden
// en que la IA devolvió nodos y conexiones. Funciones puras, sin DOM.

// El ancho de cada nodo crece con su texto, entre ANCHO_NODO y ANCHO_MAXIMO. Lo que no quepa se
// recorta con "…" y se ve completo en el tooltip y en el panel de detalle.
export const ANCHO_NODO = 200;
export const ANCHO_MAXIMO = 320;
export const SEPARACION_X = 48;
export const SEPARACION_Y = 72;
const LETRA_TITULO = 7.6; // ancho aproximado de una letra del título (B612, 13 px)
const LETRA_CODIGO = 6.4; // ídem para tipo, detalle y filas (B612 Mono, 10,5 px)
const MARGEN_TEXTO = 24;
const MAX_TIPO = 28;
const MARCA_INVENTADO = 'no está en el código';
// Conexiones de herencia: en clases, la madre se dibuja arriba (como en UML).
const HERENCIA = /hereda|extiende|implementa/i;
// Si un nodo tiene varias salidas, sus etiquetas nacen del mismo tramo y se pisarían: más cortas.
const MAX_ETIQUETA_COMPARTIDA = 12;

const FORMAS: Record<NodeCategory, FormaNodo> = {
  [NodeCategory.UNSPECIFIED]: 'componente',
  [NodeCategory.PERSON]: 'persona',
  [NodeCategory.COMPONENT]: 'componente',
  [NodeCategory.CONTAINER]: 'contenedor',
  [NodeCategory.DATABASE]: 'base-datos',
  [NodeCategory.EXTERNAL]: 'externo',
};

const ETIQUETAS: Record<NodeCategory, string> = {
  [NodeCategory.UNSPECIFIED]: 'Elemento',
  [NodeCategory.PERSON]: 'Persona',
  [NodeCategory.COMPONENT]: 'Componente',
  [NodeCategory.CONTAINER]: 'Contenedor',
  [NodeCategory.DATABASE]: 'Base de datos',
  [NodeCategory.EXTERNAL]: 'Sistema externo',
};

export interface LayoutDiagrama {
  nodos: NodoDiagrama[];
  aristas: AristaDiagrama[];
}

export function layoutArquitectura(d: Diagram, marcas: MarcasCambio = {}): LayoutDiagrama {
  const nodos = [...d.nodes].sort(porId);
  const aristas = [...d.edges].sort(porId);
  const base = new Map(nodos.map((nodo) => [nodo.id, aNodo(nodo)]));
  // Solo para calcular las capas, la herencia se invierte: la clase madre queda arriba.
  const paraCapas =
    d.type === DiagramType.CLASS
      ? aristas.map((a) => (HERENCIA.test(a.label) ? { ...a, from: a.to, to: a.from } : a))
      : aristas;
  const capas = asignarCapas(nodos, paraCapas);
  const posicion = ubicar(nodos, paraCapas, capas, base);
  const salidas = new Map<string, number>();
  for (const arista of aristas) salidas.set(arista.from, (salidas.get(arista.from) ?? 0) + 1);

  return {
    nodos: nodos.map((nodo) => ({
      ...base.get(nodo.id)!,
      ...posicion.get(nodo.id)!,
      cambio: marcas.nodos?.get(nodo.id),
    })),
    aristas: aristas.map((arista) => ({
      ...aArista(arista, (salidas.get(arista.from) ?? 0) > 1),
      cambio: marcas.aristas?.get(arista.id),
    })),
  };
}

// Layout de una vista del diff (ver vistas.ts).
export function vistaDiff(
  vista: VistaDiff,
  antes: Diagram,
  despues: Diagram,
  diff: DiffVista,
): LayoutDiagrama {
  const { diagrama, marcas } = diagramaDeVista(vista, antes, despues, diff);
  const { nodos, aristas } = layoutArquitectura(diagrama, marcas);
  return { nodos: conFantasmas(vista, nodos), aristas: conFantasmas(vista, aristas) };
}

function aNodo(nodo: Node): Omit<NodoDiagrama, 'x' | 'y'> {
  const etiqueta = ETIQUETAS[nodo.category];
  const tipo = nodo.technology ? `${etiqueta}: ${nodo.technology}` : etiqueta;
  const filas = filasDeClase(nodo);
  const ancho = anchoPara(nodo.name, [
    tipo,
    nodo.file,
    ...filas.map((f) => `${f.glifo} ${f.texto}`),
  ]);
  const maxCodigo = Math.floor((ancho - MARGEN_TEXTO) / LETRA_CODIGO);
  return {
    id: nodo.id,
    titulo: acortar(nodo.name, Math.floor((ancho - MARGEN_TEXTO) / LETRA_TITULO)),
    tituloCompleto: nodo.name,
    tipo: acortar(tipo, maxCodigo),
    forma: FORMAS[nodo.category],
    ancho,
    detalle: nodo.file ? acortar(nodo.file, maxCodigo) : undefined,
    filas: filas.length
      ? filas.map((f) => ({ ...f, texto: acortar(f.texto, maxCodigo - 2) }))
      : undefined,
    estado: 'normal',
    marca: nodo.notInCode ? MARCA_INVENTADO : undefined,
  };
}

// Ancho justo para el texto más largo del nodo, entre el mínimo y el máximo.
function anchoPara(titulo: string, otros: string[]): number {
  const necesario = Math.max(
    titulo.length * LETRA_TITULO,
    ...otros.map((texto) => texto.length * LETRA_CODIGO),
  );
  return Math.min(ANCHO_MAXIMO, Math.max(ANCHO_NODO, Math.ceil(necesario + MARGEN_TEXTO)));
}

// Compartimentos UML: atributos ("nombre: tipo") y métodos ("metodo(param: tipo): retorno"),
// con la visibilidad como glifo: − si el nombre empieza con _ (privado por convención), + si no.
function filasDeClase(nodo: Node): FilaNodo[] {
  const visibilidad = (nombre: string) => (nombre.startsWith('_') ? '−' : '+');
  const conTipo = (nombre: string, tipo: string) => (tipo ? `${nombre}: ${tipo}` : nombre);
  return [
    ...nodo.attributes.map((a, i) => ({
      id: `a-${i}`,
      texto: conTipo(a.name, a.type),
      glifo: visibilidad(a.name),
    })),
    ...nodo.methods.map((m, i) => ({
      id: `m-${i}`,
      texto: firma(m),
      glifo: visibilidad(m.name),
    })),
  ];
}

export function firma(metodo: Method): string {
  const parametros = metodo.parameters
    .map((p) => (p.type ? `${p.name}: ${p.type}` : p.name))
    .join(', ');
  return `${metodo.name}(${parametros})${metodo.returnType ? `: ${metodo.returnType}` : ''}`;
}

function aArista(arista: Edge, compartida = false): AristaDiagrama {
  const max = compartida ? MAX_ETIQUETA_COMPARTIDA : MAX_TIPO;
  return {
    id: arista.id,
    de: arista.from,
    a: arista.to,
    estado: 'tinta',
    etiqueta: arista.label ? acortar(arista.label, max) : undefined,
  };
}

// (1) Se rompen los ciclos con un DFS en orden de id, ignorando las aristas de retroceso.
// (2) La capa de cada nodo es el camino más largo desde una fuente.
function asignarCapas(nodos: Node[], aristas: Edge[]): Map<string, number> {
  const salientes = new Map(nodos.map((n) => [n.id, [] as string[]]));
  for (const arista of aristas) salientes.get(arista.from)?.push(arista.to);
  for (const lista of salientes.values()) lista.sort();

  const estado = new Map<string, 'visitando' | 'listo'>();
  const orden: string[] = []; // postorden: al invertirlo queda un orden topológico
  const dag = new Map(nodos.map((n) => [n.id, [] as string[]]));
  const visitar = (id: string) => {
    estado.set(id, 'visitando');
    for (const destino of salientes.get(id) ?? []) {
      if (estado.get(destino) === 'visitando') continue; // arista de retroceso: rompe el ciclo
      dag.get(id)!.push(destino);
      if (!estado.has(destino)) visitar(destino);
    }
    estado.set(id, 'listo');
    orden.push(id);
  };
  for (const nodo of nodos) if (!estado.has(nodo.id)) visitar(nodo.id);

  const capas = new Map(nodos.map((n) => [n.id, 0]));
  for (const id of orden.reverse()) {
    for (const destino of dag.get(id)!) {
      capas.set(destino, Math.max(capas.get(destino)!, capas.get(id)! + 1));
    }
  }
  return capas;
}

// (3) Dentro de cada capa, orden por baricentro de los centros de los padres ya ubicados
//     (empate por id).
// (4) Cada fila se centra en x = 0 según el ancho real de sus nodos; la y acumula el nodo más alto
//     de cada fila.
function ubicar(
  nodos: Node[],
  aristas: Edge[],
  capas: Map<string, number>,
  base: Map<string, Omit<NodoDiagrama, 'x' | 'y'>>,
) {
  const posicion = new Map<string, { x: number; y: number }>();
  const ancho = (id: string) => base.get(id)!.ancho;
  const centro = (id: string) => posicion.get(id)!.x + ancho(id) / 2;
  const total = Math.max(0, ...capas.values()) + 1;
  let y = 0;

  for (let capa = 0; capa < total; capa++) {
    const fila = nodos.filter((n) => capas.get(n.id) === capa);
    const baricentro = (id: string) => {
      const padres = aristas
        .filter((a) => a.to === id && posicion.has(a.from))
        .map((a) => centro(a.from));
      return padres.length ? padres.reduce((s, x) => s + x, 0) / padres.length : 0;
    };
    const ordenada = fila
      .map((n) => ({ id: n.id, b: baricentro(n.id) }))
      .sort((p, q) => p.b - q.b || (p.id < q.id ? -1 : 1));

    const anchoFila =
      ordenada.reduce((s, { id }) => s + ancho(id), 0) + (ordenada.length - 1) * SEPARACION_X;
    let x = -anchoFila / 2;
    for (const { id } of ordenada) {
      posicion.set(id, { x, y });
      x += ancho(id) + SEPARACION_X;
    }
    const alto = Math.max(0, ...fila.map((n) => altoNodo({ ...base.get(n.id)!, x: 0, y: 0 })));
    y += alto + SEPARACION_Y;
  }
  return posicion;
}

function porId(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// El dibujo se ajusta al ancho de la mesa, pero nunca a menos de esta escala: con muchos nodos
// en una capa, la mesa hace scroll horizontal en vez de dejar el texto ilegible.
export const ESCALA_MINIMA = 0.75;

export function anchoMinimoDibujo(nodos: NodoDiagrama[]): number {
  return Math.round(marco(nodos).ancho * ESCALA_MINIMA);
}
