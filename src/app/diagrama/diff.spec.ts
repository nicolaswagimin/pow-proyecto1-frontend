import { calcularDiff } from './diff';
import { diagramaDePrueba } from './fabrica.spec-util';

const entradas = (mapa: Map<string, string>) => [...mapa.entries()];

describe('calcularDiff (frontend)', () => {
  it('sin cambios da listas vacías', () => {
    const diff = calcularDiff(diagramaDePrueba(), diagramaDePrueba());
    expect(diff.total).toBe(0);
    expect(entradas(diff.nodos)).toEqual([]);
  });

  it('nodo agregado', () => {
    const diff = calcularDiff(diagramaDePrueba(), diagramaDePrueba({ nodos: ['web', 'api', 'db', 'cache'] }));
    expect(entradas(diff.nodos)).toEqual([['cache', 'agregado']]);
  });

  it('nodo eliminado y su conexión', () => {
    const despues = diagramaDePrueba({ nodos: ['web', 'api'], aristas: [['c1', 'web', 'api', 'login']] });
    const diff = calcularDiff(diagramaDePrueba(), despues);
    expect(entradas(diff.nodos)).toEqual([['db', 'eliminado']]);
    expect([...diff.aristasEliminadas]).toEqual(['c2']);
  });

  it('nodo modificado por tecnología', () => {
    const despues = diagramaDePrueba();
    despues.nodes[1].technology = 'Fastify';
    expect(entradas(calcularDiff(diagramaDePrueba(), despues).nodos)).toEqual([['api', 'modificado']]);
  });

  it('conexión renumerada con mismos extremos y etiqueta no cuenta como cambio', () => {
    const despues = diagramaDePrueba({ aristas: [['c7', 'web', 'api', 'login'], ['c2', 'api', 'db', 'consulta']] });
    expect(calcularDiff(diagramaDePrueba(), despues).total).toBe(0);
  });

  it('conexión con nueva etiqueta es modificada', () => {
    const despues = diagramaDePrueba({ aristas: [['c1', 'web', 'api', 'POST /login'], ['c2', 'api', 'db', 'consulta']] });
    expect(entradas(calcularDiff(diagramaDePrueba(), despues).aristas)).toEqual([['c1', 'modificado']]);
  });

  it('conexión con nuevo orden es modificada', () => {
    const antes = diagramaDePrueba({ aristas: [['c1', 'web', 'api', 'a', 1]] });
    const despues = diagramaDePrueba({ aristas: [['c1', 'web', 'api', 'a', 2]] });
    expect(entradas(calcularDiff(antes, despues).aristas)).toEqual([['c1', 'modificado']]);
  });

  it('mismo id con otros extremos queda como agregada y eliminada sin pisarse', () => {
    const despues = diagramaDePrueba({ aristas: [['c1', 'web', 'db', 'login'], ['c2', 'api', 'db', 'consulta']] });
    const diff = calcularDiff(diagramaDePrueba(), despues);
    expect(entradas(diff.aristas)).toEqual([['c1', 'agregado']]);
    expect([...diff.aristasEliminadas]).toEqual(['c1']);
  });

  it('total cuenta todos los cambios', () => {
    const despues = diagramaDePrueba({ nodos: ['web', 'api', 'cache'], aristas: [['c1', 'web', 'api', 'login'], ['c3', 'api', 'cache']] });
    // cache agregado, db eliminado, c3 agregada, c2 eliminada
    expect(calcularDiff(diagramaDePrueba(), despues).total).toBe(4);
  });

  it('resultado ordenado por id', () => {
    const diff = calcularDiff(diagramaDePrueba(), diagramaDePrueba({ nodos: ['zeta', 'web', 'api', 'db', 'alfa'] }));
    expect([...diff.nodos.keys()]).toEqual(['alfa', 'zeta']);
  });
});
