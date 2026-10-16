import { DiagramType, NodeCategory } from '../gen/codetodiagram/v1/diagram_pb';
import { diagramaDePrueba } from './fabrica.spec-util';
import { validarDiagrama } from './validar';

function errores(d: Parameters<typeof validarDiagrama>[0]): string[] {
  const r = validarDiagrama(d);
  if (r.ok) throw new Error('se esperaba que fuera inválido');
  return r.errores;
}

describe('validarDiagrama (frontend)', () => {
  it('acepta un diagrama válido de arquitectura', () => {
    expect(validarDiagrama(diagramaDePrueba()).ok).toBe(true);
  });

  it('acepta secuencia con orden', () => {
    const d = diagramaDePrueba({
      tipo: DiagramType.SEQUENCE,
      aristas: [['c1', 'web', 'api', 'a', 1], ['c2', 'api', 'db', 'b', 2]],
    });
    expect(validarDiagrama(d).ok).toBe(true);
  });

  it('rechaza undefined', () => {
    expect(errores(undefined)).toEqual(['No llegó ningún diagrama.']);
  });

  it('rechaza más de 12 nodos', () => {
    const nodos = Array.from({ length: 13 }, (_, i) => `n${i}`);
    expect(errores(diagramaDePrueba({ nodos, aristas: [] })).join()).toMatch(/máximo 12 nodos/);
  });

  it('rechaza un diagrama sin nodos', () => {
    expect(errores(diagramaDePrueba({ nodos: [], aristas: [] })).join()).toMatch(/al menos un nodo/);
  });

  it('rechaza tipo sin especificar', () => {
    expect(errores(diagramaDePrueba({ tipo: DiagramType.UNSPECIFIED }))).toContain(
      'Tipo de diagrama desconocido.',
    );
  });

  it('rechaza ids duplicados', () => {
    expect(errores(diagramaDePrueba({ nodos: ['web', 'api', 'api'], aristas: [] }))).toContain(
      'El id "api" está repetido.',
    );
  });

  it('rechaza id con mayúsculas', () => {
    expect(errores(diagramaDePrueba({ nodos: ['Web'], aristas: [] }))).toContain(
      'El id "Web" solo puede tener minúsculas, números y guiones.',
    );
  });

  it('rechaza conexión a nodo inexistente', () => {
    const d = diagramaDePrueba({ nodos: ['web', 'api'], aristas: [['c3', 'api', 'db']] });
    expect(errores(d)).toEqual(['La conexión "c3" apunta a un nodo que no existe: "db"']);
  });

  it('rechaza autoconexión', () => {
    const d = diagramaDePrueba({ aristas: [['c3', 'api', 'api']] });
    expect(errores(d)).toContain('La conexión "c3" une el nodo "api" consigo mismo.');
  });

  it('rechaza categoría sin especificar', () => {
    const d = diagramaDePrueba({ aristas: [] });
    d.nodes[1].category = NodeCategory.UNSPECIFIED;
    expect(errores(d)).toContain('El nodo "api" tiene una categoría desconocida.');
  });

  it('rechaza nodo sin nombre', () => {
    const d = diagramaDePrueba({ aristas: [] });
    d.nodes[0].name = ' ';
    expect(errores(d)).toContain('El nodo "web" necesita un nombre.');
  });

  it('rechaza secuencia sin orden', () => {
    const d = diagramaDePrueba({
      tipo: DiagramType.SEQUENCE,
      aristas: [['c1', 'web', 'api', 'a', 1], ['c2', 'api', 'db', 'b']],
    });
    expect(errores(d)).toContain(
      'En un diagrama de secuencia, la conexión "c2" necesita un orden (1 o más).',
    );
  });
});
