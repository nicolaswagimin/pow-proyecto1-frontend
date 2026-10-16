import { NodeCategory } from '../gen/codetodiagram/v1/diagram_pb';
import { calcularDiff } from './diff';
import { diagramaDePrueba } from './fabrica.spec-util';
import {
  ANCHO_NODO,
  ESCALA_MINIMA,
  SEPARACION_X,
  anchoMinimoDibujo,
  layoutArquitectura,
  vistaDiff,
} from './layout-arquitectura';
import { marco } from './modelo';
import { NodoDiagrama } from './modelo';

const posiciones = (nodos: NodoDiagrama[]) =>
  Object.fromEntries(nodos.map((n) => [n.id, [n.x, n.y]]));

const capas = (nodos: NodoDiagrama[]) => {
  const ys = [...new Set(nodos.map((n) => n.y))].sort((a, b) => a - b);
  return Object.fromEntries(nodos.map((n) => [n.id, ys.indexOf(n.y)]));
};

describe('layoutArquitectura', () => {
  it('mismo diagrama da mismas posiciones', () => {
    const a = layoutArquitectura(diagramaDePrueba());
    const b = layoutArquitectura(diagramaDePrueba());
    expect(posiciones(a.nodos)).toEqual(posiciones(b.nodos));
  });

  it('el orden de entrada no cambia el resultado', () => {
    const d = diagramaDePrueba();
    const invertido = diagramaDePrueba();
    invertido.nodes.reverse();
    invertido.edges.reverse();
    expect(posiciones(layoutArquitectura(d).nodos)).toEqual(posiciones(layoutArquitectura(invertido).nodos));
  });

  it('cadena A→B→C queda en 3 capas', () => {
    expect(capas(layoutArquitectura(diagramaDePrueba()).nodos)).toEqual({ web: 0, api: 1, db: 2 });
  });

  it('layout con ciclo termina y asigna capas', () => {
    const d = diagramaDePrueba({
      nodos: ['a', 'b', 'c'],
      aristas: [['c1', 'a', 'b'], ['c2', 'b', 'c'], ['c3', 'c', 'a']],
    });
    expect(capas(layoutArquitectura(d).nodos)).toEqual({ a: 0, b: 1, c: 2 });
  });

  it('nodo aislado queda en la capa 0', () => {
    const d = diagramaDePrueba({ nodos: ['web', 'api', 'db', 'suelto'] });
    expect(capas(layoutArquitectura(d).nodos)['suelto']).toBe(0);
  });

  it('un solo nodo', () => {
    const { nodos, aristas } = layoutArquitectura(diagramaDePrueba({ nodos: ['solo'], aristas: [] }));
    expect(nodos.length).toBe(1);
    expect(aristas).toEqual([]);
  });

  it('sin solapes horizontales en una capa', () => {
    const d = diagramaDePrueba({
      nodos: ['raiz', 'a', 'b', 'c', 'd'],
      aristas: [['c1', 'raiz', 'a'], ['c2', 'raiz', 'b'], ['c3', 'raiz', 'c'], ['c4', 'raiz', 'd']],
    });
    const capa = layoutArquitectura(d).nodos.filter((n) => n.id !== 'raiz').sort((p, q) => p.x - q.x);
    for (let i = 1; i < capa.length; i++) {
      expect(capa[i].x - capa[i - 1].x).toBeGreaterThanOrEqual(ANCHO_NODO + SEPARACION_X);
    }
  });

  it('un diagrama ancho no se encoge por debajo de la escala mínima', () => {
    const hijos = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const d = diagramaDePrueba({
      nodos: ['raiz', ...hijos],
      aristas: hijos.map((h, i) => [`c${i}`, 'raiz', h] as [string, string, string]),
    });
    const { nodos } = layoutArquitectura(d);
    expect(ESCALA_MINIMA).toBeGreaterThanOrEqual(0.75);
    expect(anchoMinimoDibujo(nodos)).toBe(Math.round(marco(nodos).ancho * ESCALA_MINIMA));
  });

  it('acorta las etiquetas cuando un nodo tiene varias salidas, para que no se pisen', () => {
    const d = diagramaDePrueba({
      nodos: ['api', 'db', 'cache'],
      aristas: [['c1', 'api', 'db', 'SELECT * FROM usuarios WHERE email'], ['c2', 'api', 'cache', 'GET/SET token']],
    });
    const etiquetas = layoutArquitectura(d).aristas.map((a) => a.etiqueta ?? '');
    expect(etiquetas.every((e) => e.length <= 12)).toBe(true);
    const sola = diagramaDePrueba({ nodos: ['api', 'db'], aristas: [['c1', 'api', 'db', 'SELECT * FROM usuarios']] });
    expect(layoutArquitectura(sola).aristas[0].etiqueta).toBe('SELECT * FROM usuarios');
  });

  it('mapea nombre, categoría, tecnología y archivo', () => {
    const d = diagramaDePrueba({ nodos: ['db'], aristas: [] });
    d.nodes[0].name = 'Base de datos';
    d.nodes[0].category = NodeCategory.DATABASE;
    d.nodes[0].technology = 'PostgreSQL';
    d.nodes[0].file = 'schema.sql';
    const [nodo] = layoutArquitectura(d).nodos;
    expect(nodo).toMatchObject({
      titulo: 'Base de datos',
      tipo: 'Base de datos: PostgreSQL',
      forma: 'base-datos',
      detalle: 'schema.sql',
    });
  });

  it('acorta los títulos largos', () => {
    const d = diagramaDePrueba({ nodos: ['n'], aristas: [] });
    d.nodes[0].name = 'Servicio de autenticación y autorización';
    expect(layoutArquitectura(d).nodos[0].titulo.endsWith('…')).toBe(true);
  });

  it('aplica las marcas de cambio', () => {
    const { nodos, aristas } = layoutArquitectura(diagramaDePrueba(), {
      nodos: new Map([['api', 'modificado']]),
      aristas: new Map([['c2', 'agregado']]),
    });
    expect(nodos.find((n) => n.id === 'api')?.cambio).toBe('modificado');
    expect(nodos.find((n) => n.id === 'web')?.cambio).toBeUndefined();
    expect(aristas.find((a) => a.id === 'c2')?.cambio).toBe('agregado');
  });
});

