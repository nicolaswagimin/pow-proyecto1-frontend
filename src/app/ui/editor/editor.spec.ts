import { TestBed } from '@angular/core/testing';
import { ArchivoEditor } from './archivos';
import { Editor } from './editor';

const PYTHON = 'class Arma:\n    def __init__(self, nombre):\n        self.nombre = nombre\n';

function montar(archivos: ArchivoEditor[]) {
  const fixture = TestBed.createComponent(Editor);
  fixture.componentRef.setInput('archivos', archivos);
  fixture.detectChanges();
  return { fixture, raiz: fixture.nativeElement as HTMLElement };
}

describe('ui-editor: aviso de lenguaje', () => {
  it('avisa si el código no coincide con la extensión y renombra con un clic', () => {
    const { fixture, raiz } = montar([{ nombre: 'index.js', contenido: PYTHON }]);
    expect(raiz.textContent).toContain('Parece Python, pero la pestaña se llama index.js.');
    let emitido: ArchivoEditor[] | undefined;
    fixture.componentInstance.archivos.subscribe((a) => (emitido = a));
    const boton = [...raiz.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Renombrar a index.py'),
    )!;
    boton.click();
    fixture.detectChanges();
    expect(emitido?.[0].nombre).toBe('index.py');
    expect(raiz.textContent).not.toContain('Parece Python');
  });

  it('sin diferencia no muestra el aviso', () => {
    const { raiz } = montar([{ nombre: 'arma.py', contenido: PYTHON }]);
    expect(raiz.textContent).not.toContain('Parece');
  });
});
