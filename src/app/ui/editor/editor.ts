import { ChangeDetectionStrategy, Component, computed, model, signal } from '@angular/core';
import { ArchivoEditor } from './archivos';

// Editor de código liviano: una pestaña por archivo y un textarea con la tipografía de código.
// Sin CodeMirror ni Monaco a propósito (ver docs/decisiones/0005-editor-textarea-propio.md).
@Component({
  selector: 'ui-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './editor.html',
  styleUrl: './editor.css',
})
export class Editor {
  readonly archivos = model.required<ArchivoEditor[]>();

  protected readonly indiceActivo = signal(0);
  protected readonly activo = computed(
    () => this.archivos()[Math.min(this.indiceActivo(), this.archivos().length - 1)],
  );

  protected seleccionar(indice: number): void {
    this.indiceActivo.set(indice);
  }

  protected alEscribir(contenido: string): void {
    const indice = this.archivos().indexOf(this.activo());
    this.archivos.update((lista) =>
      lista.map((archivo, i) => (i === indice ? { ...archivo, contenido } : archivo)),
    );
  }
}
