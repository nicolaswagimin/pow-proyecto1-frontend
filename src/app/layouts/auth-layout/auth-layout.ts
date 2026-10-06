import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_NOMBRE } from '../../config';
import { esTactil, esperar, prefiereMenosMovimiento } from '../../core/movimiento';
import { Celebracion } from '../../fx/celebracion/celebracion';
import { Plancton } from '../../fx/plancton/plancton';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';

const RESORTE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const SALIDA = 'cubic-bezier(0.16, 1, 0.3, 1)';
const ENTRADA = 'cubic-bezier(0.7, 0, 0.84, 0)';
const GOTA_1 = '46px 30px 52px 34px / 36px 50px 30px 48px';
const GOTA_2 = '30px 48px 34px 52px / 50px 34px 46px 30px';

// Plantilla de las pantallas de acceso: océano de plancton, olas de luz y una tarjeta de vidrio
// con luz cáustica que sigue al cursor. Expone las animaciones de la tarjeta a la página.
@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Plancton, ThemeToggle, Celebracion],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
  host: {
    '[class.pausado]': 'pausado()',
    '[class.tactil]': 'tactil',
  },
})
export class AuthLayout {
  protected readonly nombreApp = APP_NOMBRE;
  protected readonly tactil = esTactil();
  protected readonly pausado = signal(false);
  protected readonly cascada = signal(true);

