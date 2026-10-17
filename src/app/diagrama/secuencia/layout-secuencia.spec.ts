import { DiagramType } from '../../gen/codetodiagram/v1/diagram_pb';
import { calcularDiff } from '../diff';
import { diagramaDePrueba } from '../fabrica.spec-util';
import {
  ALTO_MENSAJE,
  ANCHO_CARRIL,
  layoutSecuencia,
  vistaDiffSecuencia,
} from './layout-secuencia';

const secuencia = (
  aristas: [string, string, string, string, number][],
  nodos = ['usuario', 'web', 'api', 'db'],
) => diagramaDePrueba({ tipo: DiagramType.SEQUENCE, nodos, aristas });

const login = secuencia([
  ['c2', 'web', 'api', 'POST /login', 2],
  ['c1', 'usuario', 'web', 'envía formulario', 1],
  ['c3', 'api', 'db', 'SELECT usuario', 3],
]);

describe('layoutSecuencia', () => {
  it('participantes en orden de aparición', () => {
    expect(layoutSecuencia(login).participantes.map((p) => p.id)).toEqual([
      'usuario',
      'web',
      'api',
      'db',
    ]);
  });

  it('participantes sin mensajes van al final por id', () => {
    const d = secuencia([['c1', 'web', 'api', 'x', 1]], ['zeta', 'api', 'web', 'alfa']);
    expect(layoutSecuencia(d).participantes.map((p) => p.id)).toEqual([
      'web',
      'api',
      'alfa',
      'zeta',
    ]);
  });

  it('mensajes ordenados por order con empate por id', () => {
    const d = secuencia([
      ['c9', 'web', 'api', 'b', 1],
      ['c1', 'usuario', 'web', 'a', 1],
      ['c5', 'api', 'db', 'c', 2],
    ]);
    expect(layoutSecuencia(d).mensajes.map((m) => m.id)).toEqual(['c1', 'c9', 'c5']);
  });

  it('ubica carriles y mensajes en una grilla fija', () => {
    const { participantes, mensajes } = layoutSecuencia(login);
    expect(participantes.map((p) => p.x)).toEqual(
      [0, 1, 2, 3].map((i) => i * ANCHO_CARRIL + ANCHO_CARRIL / 2),
    );
    expect(mensajes[1].y - mensajes[0].y).toBe(ALTO_MENSAJE);
    expect(mensajes[0]).toMatchObject({
      deX: participantes[0].x,
      aX: participantes[1].x,
      etiqueta: 'envía formulario',
    });
  });

  it('aplica cambios', () => {
    const { participantes, mensajes } = layoutSecuencia(login, {
      nodos: new Map([['db', 'agregado']]),
      aristas: new Map([['c3', 'modificado']]),
    });
    expect(participantes.find((p) => p.id === 'db')?.cambio).toBe('agregado');
    expect(mensajes.find((m) => m.id === 'c3')?.cambio).toBe('modificado');
  });
});

describe('vistaDiffSecuencia', () => {
  const despues = secuencia(
    [
      ['c1', 'usuario', 'web', 'envía formulario', 1],
      ['c2', 'web', 'api', 'POST /login', 2],
    ],
    ['usuario', 'web', 'api'],
  );
  const diff = calcularDiff(login, despues);

  it('Comparar muestra el mensaje eliminado como fantasma en su orden', () => {
    const { mensajes, participantes } = vistaDiffSecuencia('comparar', login, despues, diff);
    expect(mensajes.map((m) => [m.etiqueta, m.cambio, m.fantasma ?? false])).toEqual([
      ['envía formulario', undefined, false],
      ['POST /login', undefined, false],
      ['SELECT usuario', 'eliminado', true],
    ]);
    expect(participantes.find((p) => p.id === 'db')).toMatchObject({
      cambio: 'eliminado',
      fantasma: true,
    });
  });

  it('conserva el nombre completo de cada participante para el tooltip', () => {
    const d = secuencia([['c1', 'web', 'api', 'x', 1]], ['web', 'api']);
    d.nodes[0].name = 'Aplicación web del panel de administración';
    const web = layoutSecuencia(d).participantes.find((p) => p.id === 'web')!;
    expect(web.titulo.endsWith('…')).toBe(true);
    expect(web.tituloCompleto).toBe('Aplicación web del panel de administración');
  });
});
