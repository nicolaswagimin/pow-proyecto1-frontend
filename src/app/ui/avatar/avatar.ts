import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Iniciales del usuario dentro de un nodo de persona: la misma forma que usa el diagrama C4.
@Component({
  selector: 'ui-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span aria-hidden="true">{{ iniciales() }}</span>`,
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      width: var(--avatar-tamano, 44px);
      height: var(--avatar-tamano, 44px);
      border-radius: var(--radius-control);
      border: 1.5px solid var(--color-texto);
      background: var(--color-superficie);
      color: var(--color-texto);
      font-family: var(--font-codigo);
      font-weight: var(--peso-fuerte);
      font-size: calc(var(--avatar-tamano, 44px) * 0.36);
      flex-shrink: 0;
    }
  `,
})
export class Avatar {
  readonly iniciales = input.required<string>();
}
