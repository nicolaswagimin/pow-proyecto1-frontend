import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { APP_NOMBRE } from '../../config';
import { AuthService } from '../../core/auth.service';
import { ErrorInterfaz } from '../../core/errores';
import { Diagrama } from '../../diagrama/diagrama';
import { descargar, nombreArchivo, serializarSvg, svgAPng } from '../../diagrama/exportar';
import {
  anchoMinimoDibujo,
  layoutArquitectura,
  vistaDiff,
} from '../../diagrama/layout-arquitectura';
import { DiagramaSecuencia } from '../../diagrama/secuencia/secuencia';
import { layoutSecuencia, vistaDiffSecuencia } from '../../diagrama/secuencia/layout-secuencia';
import { TIPOS_DIAGRAMA, TipoSoportado } from '../../diagrama/tipos';
import { VistaDiff } from '../../diagrama/vistas';
import { DiagramType } from '../../gen/codetodiagram/v1/diagram_pb';
import { BarraApp } from '../../layouts/barra-app/barra-app';
import { Alert } from '../../ui/alert/alert';
import { Button } from '../../ui/button/button';
import { Editor } from '../../ui/editor/editor';
import { ArchivoEditor } from '../../ui/editor/archivos';
import { Icon } from '../../ui/icon/icon';
import { TextField } from '../../ui/text-field/text-field';
import { EspacioTrabajo } from './espacio-trabajo';

