import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icon, NombreIcono } from '../icon/icon';

let contador = 0;

@Component({
  selector: 'ui-text-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './text-field.html',
  styleUrl: './campo.css',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextField), multi: true },
  ],
})
export class TextField implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly tipo = input<'text' | 'email'>('text');
  readonly autocomplete = input('off');
  readonly icono = input<NombreIcono | null>(null);
  readonly ayuda = input<string | null>(null);
  // Mensaje de error ya traducido; lo decide el formulario (se muestra solo si hay texto).
  readonly error = input<string | null>(null);
  readonly multilinea = input(false, { transform: booleanAttribute });
  readonly opcional = input(false, { transform: booleanAttribute });
  readonly maxlength = input<number | null>(null);
  // Nombre del control en el código (por ejemplo "email"): se muestra junto al label y enlaza el
  // campo con su fila en el diagrama.
  readonly clave = input<string | null>(null);
  // Avisa cuando el campo gana o pierde el foco (el diagrama resalta su fila).
  readonly enfoque = output<boolean>();

  protected readonly id = `campo-${++contador}`;
  protected readonly valor = signal('');
  protected readonly enfocado = signal(false);
  protected readonly deshabilitado = signal(false);
  protected readonly describedBy = computed(() => {
    if (this.error()) return `${this.id}-error`;
    return this.ayuda() ? `${this.id}-ayuda` : null;
  });

  private readonly control =
    viewChild<ElementRef<HTMLInputElement | HTMLTextAreaElement>>('control');
  private alCambiar: (valor: string) => void = () => {};
  private alTocar: () => void = () => {};

  protected escribir(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    this.valor.set(valor);
    this.alCambiar(valor);
  }

  protected alEnfocar(): void {
    this.enfocado.set(true);
    this.enfoque.emit(true);
  }

  protected salir(): void {
    this.enfocado.set(false);
    this.enfoque.emit(false);
    this.alTocar();
  }

  enfocar(): void {
    this.control()?.nativeElement.focus();
  }

  writeValue(valor: string | null): void {
    this.valor.set(valor ?? '');
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.alCambiar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.alTocar = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado.set(deshabilitado);
  }
}
