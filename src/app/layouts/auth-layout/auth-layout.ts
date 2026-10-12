import { ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_NOMBRE } from '../../config';
import { prefiereMenosMovimiento } from '../../core/movimiento';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';

// Plantilla de acceso: la hoja con el formulario a la izquierda y el tapete con el diagrama
// a la derecha. En móvil el tapete queda como una franja entre la cabecera y el formulario.
@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ThemeToggle],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
})
export class AuthLayout {
  protected readonly nombreApp = APP_NOMBRE;
  private readonly contenido = viewChild.required<ElementRef<HTMLElement>>('contenido');

  // Error al enviar: una sacudida corta del formulario (el mensaje explica qué pasó).
  sacudir(): void {
    if (prefiereMenosMovimiento()) return;
    this.contenido().nativeElement.animate(
      [
        { transform: 'none' },
        { transform: 'translateX(-8px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-3px)' },
        { transform: 'none' },
      ],
      { duration: 280, easing: 'ease-out' },
    );
  }
}
