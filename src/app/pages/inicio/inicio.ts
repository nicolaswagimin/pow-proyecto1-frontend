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
import { layoutArquitectura } from '../../diagrama/layout-arquitectura';
import { DiagramaSecuencia } from '../../diagrama/secuencia/secuencia';
import { layoutSecuencia } from '../../diagrama/secuencia/layout-secuencia';
import { TIPOS_DIAGRAMA, TipoSoportado } from '../../diagrama/tipos';
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

  protected readonly generando = computed(() => this.espacio.estado() === 'generando');

  // Lo que se dibuja: el diagrama actual con el layout de su tipo.
  protected readonly dibujo = computed(() => {
    const diagrama = this.espacio.despues();
    if (!diagrama) return null;
    if (diagrama.type === DiagramType.SEQUENCE) {
      return { tipo: 'secuencia' as const, secuencia: layoutSecuencia(diagrama) };
    }
    return { tipo: 'arquitectura' as const, ...layoutArquitectura(diagrama) };
  });

  protected readonly descripcionDibujo = computed(() => {
    const diagrama = this.espacio.despues();
    return diagrama ? `${diagrama.title}. ${diagrama.description}` : '';
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