describe('vistaDiff', () => {
  const antes = diagramaDePrueba();
  const despues = diagramaDePrueba({
    nodos: ['web', 'api', 'cache'],
    aristas: [['c1', 'web', 'api', 'login'], ['c3', 'api', 'cache']],
  });
  const diff = calcularDiff(antes, despues);

  it('Después marca agregados y no muestra eliminados', () => {
    const { nodos } = vistaDiff('despues', antes, despues, diff);
    expect(nodos.map((n) => [n.id, n.cambio])).toEqual(
      expect.arrayContaining([['cache', 'agregado'], ['web', undefined]]),
    );
    expect(nodos.some((n) => n.id === 'db')).toBe(false);
  });

  it('Antes marca eliminados', () => {
    const { nodos, aristas } = vistaDiff('antes', antes, despues, diff);
    expect(nodos.find((n) => n.id === 'db')?.cambio).toBe('eliminado');
    expect(nodos.some((n) => n.id === 'cache')).toBe(false);
    expect(aristas.find((a) => a.id === 'c2')?.cambio).toBe('eliminado');
  });

  it('eliminados aparecen como fantasma en Comparar', () => {
    const { nodos, aristas } = vistaDiff('comparar', antes, despues, diff);
    const db = nodos.find((n) => n.id === 'db');
    expect(db).toMatchObject({ cambio: 'eliminado', fantasma: true });
    expect(nodos.find((n) => n.id === 'cache')?.cambio).toBe('agregado');
    const fantasma = aristas.find((a) => a.fantasma);
    expect(fantasma).toMatchObject({ de: 'api', a: 'db', cambio: 'eliminado' });
    // Los ids de las aristas fantasma no chocan con los del diagrama nuevo.
    expect(new Set(aristas.map((a) => a.id)).size).toBe(aristas.length);
  });

  it('Comparar sin solapes entre nodos', () => {
    const { nodos } = vistaDiff('comparar', antes, despues, diff);
    const claves = nodos.map((n) => `${n.x},${n.y}`);
    expect(new Set(claves).size).toBe(nodos.length);
  });
});
