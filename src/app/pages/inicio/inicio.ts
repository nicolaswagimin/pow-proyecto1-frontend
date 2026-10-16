import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { APP_NOMBRE } from '../../config';
import { AuthService } from '../../core/auth.service';
import { Diagrama } from '../../diagrama/diagrama';
import { layoutArquitectura, vistaDiff } from '../../diagrama/layout-arquitectura';
import { DiagramaSecuencia } from '../../diagrama/secuencia/secuencia';
import { layoutSecuencia, vistaDiffSecuencia } from '../../diagrama/secuencia/layout-secuencia';
import { TIPOS_DIAGRAMA, TipoSoportado } from '../../diagrama/tipos';
import { VistaDiff } from '../../diagrama/vistas';
import { DiagramType } from '../../gen/codetodiagram/v1/diagram_pb';
import { Alert } from '../../ui/alert/alert';
import { Avatar } from '../../ui/avatar/avatar';
import { Button } from '../../ui/button/button';
import { Editor } from '../../ui/editor/editor';
import { ArchivoEditor } from '../../ui/editor/archivos';
import { Icon } from '../../ui/icon/icon';
import { TextField } from '../../ui/text-field/text-field';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';
import { EspacioTrabajo } from './espacio-trabajo';

// /app: el espacio de trabajo. Código a la izquierda, diagrama a la derecha. La lógica vive en
// EspacioTrabajo; aquí solo se conecta con la interfaz.
@Component({
  selector: 'app-inicio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Alert,
    Avatar,
    Button,
    Diagrama,
    DiagramaSecuencia,
    Editor,
    Icon,
    TextField,
    ThemeToggle,
  ],
  providers: [EspacioTrabajo],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly espacio = inject(EspacioTrabajo);

  protected readonly nombreApp = APP_NOMBRE;
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
    return { tipo: 'arquitectura' as const, ...layout };
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

  protected salir(): void {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
