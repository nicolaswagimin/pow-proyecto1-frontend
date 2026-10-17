import { DiagramType } from '../gen/codetodiagram/v1/diagram_pb';
import { analizarPregunta } from './pregunta';

describe('analizarPregunta', () => {
  it('sugiere Clases si en Arquitectura se piden atributos o métodos', () => {
    const r = analizarPregunta('agrega atributos y metodos', DiagramType.ARCHITECTURE);
    expect(r?.sugerido).toBe(DiagramType.CLASS);
    expect(r?.mensaje).toMatch(/atributos o métodos/);
    expect(r?.mensaje).toMatch(/Arquitectura/);
  });

  it('también desde Secuencia', () => {
    expect(analizarPregunta('¿Qué métodos tiene Arena?', DiagramType.SEQUENCE)?.sugerido).toBe(
      DiagramType.CLASS,
    );
  });

  it('en Clases no sugiere nada por pedir atributos', () => {
    expect(analizarPregunta('muestra los atributos', DiagramType.CLASS)).toBeNull();
  });

  it('sugiere Secuencia si se pide el orden de los pasos', () => {
    expect(
      analizarPregunta('¿Qué pasa, paso a paso, cuando ataca el mago?', DiagramType.ARCHITECTURE)
        ?.sugerido,
    ).toBe(DiagramType.SEQUENCE);
    expect(
      analizarPregunta('¿En qué orden se ejecutan los turnos?', DiagramType.CLASS)?.sugerido,
    ).toBe(DiagramType.SEQUENCE);
  });

  it('una pregunta que el tipo sí puede responder no genera aviso', () => {
    expect(analizarPregunta('¿Qué componentes usa la arena?', DiagramType.ARCHITECTURE)).toBeNull();
    expect(analizarPregunta('', DiagramType.ARCHITECTURE)).toBeNull();
  });
});
