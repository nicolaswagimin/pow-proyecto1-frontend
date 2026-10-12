import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ETIQUETAS_FUERZA, calcularFuerza, pistaFuerza } from '../../core/fuerza';

// Medidor de fortaleza: una regla de dibujo con cuatro tramos que se entintan según el nivel.
@Component({
  selector: 'ui-strength-meter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="regla" aria-hidden="true">
      @for (tramo of tramos; track tramo) {
        <span class="tramo" [class.tramo--lleno]="nivel() >= tramo"></span>
      }
    </div>
    <p class="texto" aria-live="polite">
      @if (nivel() > 0) {
        <strong>Fortaleza: {{ etiqueta() }}.</strong> {{ pista() }}
      }
    </p>
  `,
  styleUrl: './strength-meter.css',
  host: { '[attr.data-nivel]': 'nivel()' },
})
export class StrengthMeter {
  readonly password = input('');

  protected readonly tramos = [1, 2, 3, 4];
  protected readonly nivel = computed(() => calcularFuerza(this.password()));
  protected readonly etiqueta = computed(() => ETIQUETAS_FUERZA[this.nivel()]);
  protected readonly pista = computed(() => pistaFuerza(this.password(), this.nivel()));
}
