import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';
import { esperar, leerToken, prefiereMenosMovimiento } from '../../core/movimiento';
import { hexARgb } from '../plancton/plancton';

interface Burbuja {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  oscilacion: number;
  vida: number;
  desgaste: number;
  color: [number, number, number];
}

interface Punto {
  x: number;
  y: number;
}

// Celebración de éxito: burbujas luminosas que suben desde el botón, un anillo de luz
// que se expande y un check que se dibuja con brillo.
@Component({
  selector: 'fx-celebracion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #lienzo></canvas>
    @if (centro(); as c) {
      <div class="centro" [style.left.px]="c.x" [style.top.px]="c.y">
        <span class="anillo"></span>
        <span class="anillo anillo--2"></span>
        <svg class="check" viewBox="0 0 64 64">
          <circle class="check__circulo" cx="32" cy="32" r="28" pathLength="100" />
          <path class="check__trazo" d="M20 33.5l8.5 8.5L45 25" pathLength="100" />
        </svg>
      </div>
    }
  `,
  styleUrl: './celebracion.css',
  host: { 'aria-hidden': 'true' },
})
export class Celebracion {
  protected readonly centro = signal<Punto | null>(null);
  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');

  // Se resuelve cuando la celebración terminó y se puede navegar.
  async lanzar(origen: Punto, centro: Punto): Promise<void> {
    this.centro.set(centro);
    if (prefiereMenosMovimiento()) {
      await esperar(700);
      return;
    }
    await Promise.all([this.burbujas(origen), esperar(1300)]);
  }

  private burbujas(origen: Punto): Promise<void> {
    const lienzo = this.lienzo().nativeElement;
    const ctx = lienzo.getContext('2d');
    if (!ctx) return Promise.resolve();

    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    lienzo.width = Math.round(innerWidth * dpr);
    lienzo.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colores = [hexARgb(leerToken('--color-brillo')), hexARgb(leerToken('--color-brillo-2'))];
    const mezcla = (leerToken('--mezcla-luz') || 'source-over') as GlobalCompositeOperation;
    const burbujas: Burbuja[] = Array.from({ length: innerWidth < 600 ? 45 : 80 }, () => ({
      x: origen.x + (Math.random() - 0.5) * 120,
      y: origen.y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 4.5,
      vy: -2 - Math.random() * 7,
      r: 3 + Math.random() * 10,
      oscilacion: Math.random() * Math.PI * 2,
      vida: 1,
      desgaste: 0.008 + Math.random() * 0.01,
      color: colores[Math.random() < 0.7 ? 0 : 1],
    }));

    return new Promise((resolver) => {
      let ultimo = performance.now();
      const paso = (t: number) => {
        const dt = Math.min((t - ultimo) / 16.67, 3);
        ultimo = t;
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        ctx.globalCompositeOperation = mezcla;

        let vivas = 0;
        for (const b of burbujas) {
          if (b.vida <= 0) continue;
          vivas++;
          b.vy -= 0.05 * dt;
          b.vy *= 0.985;
          b.vx *= 0.97;
          b.x += (b.vx + Math.sin(t * 0.008 + b.oscilacion) * 0.7) * dt;
          b.y += b.vy * dt;
          b.vida -= b.desgaste * dt;

          const [r, g, bl] = b.color;
          const alfa = Math.max(b.vida, 0);
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${bl}, ${alfa * 0.18})`;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = `rgba(${r}, ${g}, ${bl}, ${alfa * 0.9})`;
          ctx.stroke();
          // Reflejo de la burbuja.
          ctx.beginPath();
          ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alfa * 0.8})`;
          ctx.fill();
        }

        if (vivas > 0) {
          requestAnimationFrame(paso);
        } else {
          ctx.clearRect(0, 0, innerWidth, innerHeight);
          resolver();
        }
      };
      requestAnimationFrame(paso);
    });
  }
}
