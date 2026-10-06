import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ETIQUETAS_FUERZA, calcularFuerza, pistaFuerza } from '../../core/fuerza';

// Medidor de fortaleza: un tubo que se llena de líquido luminoso, de magenta (débil) a cian (fuerte).
@Component({
  selector: 'ui-strength-meter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tubo" aria-hidden="true">
      <div class="liquido" [style.--llenado]="nivel() / 4">
        <span class="liquido__frio" [style.opacity]="(nivel() - 1) / 3"></span>
        <svg class="ola" viewBox="0 0 80 10" preserveAspectRatio="none">
          <path d="M0 4 Q10 0 20 4 T40 4 T60 4 T80 4 V10 H0Z" />
        </svg>
        <i class="burbuja"></i>
        <i class="burbuja"></i>
      </div>
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

  protected readonly nivel = computed(() => calcularFuerza(this.password()));
  protected readonly etiqueta = computed(() => ETIQUETAS_FUERZA[this.nivel()]);
  protected readonly pista = computed(() => pistaFuerza(this.password(), this.nivel()));
}
