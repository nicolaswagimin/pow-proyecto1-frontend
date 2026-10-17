import { DiagramType } from '../gen/codetodiagram/v1/diagram_pb';
import { TIPOS_DIAGRAMA, TipoSoportado } from './tipos';

// Detecta preguntas que el tipo elegido no puede responder (el diagrama no las mostraría aunque el
// título lo prometa) y sugiere el tipo que sí puede.

export interface SugerenciaTipo {
  mensaje: string;
  sugerido: TipoSoportado;
}

const PIDE_MIEMBROS = /atribut|m[eé]todo|propiedad/i;
const PIDE_ORDEN =
  /paso a paso|en qu[eé] orden|secuencia de|qu[eé] pasa cuando|qu[eé] ocurre cuando/i;

export function analizarPregunta(pregunta: string, tipo: TipoSoportado): SugerenciaTipo | null {
  const elegido = TIPOS_DIAGRAMA[tipo].etiqueta;
  if (tipo !== DiagramType.CLASS && PIDE_MIEMBROS.test(pregunta)) {
    return {
      sugerido: DiagramType.CLASS,
      mensaje: `Tu pregunta pide atributos o métodos, pero un diagrama de ${elegido} no los muestra. El tipo Clases sí.`,
    };
  }
  if (tipo !== DiagramType.SEQUENCE && PIDE_ORDEN.test(pregunta)) {
    return {
      sugerido: DiagramType.SEQUENCE,
      mensaje: `Tu pregunta pide el orden de los pasos, pero un diagrama de ${elegido} no lo muestra. El tipo Secuencia sí.`,
    };
  }
  return null;
}
