import { DiagramType } from '../gen/codetodiagram/v1/diagram_pb';

// Tipos de diagrama que ofrece la interfaz. Para agregar uno (flujo de trabajo, flujo de datos,
// ciclo de vida): un valor en el .proto, una entrada aquí, un layout y un componente de dibujo.
export type TipoSoportado =
  | DiagramType.ARCHITECTURE
  | DiagramType.SEQUENCE
  | DiagramType.CLASS;

export const TIPOS_DIAGRAMA: Record<TipoSoportado, { etiqueta: string; ayuda: string }> = {
  [DiagramType.ARCHITECTURE]: {
    etiqueta: 'Arquitectura',
    ayuda: 'Qué piezas hay y cómo se conectan.',
  },
  [DiagramType.SEQUENCE]: {
    etiqueta: 'Secuencia',
    ayuda: 'Qué pasa, paso a paso, en un flujo concreto.',
  },
  [DiagramType.CLASS]: {
    etiqueta: 'Clases',
    ayuda: 'Cada clase con sus atributos y métodos.',
  },
};
