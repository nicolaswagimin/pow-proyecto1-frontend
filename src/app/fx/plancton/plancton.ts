import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import { TemaService } from '../../core/tema.service';
import { leerToken } from '../../core/movimiento';

interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tam: number;
  fase: number;
  ritmo: number;
  alfa: number;
  sprite: number;
  // Ángulo asignado cuando la partícula forma un anillo (bienvenida).
  angulo: number | null;
}

interface OndaLuz {
  x: number;
  y: number;
  r: number;
  alfa: number;
}

const RADIO_RATON = 150;

// Fondo de plancton bioluminiscente: partículas que derivan, huyen del cursor,
// dejan estela y se empujan con una onda al hacer clic o tocar.
@Component({
  selector: 'fx-plancton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #lienzo></canvas>`,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 0;
      display: block;
      pointer-events: none;
      animation: encender 1.4s var(--easing-suave) both;
    }
    canvas {
      width: 100%;
      height: 100%;
    }
    @keyframes encender {
      from {
        opacity: 0;
      }
    }
  `,
  host: { 'aria-hidden': 'true' },
})
export class Plancton {
  // Multiplicador de la cantidad de partículas (1 = pantalla de acceso).
  readonly densidad = input(1);

  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private readonly tema = inject(TemaService);

  private ctx: CanvasRenderingContext2D | null = null;
  private particulas: Particula[] = [];
  private ondas: OndaLuz[] = [];
  private sprites: HTMLCanvasElement[] = [];
  private colorOnda = 'rgb(46 242 224)';
  private mezcla: GlobalCompositeOperation = 'lighter';
  private ancho = 0;
  private alto = 0;
  private raton = { x: 0, y: 0, activo: false };
  private anillo: { x: number; y: number; r: number; hasta: number } | null = null;
  private cuadro = 0;
  private ultimo = 0;
  private estatico = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.ctx = this.lienzo().nativeElement.getContext('2d');
      if (!this.ctx) return;

      const movimiento = matchMedia('(prefers-reduced-motion: reduce)');
      this.estatico = movimiento.matches;
      this.leerColores();
      this.redimensionar();

      let espera = 0;
      const alRedimensionar = () => {
        clearTimeout(espera);
        espera = window.setTimeout(() => this.redimensionar(), 150);
      };
      const alMover = (e: PointerEvent) => {
        this.raton = { x: e.clientX, y: e.clientY, activo: true };
      };
      const alSalir = () => (this.raton.activo = false);
      const alPulsar = (e: PointerEvent) => this.lanzarOnda(e.clientX, e.clientY);
      const alCambiarMovimiento = () => {
        this.estatico = movimiento.matches;
        this.reanudar();
      };
      // Pestaña oculta: se detiene el bucle; al volver, continúa.
      const alCambiarVisibilidad = () => this.reanudar();

      addEventListener('resize', alRedimensionar, { passive: true });
      addEventListener('pointermove', alMover, { passive: true });
      addEventListener('pointerdown', alPulsar, { passive: true });
      document.documentElement.addEventListener('pointerleave', alSalir);
      document.addEventListener('visibilitychange', alCambiarVisibilidad);
      movimiento.addEventListener('change', alCambiarMovimiento);
      this.reanudar();

      destroyRef.onDestroy(() => {
        cancelAnimationFrame(this.cuadro);
        clearTimeout(espera);
        removeEventListener('resize', alRedimensionar);
        removeEventListener('pointermove', alMover);
        removeEventListener('pointerdown', alPulsar);
        document.documentElement.removeEventListener('pointerleave', alSalir);
        document.removeEventListener('visibilitychange', alCambiarVisibilidad);
        movimiento.removeEventListener('change', alCambiarMovimiento);
      });
    });

    // Al cambiar de tema se vuelven a leer los colores de los tokens.
    effect(() => {
      this.tema.tema();
      untracked(() => {
        if (!this.ctx) return;
        this.leerColores();
        if (this.estatico) this.dibujarEstatico();
      });
    });
  }

  // Bienvenida: parte del plancton converge en un anillo alrededor de (x, y) y luego se libera.
  formarAnillo(x: number, y: number, r: number, duracion = 1600): void {
    if (this.estatico) return;
    const cantidad = Math.min(48, this.particulas.length);
    this.particulas.forEach(
      (p, i) => (p.angulo = i < cantidad ? (i / cantidad) * Math.PI * 2 : null),
    );
    this.anillo = { x, y, r, hasta: performance.now() + duracion };
  }

  private reanudar(): void {
    cancelAnimationFrame(this.cuadro);
    if (document.hidden) return;
    if (this.estatico) {
      this.dibujarEstatico();
      return;
    }
    this.ultimo = performance.now();
    this.cuadro = requestAnimationFrame((t) => this.paso(t));
  }

  private redimensionar(): void {
    const lienzo = this.lienzo().nativeElement;
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    this.ancho = innerWidth;
    this.alto = innerHeight;
    lienzo.width = Math.round(this.ancho * dpr);
    lienzo.height = Math.round(this.alto * dpr);
    this.ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Cantidad según el área: ~35 en un móvil, hasta 130 en escritorio grande.
    const objetivo = Math.round(
      Math.min(130, Math.max(34, (this.ancho * this.alto) / 9000)) * this.densidad(),
    );
    while (this.particulas.length < objetivo) this.particulas.push(this.crearParticula());
    this.particulas.length = objetivo;
    if (this.estatico) this.dibujarEstatico();
  }

  private crearParticula(): Particula {
    return {
      x: Math.random() * this.ancho,
      y: Math.random() * this.alto,
      vx: 0,
      vy: 0,
      tam: 1.4 + Math.random() * 3.2,
      fase: Math.random() * Math.PI * 2,
      ritmo: 0.6 + Math.random() * 1.4,
      alfa: 0.35 + Math.random() * 0.65,
      sprite: Math.random() < 0.72 ? 0 : 1,
      angulo: null,
    };
  }

  private lanzarOnda(x: number, y: number): void {
    if (this.estatico) return;
    this.ondas.push({ x, y, r: 4, alfa: 0.7 });
  }

  private paso(t: number): void {
    const ctx = this.ctx!;
    const dt = Math.min((t - this.ultimo) / 16.67, 3);
    this.ultimo = t;

    // Estela: se borra solo una parte del cuadro anterior.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(0, 0, this.ancho, this.alto);
    ctx.globalCompositeOperation = this.mezcla;

    if (this.anillo && t > this.anillo.hasta) this.liberarAnillo();
    const anillo = this.anillo;

    for (const p of this.particulas) {
      p.fase += 0.01 * dt;
      p.vx += Math.cos(p.fase) * 0.012 * dt;
      p.vy += (Math.sin(p.fase * 0.7) * 0.012 - 0.004) * dt;

      if (this.raton.activo) {
        const dx = p.x - this.raton.x;
        const dy = p.y - this.raton.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < RADIO_RATON * RADIO_RATON) {
          const d = Math.sqrt(d2) || 1;
          const fuerza = (1 - d / RADIO_RATON) * 0.9 * dt;
          p.vx += (dx / d) * fuerza;
          p.vy += (dy / d) * fuerza;
        }
      }

      for (const onda of this.ondas) {
        const dx = p.x - onda.x;
        const dy = p.y - onda.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const distancia = Math.abs(d - onda.r);
        if (distancia < 36) {
          const fuerza = (1 - distancia / 36) * 2.2 * onda.alfa * dt;
          p.vx += (dx / d) * fuerza;
          p.vy += (dy / d) * fuerza;
        }
      }

      if (anillo && p.angulo !== null) {
        const giro = p.angulo + t * 0.0012;
        p.vx += (anillo.x + Math.cos(giro) * anillo.r - p.x) * 0.02 * dt;
        p.vy += (anillo.y + Math.sin(giro) * anillo.r - p.y) * 0.02 * dt;
        p.vx *= 0.86;
        p.vy *= 0.86;
      }

      p.vx *= 0.96;
      p.vy *= 0.96;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.x < -20) p.x = this.ancho + 20;
      else if (p.x > this.ancho + 20) p.x = -20;
      if (p.y < -20) p.y = this.alto + 20;
      else if (p.y > this.alto + 20) p.y = -20;

      ctx.globalAlpha = p.alfa * (0.6 + 0.4 * Math.sin(t * 0.002 * p.ritmo + p.fase * 3));
      const lado = p.tam * 7;
      ctx.drawImage(this.sprites[p.sprite], p.x - lado / 2, p.y - lado / 2, lado, lado);
    }

    ctx.globalAlpha = 1;
    ctx.lineWidth = 2;
    for (const onda of this.ondas) {
      ctx.strokeStyle = this.colorOnda;
      ctx.globalAlpha = onda.alfa;
      ctx.beginPath();
      ctx.arc(onda.x, onda.y, onda.r, 0, Math.PI * 2);
      ctx.stroke();
      onda.r += 7 * dt;
      onda.alfa -= 0.016 * dt;
    }
    ctx.globalAlpha = 1;
    this.ondas = this.ondas.filter((onda) => onda.alfa > 0);

    this.cuadro = requestAnimationFrame((siguiente) => this.paso(siguiente));
  }

  private liberarAnillo(): void {
    if (!this.anillo) return;
    const { x, y } = this.anillo;
    for (const p of this.particulas) {
      if (p.angulo === null) continue;
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      p.vx += (dx / d) * 3;
      p.vy += (dy / d) * 3;
      p.angulo = null;
    }
    this.anillo = null;
  }

  // Movimiento reducido: un solo cuadro quieto, sin estelas.
  private dibujarEstatico(): void {
    const ctx = this.ctx!;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, this.ancho, this.alto);
    ctx.globalCompositeOperation = this.mezcla;
    for (const p of this.particulas) {
      ctx.globalAlpha = p.alfa * 0.8;
      const lado = p.tam * 7;
      ctx.drawImage(this.sprites[p.sprite], p.x - lado / 2, p.y - lado / 2, lado, lado);
    }
    ctx.globalAlpha = 1;
  }

  private leerColores(): void {
    const oscuro = this.tema.tema() === 'oscuro';
    const colores = [leerToken('--color-brillo'), leerToken('--color-brillo-2')];
    this.mezcla = (leerToken('--mezcla-luz') || 'source-over') as GlobalCompositeOperation;
    this.colorOnda = colores[0];
    this.sprites = colores.map((color) => crearSprite(color, oscuro));
  }
}

// Punto de luz prerenderizado: dibujar una imagen es mucho más barato que un shadowBlur por partícula.
function crearSprite(hex: string, nucleoBlanco: boolean): HTMLCanvasElement {
  const lado = 64;
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = lado;
  const ctx = sprite.getContext('2d')!;
  const [r, g, b] = hexARgb(hex);
  const degradado = ctx.createRadialGradient(lado / 2, lado / 2, 0, lado / 2, lado / 2, lado / 2);
  degradado.addColorStop(0, nucleoBlanco ? 'rgba(255, 255, 255, 1)' : `rgba(${r}, ${g}, ${b}, 1)`);
  degradado.addColorStop(0.14, `rgba(${r}, ${g}, ${b}, 0.95)`);
  degradado.addColorStop(0.38, `rgba(${r}, ${g}, ${b}, 0.28)`);
  degradado.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = degradado;
  ctx.fillRect(0, 0, lado, lado);
  return sprite;
}

export function hexARgb(hex: string): [number, number, number] {
  const limpio = hex.replace('#', '');
  const valor = parseInt(limpio.length === 3 ? [...limpio].map((c) => c + c).join('') : limpio, 16);
  return [(valor >> 16) & 255, (valor >> 8) & 255, valor & 255];
}
