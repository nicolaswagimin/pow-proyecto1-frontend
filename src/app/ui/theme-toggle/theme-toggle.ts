import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TemaService } from '../../core/tema.service';

// La luna se hunde en el agua y sale el sol (o al revés), con una onda en la superficie.
@Component({
  selector: 'ui-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="tema"
      [class.tema--oscuro]="oscuro()"
      [attr.aria-label]="oscuro() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      (click)="alternar($event)"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <defs>
          <clipPath [attr.id]="idRecorte">
            <rect x="0" y="0" width="32" height="21" />
          </clipPath>
        </defs>
        <g [attr.clip-path]="'url(#' + idRecorte + ')'">
          <g class="sol">
            <circle cx="16" cy="15" r="5" />
            <path
              d="M16 5.5v2M16 22.5v2M6.5 15h2M23.5 15h2M9.3 8.3l1.4 1.4M21.3 20.3l1.4 1.4M9.3 21.7l1.4-1.4M21.3 9.7l1.4-1.4"
            />
          </g>
          <g class="luna">
            <path d="M19.5 9.2a6.5 6.5 0 1 0 3.3 11.6A7.5 7.5 0 0 1 19.5 9.2Z" />
          </g>
        </g>
        <path
          class="agua"
          d="M3 23.5c2.2-1.6 4.3-1.6 6.5 0s4.3 1.6 6.5 0 4.3-1.6 6.5 0 4.3 1.6 6.5 0"
        />
        <ellipse class="onda" cx="16" cy="23.5" rx="5" ry="1.4" />
      </svg>
    </button>
  `,
  styleUrl: './theme-toggle.css',
})
export class ThemeToggle {
  private readonly temaService = inject(TemaService);
  protected readonly oscuro = computed(() => this.temaService.tema() === 'oscuro');
  protected readonly idRecorte = `recorte-tema-${Math.random().toString(36).slice(2, 8)}`;

  protected alternar(evento: MouseEvent): void {
    const caja = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    this.temaService.alternar({ x: caja.left + caja.width / 2, y: caja.top + caja.height / 2 });
  }
}
