import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { APP_NOMBRE } from '../../config';
import { AuthService } from '../../core/auth.service';
import { mapearError } from '../../core/errores';
import { Diagrama } from '../../diagrama/diagrama';
import { Leyenda } from '../../diagrama/leyenda';
import { ApiService, Estado } from '../../services/api.service';
import { Alert } from '../../ui/alert/alert';
import { Avatar } from '../../ui/avatar/avatar';
import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';
import { TextField } from '../../ui/text-field/text-field';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';
import { aristasApp, describirApp, nodosApp } from './arquitectura-app';

@Component({
  selector: 'app-inicio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Diagrama,
    Leyenda,
    Alert,
    Avatar,
    Button,
    Icon,
    TextField,
    ThemeToggle,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly auth = inject(AuthService);

  protected readonly nombreApp = APP_NOMBRE;
  protected readonly apiUrl = environment.apiUrl;
  protected readonly usuario = this.auth.usuario;
  protected readonly primerNombre = computed(
    () => (this.usuario()?.nombre ?? '').trim().split(/\s+/)[0] || 'de nuevo',
  );

  // Estado de conexión
  protected readonly estado = signal<Estado | null>(null);
  protected readonly cargandoEstado = signal(true);
  private readonly apiHost = new URL(environment.apiUrl).host;
  protected readonly nodos = computed(() =>
    nodosApp(this.estado(), this.cargandoEstado(), this.apiHost),
  );
  protected readonly aristas = computed(() => aristasApp(this.estado(), this.cargandoEstado()));
  protected readonly descripcion = computed(() =>
    describirApp(this.estado(), this.cargandoEstado()),
  );

  // IA
  protected readonly formIA = this.fb.group({ pregunta: ['', Validators.required] });
  protected readonly respuesta = signal('');
  protected readonly pensando = signal(false);
  protected readonly errorIA = signal('');

  constructor() {
    inject(Title).setTitle(`Inicio · ${APP_NOMBRE}`);
    this.auth.refrescarUsuario();
    this.revisarEstado();
  }

  protected revisarEstado(): void {
    this.cargandoEstado.set(true);
    this.api.estado().subscribe({
      next: (estado) => {
        this.estado.set(estado);
        this.cargandoEstado.set(false);
      },
      error: () => {
        this.estado.set(null);
        this.cargandoEstado.set(false);
      },
    });
  }

  protected preguntar(): void {
    const pregunta = this.formIA.getRawValue().pregunta.trim();
    if (!pregunta || this.pensando()) return;

    this.pensando.set(true);
    this.respuesta.set('');
    this.errorIA.set('');
    this.api.preguntarIA(pregunta).subscribe({
      next: ({ respuesta }) => {
        this.respuesta.set(respuesta);
        this.pensando.set(false);
      },
      error: (err) => {
        this.errorIA.set(mapearError(err).mensaje);
        this.pensando.set(false);
      },
    });
  }

  protected salir(): void {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
