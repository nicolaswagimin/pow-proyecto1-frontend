import { Diagram } from '../gen/codetodiagram/v1/diagram_pb';
import { DiffVista } from './diff';
import { CambioDiagrama } from './modelo';

// Qué se dibuja en cada vista del diff, sin importar el tipo de diagrama:
// - Antes: el diagrama anterior, con lo eliminado marcado.
// - Después: el nuevo, con lo agregado y modificado marcado.
// - Comparar: la unión de los dos, con lo eliminado marcado (el layout lo dibuja como fantasma).

export type VistaDiff = 'antes' | 'despues' | 'comparar';

export interface MarcasCambio {
  nodos?: ReadonlyMap<string, CambioDiagrama>;
  aristas?: ReadonlyMap<string, CambioDiagrama>;
}

// Prefijo de las aristas eliminadas en Comparar: su id puede repetirse en el diagrama nuevo.
const PREFIJO_FANTASMA = 'antes~';

export function diagramaDeVista(
  vista: VistaDiff,
  antes: Diagram,
  despues: Diagram,
  diff: DiffVista,
): { diagrama: Diagram; marcas: MarcasCambio } {
  const nodosEliminados = new Map([...diff.nodos].filter(([, cambio]) => cambio === 'eliminado'));
  const aristasEliminadas = new Map(
    [...diff.aristasEliminadas].map((id) => [id, 'eliminado' as const]),
  );

  if (vista === 'antes') {
    return { diagrama: antes, marcas: { nodos: nodosEliminados, aristas: aristasEliminadas } };
  }
  if (vista === 'despues') {
    const vigentes = new Map([...diff.nodos].filter(([, cambio]) => cambio !== 'eliminado'));
    return { diagrama: despues, marcas: { nodos: vigentes, aristas: diff.aristas } };
  }

  const union: Diagram = {
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
  return { diagrama: union, marcas: { nodos: diff.nodos, aristas: marcasAristas } };
}

// En Comparar, lo eliminado se dibuja tenue.
export function conFantasmas<T extends { cambio?: CambioDiagrama }>(
  vista: VistaDiff,
  elementos: T[],
): (T & { fantasma?: boolean })[] {
  if (vista !== 'comparar') return elementos;
  return elementos.map((x) => (x.cambio === 'eliminado' ? { ...x, fantasma: true } : x));
}
