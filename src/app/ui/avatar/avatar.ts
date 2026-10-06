import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Círculo con las iniciales del usuario sobre un degradado de las dos luces del tema.
@Component({
  selector: 'ui-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span aria-hidden="true">{{ iniciales() }}</span>`,
  styles: `
    :host {
      position: relative;
      display: inline-grid;
      place-items: center;
      width: var(--avatar-tamano, 48px);
      height: var(--avatar-tamano, 48px);
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primario), var(--color-acento));
      color: var(--color-primario-contraste);
      font-family: var(--font-display);
      font-weight: var(--peso-display);
      font-size: calc(var(--avatar-tamano, 48px) * 0.38);
      letter-spacing: 0.02em;
      box-shadow: var(--shadow-brillo);
      flex-shrink: 0;
    }
    :host::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: inherit;
      border: 2px solid color-mix(in srgb, var(--color-brillo) 60%, transparent);
      animation: halo 2.8s var(--easing-suave) infinite;
    }
    @keyframes halo {
      0% {
        transform: scale(0.95);
        opacity: 0.9;
      }
      100% {
        transform: scale(1.35);
        opacity: 0;
      }
    }
  `,
})
export class Avatar {
  readonly iniciales = input.required<string>();
}
