import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TemaService } from '../../core/tema.service';

// La lámpara de la mesa de trazado: encendida en modo claro, apagada en modo oscuro.
@Component({
  selector: 'ui-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="tema"
      [class.tema--oscuro]="oscuro()"
      [attr.aria-label]="oscuro() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      (click)="alternar()"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path class="cono" d="M15.2 10.6 21 19.5H9.4Z" />
        <path d="M4 21h9M7 21v-3.5L5 9.5l6.5-4.8" />
        <path d="m11.5 4.7 5.6 4.5-3.6 2.6-3.4-5.5Z" />
        <circle cx="5" cy="9.5" r="1.4" />
      </svg>
    </button>
  `,
  styleUrl: './theme-toggle.css',
})
export class ThemeToggle {
  private readonly temaService = inject(TemaService);
  protected readonly oscuro = computed(() => this.temaService.tema() === 'oscuro');

  protected alternar(): void {
    this.temaService.alternar();
  }
}
