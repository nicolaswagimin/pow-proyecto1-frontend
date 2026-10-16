import { ChangeDetectionStrategy, Component, computed, model, signal } from '@angular/core';
import { ArchivoEditor, MAX_ARCHIVOS, nombreLibre } from './archivos';
import { Icon } from '../icon/icon';

// Editor de código liviano: una pestaña por archivo y un textarea con la tipografía de código.
// Sin CodeMirror ni Monaco a propósito (ver docs/decisiones/0005-editor-textarea-propio.md).
@Component({
  selector: 'ui-editor',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './editor.html',
  styleUrl: './editor.css',
})
export class Editor {
  readonly archivos = model.required<ArchivoEditor[]>();

  protected readonly MAX_ARCHIVOS = MAX_ARCHIVOS;
  protected readonly indiceActivo = signal(0);
  // Pestaña cuyo nombre se está editando (doble clic).
  protected readonly renombrando = signal<number | null>(null);
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

  protected agregar(): void {
    if (this.archivos().length >= MAX_ARCHIVOS) return;
    const nombre = nombreLibre(this.archivos().map((a) => a.nombre));
    this.archivos.update((lista) => [...lista, { nombre, contenido: '' }]);
    this.indiceActivo.set(this.archivos().length - 1);
  }

  protected quitar(indice: number): void {
    if (this.archivos().length <= 1) return;
    this.archivos.update((lista) => lista.filter((_, i) => i !== indice));
    this.indiceActivo.update((activo) => (activo >= indice ? Math.max(0, activo - 1) : activo));
  }

  protected renombrar(indice: number, nombre: string): void {
    const limpio = nombre.trim();
    if (limpio) {
      this.archivos.update((lista) =>
        lista.map((archivo, i) => (i === indice ? { ...archivo, nombre: limpio } : archivo)),
      );
    }
    this.renombrando.set(null);
  }
}