// /app: el espacio de trabajo. Código a la izquierda, diagrama a la derecha. La lógica vive en
// EspacioTrabajo; aquí solo se conecta con la interfaz.
@Component({
  selector: 'app-inicio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Alert,
    BarraApp,
    Button,
    Diagrama,
    DiagramaSecuencia,
    Editor,
    Icon,
    TextField,
  ],
  providers: [EspacioTrabajo],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  protected readonly auth = inject(AuthService);
  protected readonly espacio = inject(EspacioTrabajo);

  protected readonly usuario = this.auth.usuario;
  protected readonly primerNombre = computed(
    () => (this.usuario()?.nombre ?? '').trim().split(/\s+/)[0] || 'de nuevo',
  );

  protected readonly tipos = (Object.keys(TIPOS_DIAGRAMA) as unknown as TipoSoportado[]).map(
    (valor) => ({ valor: Number(valor) as TipoSoportado, ...TIPOS_DIAGRAMA[valor] }),
  );
  protected readonly pregunta = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(300)],
  });

  protected readonly vistas: { valor: VistaDiff; etiqueta: string }[] = [
    { valor: 'antes', etiqueta: 'Antes' },
    { valor: 'despues', etiqueta: 'Después' },
    { valor: 'comparar', etiqueta: 'Comparar' },
  ];

  protected readonly generando = computed(() => this.espacio.estado() === 'generando');
  // Hay diff cuando el diagrama actual salió de editar uno anterior del mismo tipo.
  protected readonly hayDiff = computed(() => !!(this.espacio.antes() && this.espacio.diff()));

  // Lo que se dibuja: el diagrama actual (o la vista del diff elegida) con el layout de su tipo.
  protected readonly dibujo = computed(() => {
    const despues = this.espacio.despues();
    if (!despues) return null;
    const antes = this.espacio.antes();
    const diff = this.espacio.diff();
    const vista = this.espacio.vista();
    if (despues.type === DiagramType.SEQUENCE) {
      const secuencia =
        antes && diff ? vistaDiffSecuencia(vista, antes, despues, diff) : layoutSecuencia(despues);
      return { tipo: 'secuencia' as const, secuencia };
    }
    const layout =
      antes && diff ? vistaDiff(vista, antes, despues, diff) : layoutArquitectura(despues);
    return {
      tipo: 'arquitectura' as const,
      ...layout,
      anchoMinimo: anchoMinimoDibujo(layout.nodos),
    };
  });

  // "2 agregados · 1 modificado · 1 eliminado", contando nodos y conexiones.
  protected readonly resumenDiff = computed(() => {
    const diff = this.espacio.diff();
    if (!diff) return '';
    if (!diff.total) return 'Sin cambios respecto de la versión anterior.';
    const cuenta = { agregado: 0, modificado: 0, eliminado: diff.aristasEliminadas.size };
    for (const cambio of [...diff.nodos.values(), ...diff.aristas.values()]) cuenta[cambio]++;
    const partes = [
      [cuenta.agregado, 'agregado', 'agregados'],
      [cuenta.modificado, 'modificado', 'modificados'],
      [cuenta.eliminado, 'eliminado', 'eliminados'],
    ] as const;
    return partes
      .filter(([n]) => n > 0)
      .map(([n, uno, varios]) => `${n} ${n === 1 ? uno : varios}`)
      .join(' · ');
  });

  // Resultado de la última acción (guardar o exportar), mostrado bajo la cabecera del panel.
  protected readonly aviso = signal<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null);
  protected readonly exportando = signal(false);
  private readonly mesa = viewChild<ElementRef<HTMLElement>>('mesa');

  protected readonly descripcionDibujo = computed(() => {
    const diagrama = this.espacio.despues();
    if (!diagrama) return '';
    const cambios = this.hayDiff() ? ` Cambios: ${this.resumenDiff()}` : '';
    return `${diagrama.title}. ${diagrama.description}${cambios}`;
  });

  constructor() {
    inject(Title).setTitle(`Inicio · ${APP_NOMBRE}`);
    this.auth.refrescarUsuario();

    this.pregunta.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((valor) => {
      this.espacio.pregunta.set(valor);
      this.espacio.alEditar();
    });
    // /app?diagrama=<id> abre un diagrama del historial.
    const id = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('diagrama'));
    if (Number.isInteger(id) && id > 0) void this.espacio.cargarGuardado(id);

    // Un diagrama más ancho que la mesa se muestra centrado: el scroll empieza en el medio.
    const injector = inject(Injector);
    effect(() => {
      if (!this.dibujo()) return;
      afterNextRender(
        () => {
          const mesa = this.mesa()?.nativeElement;
          if (mesa) mesa.scrollLeft = (mesa.scrollWidth - mesa.clientWidth) / 2;
        },
        { injector },
      );
    });

    // Si la pregunta cambia desde fuera (al abrir un diagrama guardado), el campo la refleja.
    effect(() => {
      const valor = this.espacio.pregunta();
      if (this.pregunta.value !== valor) this.pregunta.setValue(valor, { emitEvent: false });
    });
  }

  protected alCambiarArchivos(archivos: ArchivoEditor[]): void {
    this.espacio.archivos.set(archivos);
    this.espacio.alEditar();
  }

  protected alCambiarTipo(tipo: TipoSoportado): void {
    this.espacio.tipo.set(tipo);
    this.espacio.alEditar();
  }

  protected generar(): void {
    if (this.pregunta.invalid) return;
    void this.espacio.generar();
  }

  protected async guardar(): Promise<void> {
    this.aviso.set(null);
    const error: ErrorInterfaz | null = await this.espacio.guardar();
    this.aviso.set(
      error
        ? { tipo: 'error', mensaje: error.mensaje }
        : { tipo: 'exito', mensaje: 'Guardado en tu historial.' },
    );
  }

  protected async exportar(formato: 'svg' | 'png'): Promise<void> {
    const svg = this.mesa()?.nativeElement.querySelector('svg');
    const diagrama = this.espacio.despues();
    if (!svg || !diagrama) return;
    this.aviso.set(null);
    this.exportando.set(true);
    try {
      const texto = serializarSvg(svg);
      const nombre = nombreArchivo(diagrama.title, formato);
      if (formato === 'svg') {
        descargar(new Blob([texto], { type: 'image/svg+xml' }), nombre);
      } else {
        const { width, height } = svg.viewBox.baseVal;
        descargar(await svgAPng(texto, width, height), nombre);
      }
    } catch (err) {
      this.aviso.set({ tipo: 'error', mensaje: (err as Error).message });
    } finally {
      this.exportando.set(false);
    }
  }
}
