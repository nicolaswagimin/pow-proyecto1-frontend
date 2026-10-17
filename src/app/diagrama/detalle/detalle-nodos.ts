import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { Diagram } from '../../gen/codetodiagram/v1/diagram_pb';
import { etiquetaCategoria, firma } from '../layout-arquitectura';

// Panel "Detalle": cada nodo con su nombre completo y todo lo que el dibujo no alcanza a mostrar
// (descripción, archivo, atributos y métodos). Es la versión accesible de los tooltips.
@Component({
  selector: 'ui-detalle-nodos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detalle-nodos.html',
  styleUrl: './detalle-nodos.css',
})
export class DetalleNodos {
  readonly diagrama = input.required<Diagram>();
  // Id del nodo cuyo detalle se abre (por ejemplo, al hacer clic en el diagrama).
  readonly abierto = input<string | null>(null);

  protected readonly etiquetaCategoria = etiquetaCategoria;
  protected readonly firma = firma;

  private readonly raiz = inject(ElementRef<HTMLElement>);

  constructor() {
    effect(() => {
      const id = this.abierto();
      if (!id) return;
      const elemento = this.raiz.nativeElement.querySelector(`[data-id="${CSS.escape(id)}"]`);
      elemento?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    });
  }
}
