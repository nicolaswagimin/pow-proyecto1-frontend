import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { ErrorInterfaz, mapearErrorGrpc } from '../../core/errores';
import { DiffVista, calcularDiff } from '../../diagrama/diff';
import { TipoSoportado } from '../../diagrama/tipos';
import { validarDiagrama } from '../../diagrama/validar';
import { VistaDiff } from '../../diagrama/vistas';
import { Diagram, DiagramType } from '../../gen/codetodiagram/v1/diagram_pb';
import { DiagramasService } from '../../services/diagramas.service';
import { ArchivoEditor } from '../../ui/editor/archivos';

export type EstadoEspacio = 'vacio' | 'generando' | 'listo' | 'error';

// Pausa al escribir antes de regenerar, y mínimo entre dos regeneraciones automáticas: ahorran
// llamadas a Gemini (límite de 60 cada 15 minutos por usuario).
export const DEBOUNCE_MS = 2000;
export const MIN_INTERVALO_MS = 5000;
// Render (plan gratuito) tarda hasta un minuto en despertar: 3 reintentos espaciados.
export const REINTENTOS_DESPERTAR = 3;
export const ESPERA_DESPERTAR_MS = 8000;

// Estado y lógica del espacio de trabajo de /app: código, generación reactiva, diff e historial.
// Se provee en el componente de la página, así cada visita empieza limpia.
@Injectable()
export class EspacioTrabajo {
  private readonly servicio = inject(DiagramasService);

  readonly archivos = signal<ArchivoEditor[]>([{ nombre: 'index.js', contenido: '' }]);
  readonly tipo = signal<TipoSoportado>(DiagramType.ARCHITECTURE);
  readonly pregunta = signal('');

  readonly estado = signal<EstadoEspacio>('vacio');
  readonly progreso = signal('');
  readonly error = signal<ErrorInterfaz | null>(null);
  readonly antes = signal<Diagram | null>(null);
  readonly despues = signal<Diagram | null>(null);
  readonly diff = signal<DiffVista | null>(null);
  readonly vista = signal<VistaDiff>('despues');
  readonly guardadoId = signal<number | null>(null);

  private secuencia = 0;
  private control: AbortController | null = null;
  private temporizador: ReturnType<typeof setTimeout> | undefined;
  private ultimaClave: string | null = null;
  private ultimaAutomatica = -Infinity;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.temporizador);
      this.control?.abort();
    });
  }

  // Lo que define un diagrama: si no cambió, no hace falta pedir otro.
  private clave(): string {
    return JSON.stringify([this.archivos(), this.tipo(), this.pregunta().trim()]);
  }

  // Se llama en cada cambio del código, el tipo o la pregunta. Solo regenera solo cuando ya hay
  // un diagrama (el primero se pide con el botón Generar).
  alEditar(): void {
    clearTimeout(this.temporizador);
    if (!this.despues()) return;
    this.temporizador = setTimeout(() => this.intentarAutomatica(), DEBOUNCE_MS);
  }

  private intentarAutomatica(): void {
    if (this.clave() === this.ultimaClave) return;
    const espera = this.ultimaAutomatica + MIN_INTERVALO_MS - Date.now();
    if (espera > 0) {
      this.temporizador = setTimeout(() => this.intentarAutomatica(), espera);
      return;
    }
    this.ultimaAutomatica = Date.now();
    void this.generar();
  }

  reintentar(): Promise<void> {
    return this.generar();
  }

  async generar(): Promise<void> {
    clearTimeout(this.temporizador);
    this.control?.abort();
    const control = new AbortController();
    this.control = control;
    const numero = ++this.secuencia;
    const vigente = () => numero === this.secuencia;

    this.ultimaClave = this.clave();
    this.estado.set('generando');
    this.error.set(null);
    this.progreso.set('Enviando el código…');

    // El diagrama anterior solo sirve de base si es del mismo tipo.
    const actual = this.despues();
    const previo = actual && actual.type === this.tipo() ? actual : undefined;
    const peticion = {
      files: this.archivos().map((a) => ({ name: a.nombre, content: a.contenido })),
      type: this.tipo(),
      question: this.pregunta().trim(),
      previous: previo,
    };

    for (let intento = 0; ; intento++) {
      try {
        let recibido: Diagram | undefined;
        for await (const respuesta of this.servicio.stream(peticion, control.signal)) {
          if (!vigente()) return;
          const evento = respuesta.event;
          if (evento.case === 'progress') this.progreso.set(evento.value.message);
          if (evento.case === 'diagram') recibido = evento.value;
        }
        if (!vigente()) return;
        this.aplicar(recibido, previo);
        return;
      } catch (err) {
        if (!vigente()) return;
        const problema = mapearErrorGrpc(err);
        if (!problema) return; // cancelada
        if (problema.despertando && intento < REINTENTOS_DESPERTAR) {
          this.progreso.set(
            `El servidor está despertando, reintentando (${intento + 1}/${REINTENTOS_DESPERTAR})…`,
          );
          await esperar(ESPERA_DESPERTAR_MS);
          if (!vigente()) return;
          continue;
        }
        this.fallar(
          problema.despertando
            ? {
                mensaje:
                  'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
              }
            : problema,
        );
        return;
      }
    }
  }

  // Segunda capa de validación: si el diagrama no pasa, no se dibuja y se conserva el anterior.
  private aplicar(recibido: Diagram | undefined, previo: Diagram | undefined): void {
    const validacion = validarDiagrama(recibido);
    if (!validacion.ok) {
      this.fallar({ mensaje: `El diagrama recibido no es válido: ${validacion.errores[0]}` });
      return;
    }
    this.antes.set(previo ?? null);
    this.diff.set(previo ? calcularDiff(previo, validacion.diagrama) : null);
    this.despues.set(validacion.diagrama);
    this.vista.set('despues');
    this.guardadoId.set(null);
    this.estado.set('listo');
  }

  private fallar(error: ErrorInterfaz): void {
    this.error.set(error);
    this.estado.set('error');
  }
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}
