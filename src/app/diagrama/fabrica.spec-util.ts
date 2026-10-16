import { create } from '@bufbuild/protobuf';
import {
  Diagram,
  DiagramSchema,
  DiagramType,
  NodeCategory,
} from '../gen/codetodiagram/v1/diagram_pb';

// Fábrica de diagramas para las pruebas: nodos como ids y aristas como [id, de, a, etiqueta, orden].
export type AristaCorta = [string, string, string, string?, number?];

export function diagramaDePrueba({
  tipo = DiagramType.ARCHITECTURE,
  nodos = ['web', 'api', 'db'],
  aristas = [
    ['c1', 'web', 'api', 'login'],
    ['c2', 'api', 'db', 'consulta'],
  ] as AristaCorta[],
}: { tipo?: DiagramType; nodos?: string[]; aristas?: AristaCorta[] } = {}): Diagram {
  return create(DiagramSchema, {
    type: tipo,
    title: 'Login',
    nodes: nodos.map((id) => ({ id, name: id, category: NodeCategory.CONTAINER })),
    edges: aristas.map(([id, from, to, label = '', order = 0]) => ({ id, from, to, label, order })),
  });
}
