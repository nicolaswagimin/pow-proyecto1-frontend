import { Diagram, DiagramType, NodeCategory } from '../gen/codetodiagram/v1/diagram_pb';

// Segunda capa de validación: el servidor ya validó, pero el cliente no dibuja nada que no pase
// estas mismas reglas (src/diagramas/validar.js en el backend). Si cambias una, cambia la otra.

export const MAX_NODOS = 12;

export type ResultadoValidacion =
  | { ok: true; diagrama: Diagram }
  | { ok: false; errores: string[] };

type Regla = (d: Diagram) => string[];

const TIPOS = new Set([DiagramType.ARCHITECTURE, DiagramType.SEQUENCE]);
const CATEGORIAS = new Set([
  NodeCategory.PERSON,
  NodeCategory.COMPONENT,
  NodeCategory.CONTAINER,
  NodeCategory.DATABASE,
  NodeCategory.EXTERNAL,
]);

const revisarTipoYCategorias: Regla = (d) => [
  ...(TIPOS.has(d.type) ? [] : ['Tipo de diagrama desconocido.']),
  ...d.nodes
    .filter((nodo) => !CATEGORIAS.has(nodo.category))
    .map((nodo) => `El nodo "${nodo.id}" tiene una categoría desconocida.`),
  ...d.nodes
    .filter((nodo) => !nodo.name.trim())
    .map((nodo) => `El nodo "${nodo.id}" necesita un nombre.`),
];

const revisarCantidad: Regla = (d) => {
  if (d.nodes.length === 0) return ['El diagrama debe tener al menos un nodo.'];
  if (d.nodes.length > MAX_NODOS) {
    return [`El diagrama debe tener como máximo ${MAX_NODOS} nodos (tiene ${d.nodes.length}).`];
  }
  return [];
};

const FORMATO_ID = /^[a-z0-9-]+$/;

// Ids únicos y estables: el diff los usa para emparejar el antes y el después.
const revisarIds: Regla = (d) =>
  [d.nodes, d.edges].flatMap((lista) => {
    const vistos = new Set<string>();
    return lista.flatMap(({ id }) => {
      const errores: string[] = [];
      if (!FORMATO_ID.test(id)) {
        errores.push(`El id "${id}" solo puede tener minúsculas, números y guiones.`);
      }
      if (vistos.has(id)) errores.push(`El id "${id}" está repetido.`);
      vistos.add(id);
      return errores;
    });
  });

// Ninguna conexión puede apuntar a un nodo inventado ni unir un nodo consigo mismo.
const revisarConexiones: Regla = (d) => {
  const ids = new Set(d.nodes.map((nodo) => nodo.id));
  return d.edges.flatMap((arista) => [
    ...[arista.from, arista.to]
      .filter((extremo) => !ids.has(extremo))
      .map((extremo) => `La conexión "${arista.id}" apunta a un nodo que no existe: "${extremo}"`),
    ...(arista.from === arista.to
      ? [`La conexión "${arista.id}" une el nodo "${arista.from}" consigo mismo.`]
      : []),
  ]);
};

// En secuencia, el orden de los mensajes es lo que se dibuja de arriba abajo.
const revisarOrden: Regla = (d) =>
  d.type !== DiagramType.SEQUENCE
    ? []
    : d.edges
        .filter((arista) => arista.order < 1)
        .map(
          (arista) =>
            `En un diagrama de secuencia, la conexión "${arista.id}" necesita un orden (1 o más).`,
        );

const REGLAS: Regla[] = [
  revisarTipoYCategorias,
  revisarCantidad,
  revisarIds,
  revisarConexiones,
  revisarOrden,
];

export function validarDiagrama(d: Diagram | undefined): ResultadoValidacion {
  if (!d) return { ok: false, errores: ['No llegó ningún diagrama.'] };
  const errores = REGLAS.flatMap((regla) => regla(d));
  return errores.length ? { ok: false, errores } : { ok: true, diagrama: d };
}
