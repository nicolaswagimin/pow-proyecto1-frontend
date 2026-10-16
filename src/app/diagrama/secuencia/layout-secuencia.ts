import { Diagram, Edge } from '../../gen/codetodiagram/v1/diagram_pb';
import { DiffVista } from '../diff';
import { CambioDiagrama } from '../modelo';
import { MarcasCambio, VistaDiff, conFantasmas, diagramaDeVista } from '../vistas';
import { acortar } from '../texto';

// Layout determinista del diagrama de secuencia: un carril (línea de vida) por participante y un
// mensaje por fila, de arriba abajo según su orden. Funciones puras, sin DOM.

export const ANCHO_CARRIL = 180;
export const ALTO_MENSAJE = 44;
export const INICIO_MENSAJES = 80;
const MAX_TITULO = 20;
const MAX_ETIQUETA = 26;

export interface Participante {
  id: string;
  titulo: string;
  x: number;
  cambio?: CambioDiagrama;
  fantasma?: boolean;
}

export interface Mensaje {
  id: string;
  deX: number;
  aX: number;
  y: number;
  etiqueta: string;
  cambio?: CambioDiagrama;
  fantasma?: boolean;
}

export interface LayoutSecuencia {
  participantes: Participante[];
  mensajes: Mensaje[];
  ancho: number;
  alto: number;
}

export function layoutSecuencia(d: Diagram, marcas: MarcasCambio = {}): LayoutSecuencia {
  const ordenados = [...d.edges].sort(porOrden);

  // Participantes en orden de primera aparición; los que no hablan, al final por id.
  const ids: string[] = [];
  for (const m of ordenados) for (const id of [m.from, m.to]) if (!ids.includes(id)) ids.push(id);
  const callados = d.nodes
    .map((n) => n.id)
    .filter((id) => !ids.includes(id))
    .sort();
  const nombres = new Map(d.nodes.map((n) => [n.id, n.name]));
  const participantes = [...ids, ...callados]
    .filter((id) => nombres.has(id))
    .map((id, i) => ({
      id,
      titulo: acortar(nombres.get(id)!, MAX_TITULO),
      x: i * ANCHO_CARRIL + ANCHO_CARRIL / 2,
      cambio: marcas.nodos?.get(id),
    }));

  const xDe = new Map(participantes.map((p) => [p.id, p.x]));
  const mensajes = ordenados.map((m, k) => ({
    id: m.id,
    deX: xDe.get(m.from)!,
    aX: xDe.get(m.to)!,
    y: INICIO_MENSAJES + k * ALTO_MENSAJE,
    etiqueta: acortar(m.label, MAX_ETIQUETA),
    cambio: marcas.aristas?.get(m.id),
  }));

  return {
    participantes,
    mensajes,
    ancho: participantes.length * ANCHO_CARRIL,
    alto: INICIO_MENSAJES + mensajes.length * ALTO_MENSAJE + 20,
  };
}

export function vistaDiffSecuencia(
  vista: VistaDiff,
  antes: Diagram,
  despues: Diagram,
  diff: DiffVista,
): LayoutSecuencia {
  const { diagrama, marcas } = diagramaDeVista(vista, antes, despues, diff);
  const layout = layoutSecuencia(diagrama, marcas);
  return {
    ...layout,
    participantes: conFantasmas(vista, layout.participantes),
    mensajes: conFantasmas(vista, layout.mensajes),
  };
}

function porOrden(a: Edge, b: Edge): number {
  return a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
