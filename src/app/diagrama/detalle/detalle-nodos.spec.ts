import { TestBed } from '@angular/core/testing';
import { DiagramType, NodeCategory } from '../../gen/codetodiagram/v1/diagram_pb';
import { diagramaDePrueba } from '../fabrica.spec-util';
import { DetalleNodos } from './detalle-nodos';

function montar(abierto: string | null = null) {
  const d = diagramaDePrueba({ tipo: DiagramType.CLASS, nodos: ['personaje', 'db'], aristas: [] });
  d.nodes[0].name = 'Personaje (Guerrero, Mago, Picaro)';
  d.nodes[0].description = 'Base abstracta de los combatientes.';
  d.nodes[0].file = 'index.py';
  d.nodes[0].attributes = [
    { $typeName: 'codetodiagram.v1.Attribute', name: 'nombre', type: 'str' },
  ];
  d.nodes[0].methods = [
    {
      $typeName: 'codetodiagram.v1.Method',
      name: 'ejecutar_turno',
      parameters: [
        { $typeName: 'codetodiagram.v1.Parameter', name: 'objetivo', type: 'Personaje' },
      ],
      returnType: '',
    },
  ];
  d.nodes[1].name = 'Base de Datos';
  d.nodes[1].category = NodeCategory.DATABASE;
  d.nodes[1].notInCode = true;
  const fixture = TestBed.createComponent(DetalleNodos);
  fixture.componentRef.setInput('diagrama', d);
  fixture.componentRef.setInput('abierto', abierto);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ui-detalle-nodos', () => {
  it('muestra el nombre completo, la descripción y el archivo', () => {
    const texto = montar().textContent ?? '';
    expect(texto).toContain('Personaje (Guerrero, Mago, Picaro)');
    expect(texto).toContain('Base abstracta de los combatientes.');
    expect(texto).toContain('index.py');
  });

  it('lista atributos y métodos con su firma', () => {
    const texto = montar().textContent ?? '';
    expect(texto).toContain('nombre: str');
    expect(texto).toContain('ejecutar_turno(objetivo: Personaje)');
  });

  it('avisa cuando un nodo no está en el código', () => {
    const raiz = montar();
    const db = raiz.querySelector('[data-id="db"]')!;
    expect(db.textContent).toContain('No está en el código');
  });

  it('abre el detalle del nodo indicado', () => {
    const raiz = montar('db');
    expect((raiz.querySelector('[data-id="db"]') as HTMLDetailsElement).open).toBe(true);
    expect((raiz.querySelector('[data-id="personaje"]') as HTMLDetailsElement).open).toBe(false);
  });
});