  private readonly tarjeta = viewChild.required<ElementRef<HTMLElement>>('tarjeta');
  private readonly forma = viewChild.required<ElementRef<HTMLElement>>('forma');
  private readonly contenido = viewChild.required<ElementRef<HTMLElement>>('contenido');
  private readonly luz = viewChild.required<ElementRef<HTMLElement>>('luz');
  private readonly bordeLuz = viewChild.required<ElementRef<HTMLElement>>('bordeLuz');
  private readonly destello = viewChild.required<ElementRef<HTMLElement>>('destello');
  private readonly celebracion = viewChild.required(Celebracion);
  private readonly injector = inject(Injector);
  private cuadroLuz = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    // Olas en pausa cuando la pestaña no se ve.
    const alCambiarVisibilidad = () => this.pausado.set(document.hidden);
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    // Al terminar la entrada orquestada se quita la cascada inicial.
    const fin = setTimeout(() => this.cascada.set(false), 1600);
    destroyRef.onDestroy(() => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      clearTimeout(fin);
      cancelAnimationFrame(this.cuadroLuz);
    });
  }

  // La luz cáustica y el brillo del borde siguen al cursor (solo con mouse, dentro de un rAF).
  protected moverLuz(evento: PointerEvent): void {
    if (this.tactil || evento.pointerType !== 'mouse') return;
    const caja = this.tarjeta().nativeElement.getBoundingClientRect();
    const x = evento.clientX - caja.left;
    const y = evento.clientY - caja.top;
    cancelAnimationFrame(this.cuadroLuz);
    this.cuadroLuz = requestAnimationFrame(() => {
      const posicion = `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0)`;
      this.luz().nativeElement.style.transform = posicion;
      this.bordeLuz().nativeElement.style.transform = posicion;
    });
  }

  // Morph líquido entre login y registro. `cambiar` modifica el contenido a mitad de la animación.
  async transformar(cambiar: () => void): Promise<void> {
    const tarjeta = this.tarjeta().nativeElement;
    const forma = this.forma().nativeElement;
    const contenido = this.contenido().nativeElement;

    if (prefiereMenosMovimiento()) {
      await contenido.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' })
        .finished;
      cambiar();
      await this.trasRender();
      contenido.getAnimations().forEach((a) => a.cancel());
      await contenido.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 }).finished;
      return;
    }

    // 1. El contenido sale en ola y la tarjeta se aprieta como una gota.
    const salientes = this.olas();
    const salida = salientes.map((el, i) =>
      el.animate(
        [
          { opacity: 1, transform: 'none', filter: 'blur(0)' },
          { opacity: 0, transform: 'translateY(-14px) scale(0.96)', filter: 'blur(4px)' },
        ],
        { duration: 200, delay: i * 28, easing: ENTRADA, fill: 'forwards' },
      ),
    );
    const apretar = forma.animate(
      [{ transform: 'none' }, { transform: 'scale(0.94, 1.03)', borderRadius: GOTA_1 }],
      { duration: 280, easing: SALIDA, fill: 'forwards' },
    );
    await Promise.all([...salida.map((a) => a.finished), apretar.finished]);

    const altoAntes = tarjeta.offsetHeight;
    const arribaAntes = tarjeta.getBoundingClientRect().top;
    cambiar();
    await this.trasRender();
    salida.forEach((a) => a.cancel());
    const altoDespues = tarjeta.offsetHeight;
    const arribaDespues = tarjeta.getBoundingClientRect().top;

    // 2. La gota se expande con rebote hasta su nueva altura (FLIP) y el contenido entra en ola.
    this.olas().forEach((el, i) => {
      const brota = el.hasAttribute('data-brota');
      el.animate(
        [
          brota
            ? { opacity: 0, transform: 'scale(0.4)', filter: 'blur(6px)' }
            : { opacity: 0, transform: 'translateY(18px) scale(0.96)', filter: 'blur(4px)' },
          { opacity: 1, transform: 'none', filter: 'blur(0)' },
        ],
        { duration: brota ? 620 : 460, delay: 60 + i * 45, easing: RESORTE, fill: 'backwards' },
      );
    });

    tarjeta.animate(
      [{ transform: `translateY(${arribaAntes - arribaDespues}px)` }, { transform: 'none' }],
      {
        duration: 640,
        easing: SALIDA,
      },
    );
    apretar.cancel();
    const escala = altoAntes / altoDespues;
    forma.style.transformOrigin = '50% 0';
    await forma.animate(
      [
        { transform: `scale(0.94, ${(1.03 * escala).toFixed(3)})`, borderRadius: GOTA_1 },
        { transform: 'scale(1.03, 0.985)', borderRadius: GOTA_2, offset: 0.55 },
        { transform: 'none' },
      ],
      { duration: 680, easing: SALIDA },
    ).finished;
    forma.style.transformOrigin = '';
  }

  // Error: sacudida como empujada por una corriente y un destello rojo dentro del vidrio.
  sacudir(): void {
    this.destello().nativeElement.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], {
      duration: 700,
      easing: SALIDA,
    });
    if (prefiereMenosMovimiento()) return;
    this.tarjeta().nativeElement.animate(
      [
        { transform: 'none' },
        { transform: 'translateX(-14px) rotate(-1deg)' },
        { transform: 'translateX(11px) rotate(0.8deg)' },
        { transform: 'translateX(-7px) rotate(-0.4deg)' },
        { transform: 'translateX(4px)' },
        { transform: 'none' },
      ],
      { duration: 420, easing: 'ease-out' },
    );
  }

  // Éxito: burbujas desde el botón, check en el centro de la tarjeta y la escena se funde.
  async celebrar(origen: { x: number; y: number }): Promise<void> {
    const tarjeta = this.tarjeta().nativeElement;
    const caja = tarjeta.getBoundingClientRect();
    await this.celebracion().lanzar(origen, {
      x: caja.left + caja.width / 2,
      y: caja.top + caja.height / 2,
    });
    if (prefiereMenosMovimiento()) return;
    await tarjeta.animate(
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'translateY(-24px) scale(0.94)', filter: 'blur(6px)' },
      ],
      { duration: 260, easing: ENTRADA, fill: 'forwards' },
    ).finished;
  }

  private olas(): HTMLElement[] {
    return Array.from(this.contenido().nativeElement.querySelectorAll<HTMLElement>('[data-ola]'));
  }

  // Espera a que Angular pinte el cambio de modo antes de medir la nueva altura.
  private async trasRender(): Promise<void> {
    await new Promise<void>((resolver) =>
      afterNextRender(() => resolver(), { injector: this.injector }),
    );
    await esperar(0);
  }
}
