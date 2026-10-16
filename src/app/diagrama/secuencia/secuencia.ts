import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LayoutSecuencia } from './layout-secuencia';

const ANCHO_CAJA = 150;
const ALTO_CAJA = 40;

// Diagrama de secuencia en SVG: cajas de participantes arriba, líneas de vida y mensajes
// horizontales de arriba abajo. Recibe el layout ya calculado (layout-secuencia.ts).
@Component({
  selector: 'ui-diagrama-secuencia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './secuencia.html',
  styleUrl: './secuencia.css',
})
export class DiagramaSecuencia {
  readonly layout = input.required<LayoutSecuencia>();
  // Texto para lectores de pantalla: el SVG se anuncia como una sola imagen.
  readonly descripcion = input.required<string>();

  protected readonly ANCHO_CAJA = ANCHO_CAJA;
  protected readonly ALTO_CAJA = ALTO_CAJA;

  protected readonly viewBox = computed(() => {
    const { ancho, alto } = this.layout();
    return `0 -8 ${ancho} ${alto + 8}`;
  });

  // Punta de flecha según el sentido del mensaje.
  protected punta(deX: number, aX: number, y: number): string {
    const s = Math.sign(aX - deX) || 1;
    return `M${aX - s * 7} ${y - 4}L${aX} ${y}L${aX - s * 7} ${y + 4}`;
  }
}
