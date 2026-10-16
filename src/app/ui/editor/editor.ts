import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  model,
  signal,
  viewChild,
} from '@angular/core';
import {
  ArchivoEditor,
  MAX_ARCHIVOS,
  contarLineas,
  insertarSangria,
  nombreLibre,
} from './archivos';
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

  protected readonly numeros = computed(() =>
    Array.from({ length: contarLineas(this.activo().contenido) }, (_, i) => i + 1).join('\n'),
  );

  private readonly margen = viewChild.required<ElementRef<HTMLElement>>('margen');
  private readonly campoNombre = viewChild<ElementRef<HTMLInputElement>>('campo');

  constructor() {
    // Al pasar a renombrar, el foco va al campo con el nombre seleccionado.
    effect(() => {
      const campo = this.campoNombre()?.nativeElement;
      campo?.focus();
      campo?.select();
    });
  }

  // Los números de línea acompañan el scroll vertical del textarea.
  protected sincronizarScroll(textarea: HTMLTextAreaElement): void {
    this.margen().nativeElement.scrollTop = textarea.scrollTop;
  }

  // Tab inserta espacios. Para no atrapar el foco del teclado: Esc y después Tab sale del editor.
  private tabLibre = false;

  protected alPresionarTecla(evento: KeyboardEvent, textarea: HTMLTextAreaElement): void {
    if (evento.key === 'Escape') {
      this.tabLibre = true;
      return;
    }
    if (evento.key !== 'Tab' || evento.shiftKey || this.tabLibre) {
      this.tabLibre = false;
      return;
    }
    evento.preventDefault();
    const { texto, cursor } = insertarSangria(
      textarea.value,
      textarea.selectionStart,
      textarea.selectionEnd,
    );
    textarea.value = texto;
    textarea.setSelectionRange(cursor, cursor);
    this.alEscribir(texto);
  }

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
