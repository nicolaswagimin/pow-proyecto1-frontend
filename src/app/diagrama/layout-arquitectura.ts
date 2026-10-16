import { Diagram, Edge, Node, NodeCategory } from '../gen/codetodiagram/v1/diagram_pb';
import { DiffVista } from './diff';
import { AristaDiagrama, CambioDiagrama, FormaNodo, NodoDiagrama, altoNodo } from './modelo';

// Layout determinista por capas: el mismo diagrama siempre se dibuja igual, sin importar el orden
// en que la IA devolvió nodos y conexiones. Funciones puras, sin DOM.

export const ANCHO_NODO = 200;
export const SEPARACION_X = 48;
export const SEPARACION_Y = 72;
const MAX_TITULO = 24;
const MAX_TIPO = 28;

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

export interface MarcasCambio {
  nodos?: ReadonlyMap<string, CambioDiagrama>;
  aristas?: ReadonlyMap<string, CambioDiagrama>;
}

export interface LayoutDiagrama {
  nodos: NodoDiagrama[];
  aristas: AristaDiagrama[];
}

export function layoutArquitectura(d: Diagram, marcas: MarcasCambio = {}): LayoutDiagrama {
  const nodos = [...d.nodes].sort(porId);
  const aristas = [...d.edges].sort(porId);
  const capas = asignarCapas(nodos, aristas);
  const posicion = ubicar(nodos, aristas, capas);

  return {
    nodos: nodos.map((nodo) => ({ ...aNodo(nodo), ...posicion.get(nodo.id)!, cambio: marcas.nodos?.get(nodo.id) })),
    aristas: aristas.map((arista) => ({ ...aArista(arista), cambio: marcas.aristas?.get(arista.id) })),
  };
}

export type VistaDiff = 'antes' | 'despues' | 'comparar';

// Prefijo de las aristas eliminadas en Comparar: su id puede repetirse en el diagrama nuevo.
const PREFIJO_FANTASMA = 'antes~';

// Qué se dibuja en cada vista del diff:
// - Antes: el diagrama anterior, con lo eliminado marcado.
// - Después: el nuevo, con lo agregado y modificado marcado.
// - Comparar: la unión de los dos (layout propio, sin solapes), con lo eliminado como fantasma.
export function vistaDiff(
  vista: VistaDiff,
  antes: Diagram,
  despues: Diagram,
  diff: DiffVista,
): LayoutDiagrama {
  const nodosEliminados = new Map([...diff.nodos].filter(([, cambio]) => cambio === 'eliminado'));
  const aristasEliminadas = new Map([...diff.aristasEliminadas].map((id) => [id, 'eliminado' as const]));

  if (vista === 'antes') {
    return layoutArquitectura(antes, { nodos: nodosEliminados, aristas: aristasEliminadas });
  }
  if (vista === 'despues') {
    const vigentes = new Map([...diff.nodos].filter(([, cambio]) => cambio !== 'eliminado'));
    return layoutArquitectura(despues, { nodos: vigentes, aristas: diff.aristas });
  }

  const union = {
    ...despues,
    nodes: [...despues.nodes, ...antes.nodes.filter((n) => nodosEliminados.has(n.id))],
    edges: [
      ...despues.edges,
      ...antes.edges
        .filter((a) => diff.aristasEliminadas.has(a.id))
        .map((a) => ({ ...a, id: PREFIJO_FANTASMA + a.id })),
    ],
  };
  const marcasAristas = new Map(diff.aristas);
  for (const id of diff.aristasEliminadas) marcasAristas.set(PREFIJO_FANTASMA + id, 'eliminado');
  const { nodos, aristas } = layoutArquitectura(union, { nodos: diff.nodos, aristas: marcasAristas });
  const fantasma = <T extends { cambio?: CambioDiagrama }>(x: T) =>
    x.cambio === 'eliminado' ? { ...x, fantasma: true } : x;
  return { nodos: nodos.map(fantasma), aristas: aristas.map(fantasma) };
}

function aNodo(nodo: Node): Omit<NodoDiagrama, 'x' | 'y'> {
  const etiqueta = ETIQUETAS[nodo.category];
  return {
    id: nodo.id,
    titulo: acortar(nodo.name, MAX_TITULO),
    tipo: acortar(nodo.technology ? `${etiqueta}: ${nodo.technology}` : etiqueta, MAX_TIPO),
    forma: FORMAS[nodo.category],
    ancho: ANCHO_NODO,
    detalle: nodo.file ? acortar(nodo.file, MAX_TIPO) : undefined,
    estado: 'normal',
  };
}

function aArista(arista: Edge): AristaDiagrama {
  return {
    id: arista.id,
    de: arista.from,
    a: arista.to,
    estado: 'tinta',
    etiqueta: arista.label ? acortar(arista.label, MAX_TIPO) : undefined,
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

// (3) Dentro de cada capa, orden por baricentro de los padres ya ubicados (empate por id).
// (4) Cada fila se centra en x = 0; la y acumula el nodo más alto de cada fila.
function ubicar(nodos: Node[], aristas: Edge[], capas: Map<string, number>) {
  const posicion = new Map<string, { x: number; y: number }>();
  const total = Math.max(0, ...capas.values()) + 1;
  const altos = new Map(nodos.map((n) => [n.id, altoNodo({ ...aNodo(n), x: 0, y: 0 })]));
  let y = 0;

  for (let capa = 0; capa < total; capa++) {
    const fila = nodos.filter((n) => capas.get(n.id) === capa);
    const baricentro = (id: string) => {
      const padres = aristas
        .filter((a) => a.to === id && posicion.has(a.from))
        .map((a) => posicion.get(a.from)!.x);
      return padres.length ? padres.reduce((s, x) => s + x, 0) / padres.length : 0;
    };
    const ordenada = fila
      .map((n) => ({ id: n.id, b: baricentro(n.id) }))
      .sort((p, q) => p.b - q.b || (p.id < q.id ? -1 : 1));

    const ancho = ordenada.length * ANCHO_NODO + (ordenada.length - 1) * SEPARACION_X;
    ordenada.forEach(({ id }, i) => {
      posicion.set(id, { x: -ancho / 2 + i * (ANCHO_NODO + SEPARACION_X), y });
    });
    y += Math.max(0, ...fila.map((n) => altos.get(n.id)!)) + SEPARACION_Y;
  }
  return posicion;
}

function acortar(texto: string, max: number): string {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

function porId(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
