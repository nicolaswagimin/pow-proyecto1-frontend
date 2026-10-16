import { Diagram, Edge, Node } from '../gen/codetodiagram/v1/diagram_pb';
import { CambioDiagrama } from './modelo';

// Diff entre dos versiones de un diagrama, con las mismas reglas que el backend
// (src/diagramas/diff.js). Si cambias una, cambia la otra.

export type Cambio = CambioDiagrama;

export interface DiffVista {
  // Nodos agregados, modificados y eliminados (el id de un nodo es el mismo antes y después).
  nodos: Map<string, Cambio>;
  // Conexiones agregadas y modificadas, por su id en el diagrama nuevo.
  aristas: Map<string, Cambio>;
  // Conexiones eliminadas, por su id en el diagrama anterior (puede repetir un id nuevo).
  aristasEliminadas: Set<string>;
  total: number;
}

const CAMPOS_NODO = ['name', 'category', 'technology', 'description'] as const;

export function calcularDiff(antes: Diagram, despues: Diagram): DiffVista {
  const nodos = diffNodos(antes.nodes, despues.nodes);
  const { aristas, aristasEliminadas } = diffAristas(antes.edges, despues.edges);
  return { nodos, aristas, aristasEliminadas, total: nodos.size + aristas.size + aristasEliminadas.size };
}

function diffNodos(antes: Node[], despues: Node[]): Map<string, Cambio> {
  const previos = new Map(antes.map((nodo) => [nodo.id, nodo]));
  const actuales = new Set(despues.map((nodo) => nodo.id));
  const cambios: [string, Cambio][] = [];
  for (const nodo of despues) {
    const previo = previos.get(nodo.id);
    if (!previo) cambios.push([nodo.id, 'agregado']);
    else if (CAMPOS_NODO.some((campo) => previo[campo] !== nodo[campo])) {
      cambios.push([nodo.id, 'modificado']);
    }
  }
  for (const nodo of antes) {
    if (!actuales.has(nodo.id)) cambios.push([nodo.id, 'eliminado']);
  }
  return new Map(cambios.sort(([a], [b]) => comparar(a, b)));
}

// Primero por id (si une los mismos nodos); las que quedan, por extremos + etiqueta: así una
// conexión que la IA renumeró no aparece como cambio.
function diffAristas(antes: Edge[], despues: Edge[]) {
  const pares: [Edge, Edge][] = [];
  const libresAntes = new Set(antes);
  const libresDespues = new Set(despues);
  const emparejar = (previa: Edge, actual: Edge) => {
    pares.push([previa, actual]);
    libresAntes.delete(previa);
    libresDespues.delete(actual);
  };

  const porId = new Map(despues.map((arista) => [arista.id, arista]));
  for (const previa of antes) {
    const actual = porId.get(previa.id);
    if (actual && actual.from === previa.from && actual.to === previa.to) emparejar(previa, actual);
  }

  const clave = (a: Edge) => `${a.from}|${a.to}|${a.label}`;
  for (const previa of [...libresAntes].sort(porIdArista)) {
    const actual = [...libresDespues].sort(porIdArista).find((a) => clave(a) === clave(previa));
    if (actual) emparejar(previa, actual);
  }

  const cambios: [string, Cambio][] = pares
    .filter(([previa, actual]) => previa.label !== actual.label || previa.order !== actual.order)
    .map(([, actual]) => [actual.id, 'modificado']);
  for (const arista of libresDespues) cambios.push([arista.id, 'agregado']);

  return {
    aristas: new Map(cambios.sort(([a], [b]) => comparar(a, b))),
    aristasEliminadas: new Set([...libresAntes].map((a) => a.id).sort(comparar)),
  };
}

const comparar = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const porIdArista = (a: Edge, b: Edge) => comparar(a.id, b.id);
