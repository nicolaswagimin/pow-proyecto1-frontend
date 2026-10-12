import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { APP_NOMBRE } from '../../config';
import { leerToken } from '../../core/movimiento';
import { Diagrama } from '../../diagrama/diagrama';
import { Leyenda } from '../../diagrama/leyenda';
import { AristaDiagrama, NodoDiagrama } from '../../diagrama/modelo';
import { Alert } from '../../ui/alert/alert';
import { Avatar } from '../../ui/avatar/avatar';
import { Button } from '../../ui/button/button';
import { Codigo, LineaCodigo } from '../../ui/codigo/codigo';
import { Icon, NombreIcono } from '../../ui/icon/icon';
import { PasswordField } from '../../ui/password-field/password-field';
import { TextField } from '../../ui/text-field/text-field';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';

const COLORES = [
  '--color-fondo',
  '--color-superficie',
  '--color-reticula',
  '--color-reticula-mayor',
  '--color-texto',
  '--color-texto-suave',
  '--color-borde',
  '--color-lapiz',
  '--color-primario',
  '--color-primario-contraste',
  '--color-error',
  '--color-exito',
  '--color-aviso',
  '--color-foco',
];

// Una muestra de cada forma de la notación y de cada estado.
const FORMAS: NodoDiagrama[] = [
  { id: 'p', titulo: 'Persona', tipo: 'Persona', forma: 'persona', x: 0, y: 0, ancho: 120 },
  {
    id: 'c',
    titulo: 'Componente',
    tipo: 'Componente: Angular',
    forma: 'componente',
    x: 220,
    y: 0,
    ancho: 190,
    filas: [
      { id: 'a', texto: 'vacia = ""', estado: 'vacia' },
      { id: 'b', texto: 'llena = "ana@"', estado: 'llena' },
      { id: 'c', texto: 'ok = "ana@correo.com"', estado: 'ok' },
      { id: 'd', texto: 'error = "ana@"', estado: 'error' },
    ],
  },
  {
    id: 's',
    titulo: 'Contenedor',
    tipo: 'Contenedor: Express',
    forma: 'contenedor',
    x: 0,
    y: 190,
    ancho: 170,
    detalle: 'POST /api/auth/login',
    estado: 'trabajando',
  },
  {
    id: 'd',
    titulo: 'Base de datos',
    tipo: 'Tabla: PostgreSQL',
    forma: 'base-datos',
    x: 240,
    y: 190,
    ancho: 170,
    detalle: 'SELECT … WHERE email',
    estado: 'ok',
    marca: '✓',
  },
  {
    id: 'e',
    titulo: 'Sistema externo',
    tipo: 'Sistema externo',
    forma: 'externo',
    x: 0,
    y: 320,
    ancho: 170,
    estado: 'caido',
    marca: 'sin respuesta',
  },
  {
    id: 'x',
    titulo: 'Con error',
    tipo: 'Contenedor',
    forma: 'contenedor',
    x: 240,
    y: 320,
    ancho: 170,
    estado: 'error',
    marca: '401',
  },
];

const ARISTAS: AristaDiagrama[] = [
  { id: 'l', de: 'p', a: 'c', estado: 'lapiz', etiqueta: 'pendiente' },
  { id: 't', de: 'c', a: 'd', estado: 'tinta', etiqueta: 'confirmada' },
  { id: 'r', de: 's', a: 'e', estado: 'error', etiqueta: 'falló' },
];

const CODIGO: LineaCodigo[] = [
  { texto: '// La línea activa es la del campo enfocado' },
  { texto: "email: ['', [required, email]],", id: 'email' },
  { texto: "password: ['', required],", id: 'password' },
];

// Guía de estilo viva: tokens, notación y cada componente en todos sus estados. No se enlaza desde la app.
@Component({
  selector: 'app-guia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Diagrama,
    Leyenda,
    Alert,
    Avatar,
    Button,
    Codigo,
    Icon,
    PasswordField,
    TextField,
    ThemeToggle,
  ],
  templateUrl: './guia.html',
  styleUrl: './guia.css',
})
export class Guia {
  protected readonly nombreApp = APP_NOMBRE;
  protected readonly colores = signal(COLORES.map((nombre) => ({ nombre, valor: '' })));
  protected readonly escala = [
    '--text-3xl',
    '--text-2xl',
    '--text-xl',
    '--text-lg',
    '--text-base',
    '--text-sm',
    '--text-xs',
  ];
  protected readonly iconos: NombreIcono[] = [
    'correo',
    'candado',
    'usuario',
    'alerta',
    'check',
    'info',
    'salir',
    'chispa',
    'papelera',
    'recargar',
    'mas',
    'mayus',
  ];
  protected readonly formas = FORMAS;
  protected readonly aristas = ARISTAS;
  protected readonly codigo = CODIGO;

  protected readonly vacio = new FormControl('', { nonNullable: true });
  protected readonly conValor = new FormControl('ana@ejemplo.com', { nonNullable: true });
  protected readonly conError = new FormControl('ana@', { nonNullable: true });
  protected readonly deshabilitado = new FormControl(
    { value: 'No editable', disabled: true },
    { nonNullable: true },
  );
  protected readonly clave = new FormControl('Trazado2026!', { nonNullable: true });
  protected readonly cargando = signal(false);

  private readonly muestra = viewChild.required<Diagrama>('muestra');

  constructor() {
    inject(Title).setTitle(`Guía de diseño · ${APP_NOMBRE}`);
    afterNextRender(() => this.leerColores());
  }

  // El tema cambia dentro de una View Transition: se espera un momento antes de releer los tokens.
  protected releerColores(): void {
    setTimeout(() => this.leerColores(), 300);
  }

  private leerColores(): void {
    this.colores.set(COLORES.map((nombre) => ({ nombre, valor: leerToken(nombre) })));
  }

  protected demoCarga(): void {
    this.cargando.set(true);
    setTimeout(() => this.cargando.set(false), 2200);
  }

  protected demoRecorrido(): void {
    this.muestra().recorrer(['l', 't']);
  }
}
