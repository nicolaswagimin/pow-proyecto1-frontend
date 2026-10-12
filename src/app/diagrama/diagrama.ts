import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  ALTO_FILA,
  AristaDiagrama,
  EstadoFila,
  NodoDiagrama,
  adornos,
  altoNodo,
  contorno,
  inicioFilas,
  marco,
  margenSuperior,
  pathDe,
  punta,
  puntoEn,
  rutaArista,
} from './modelo';

const GLIFOS: Record<EstadoFila, string> = { vacia: '○', llena: '●', ok: '✓', error: '✕' };

// Diagrama de arquitectura en notación C4, dibujado en SVG sin librerías.
// Es el mismo lienzo que usará el producto: aquí lo alimentan el login, /app y /design.
@Component({
  selector: 'ui-diagrama',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './diagrama.html',
  styleUrl: './diagrama.css',
})
export class Diagrama {
  readonly nodos = input.required<NodoDiagrama[]>();
  readonly aristas = input<AristaDiagrama[]>([]);
  // Texto para lectores de pantalla: el SVG se anuncia como una sola imagen.
  readonly descripcion = input.required<string>();
  // Fila resaltada (por ejemplo, la del campo que tiene el foco).
  readonly filaActiva = input<string | null>(null);

  protected readonly caja = computed(() => marco(this.nodos()));
  protected readonly viewBox = computed(() => {
    const { x, y, ancho, alto } = this.caja();
    return `${x} ${y} ${ancho} ${alto}`;
  });

  protected readonly nodosVista = computed(() =>
    this.nodos().map((nodo) => {
      const arriba = margenSuperior(nodo);
      const inicio = inicioFilas(nodo);
      return {
        ...nodo,
        alto: altoNodo(nodo),
        contorno: contorno(nodo),
        adornos: adornos(nodo),
        arriba,
        inicioFilas: inicio,
        filasVista: (nodo.filas ?? []).map((fila, i) => ({
          ...fila,
          y: inicio + 4 + i * ALTO_FILA,
          glifo: GLIFOS[fila.estado ?? 'vacia'],
        })),
      };
    }),
  );

  protected readonly aristasVista = computed(() => {
    const porId = new Map(this.nodos().map((nodo) => [nodo.id, nodo]));
    // Las aristas que salen de filas del mismo nodo se reparten en carriles.
    const carriles = new Map<string, string[]>();
    for (const arista of this.aristas()) {
      if (!arista.deFila) continue;
      carriles.set(arista.de, [...(carriles.get(arista.de) ?? []), arista.id]);
    }
    return this.aristas().map((arista) => {
      const grupo = arista.deFila ? (carriles.get(arista.de) ?? []) : [];
      const puntos = rutaArista(arista, porId, grupo.indexOf(arista.id), grupo.length);
      const medio = puntoEn(puntos, 0.5);
      return { ...arista, puntos, d: pathDe(puntos), punta: punta(puntos), medio };
    });
  });

  protected readonly ALTO_FILA = ALTO_FILA;
}
