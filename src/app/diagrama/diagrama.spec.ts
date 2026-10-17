import { TestBed } from '@angular/core/testing';
import { Diagrama } from './diagrama';
import { NodoDiagrama } from './modelo';

const nodo = (extra: Partial<NodoDiagrama> = {}): NodoDiagrama => ({
  id: 'personaje',
  titulo: 'Personaje (Guerrero, Ma…',
  tipo: 'Componente',
  forma: 'componente',
  x: 0,
  y: 0,
  ancho: 200,
  ...extra,
});

function montar(nodos: NodoDiagrama[], seleccionable = false) {
  const fixture = TestBed.createComponent(Diagrama);
  fixture.componentRef.setInput('nodos', nodos);
  fixture.componentRef.setInput('descripcion', 'Diagrama de prueba');
  fixture.componentRef.setInput('seleccionable', seleccionable);
  fixture.detectChanges();
  return { fixture, raiz: fixture.nativeElement as HTMLElement };
}

describe('ui-diagrama (agregados de la ronda 2)', () => {
  it('muestra el nombre completo como tooltip (<title>)', () => {
    const { raiz } = montar([nodo({ tituloCompleto: 'Personaje (Guerrero, Mago, Picaro)' })]);
    expect(raiz.querySelector('.nodo title')?.textContent).toBe('Personaje (Guerrero, Mago, Picaro)');
  });

  it('sin tituloCompleto, el tooltip es el título', () => {
    const { raiz } = montar([nodo({ titulo: 'Arena' })]);
    expect(raiz.querySelector('.nodo title')?.textContent).toBe('Arena');
  });

  it('usa el glifo de la fila cuando viene dado', () => {
    const { raiz } = montar([nodo({ filas: [{ id: 'a-0', texto: 'nombre: str', glifo: '+' }] })]);
    expect(raiz.querySelector('.fila__glifo')?.textContent).toBe('+');
  });

  it('sin glifo, conserva el del estado', () => {
    const { raiz } = montar([nodo({ filas: [{ id: 'f', texto: 'email', estado: 'ok' }] })]);
    expect(raiz.querySelector('.fila__glifo')?.textContent).toBe('✓');
  });

  it('emite nodoClic con el id al hacer clic en un nodo', () => {
    const { fixture, raiz } = montar([nodo()], true);
    let recibido: string | undefined;
    fixture.componentInstance.nodoClic.subscribe((id: string) => (recibido = id));
    raiz.querySelector('.nodo')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(recibido).toBe('personaje');
    expect(raiz.classList.contains('seleccionable')).toBe(true);
  });
});
