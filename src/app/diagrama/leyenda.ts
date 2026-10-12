import { ChangeDetectionStrategy, Component } from '@angular/core';

// Leyenda de la notación: qué significa cada trazo de arista. El texto es la información; el
// trazo de muestra es solo la referencia visual.
@Component({
  selector: 'ui-leyenda',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul>
      <li>
        <svg viewBox="0 0 32 8" aria-hidden="true"><path class="lapiz" d="M1 4h30" /></svg>
        Pendiente
      </li>
      <li>
        <svg viewBox="0 0 32 8" aria-hidden="true"><path class="tinta" d="M1 4h30" /></svg>
        Confirmada
      </li>
      <li>
        <svg viewBox="0 0 32 8" aria-hidden="true">
          <path class="error" d="M1 4h11M20 4h11M13 1l6 6m0-6-6 6" />
        </svg>
        Falló
      </li>
    </ul>
  `,
  styles: `
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2) var(--space-5);
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--text-xs);
      color: var(--color-texto-suave);
    }
    li {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }
    svg {
      width: 32px;
      height: 8px;
      fill: none;
      stroke-linecap: round;
      overflow: visible;
    }
    .lapiz {
      stroke: var(--color-lapiz);
      stroke-width: 1.25;
      stroke-dasharray: 3 4;
    }
    .tinta {
      stroke: var(--color-primario);
      stroke-width: 2;
    }
    .error {
      stroke: var(--color-error);
      stroke-width: 2;
    }
  `,
})
export class Leyenda {}
