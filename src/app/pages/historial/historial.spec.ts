import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { create } from '@bufbuild/protobuf';
import { Code, ConnectError } from '@connectrpc/connect';
import { DiagramType, SavedDiagramSummarySchema } from '../../gen/codetodiagram/v1/diagram_pb';
import { DiagramasService } from '../../services/diagramas.service';
import { Historial } from './historial';

const resumen = (id: number, title: string) =>
  create(SavedDiagramSummarySchema, { id, title, type: DiagramType.ARCHITECTURE, nodeCount: 3 });

async function montar(servicio: Partial<Record<'listar' | 'eliminar', ReturnType<typeof vi.fn>>>) {
  TestBed.configureTestingModule({
    imports: [Historial],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      { provide: DiagramasService, useValue: servicio },
    ],
  });
  const fixture = TestBed.createComponent(Historial);
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, html: () => (fixture.nativeElement as HTMLElement).textContent ?? '' };
}

// jsdom no implementa matchMedia; lo usa el selector de tema de la barra.
beforeAll(() => {
  window.matchMedia ??= ((consulta: string) => ({
    matches: false,
    media: consulta,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
});

describe('Historial', () => {
  it('muestra los diagramas guardados', async () => {
    const { html } = await montar({
      listar: vi.fn().mockResolvedValue({ diagrams: [resumen(1, 'Login'), resumen(2, 'Pagos')] }),
    });
    expect(html()).toContain('Login');
    expect(html()).toContain('Pagos');
  });

  it('sin diagramas muestra el estado vacío', async () => {
    const { html } = await montar({ listar: vi.fn().mockResolvedValue({ diagrams: [] }) });
    expect(html()).toContain('Todavía no guardaste diagramas');
  });

  it('si falla la carga muestra el error', async () => {
    const { html } = await montar({
      listar: vi.fn().mockRejectedValue(new ConnectError('Sin conexión.', Code.Internal)),
    });
    expect(html()).toContain('Sin conexión.');
  });

  it('sin conexión muestra un error final, no "reintentando"', async () => {
    const { html } = await montar({ listar: vi.fn().mockRejectedValue(new ConnectError('HTTP 503', Code.Unavailable)) });
    expect(html()).toContain('No pudimos conectar');
    expect(html()).not.toContain('reintentando');
  });

  it('eliminar pide confirmación antes de borrar', async () => {
    const eliminar = vi.fn().mockResolvedValue({});
    const { fixture, html } = await montar({
      listar: vi.fn().mockResolvedValue({ diagrams: [resumen(1, 'Login')] }),
      eliminar,
    });
    const boton = (texto: string) =>
      [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((b) =>
        b.textContent?.includes(texto),
      )!;

    boton('Eliminar').click();
    fixture.detectChanges();
    expect(eliminar).not.toHaveBeenCalled();
    expect(html()).toContain('¿Eliminar «Login»?');

    boton('Sí, eliminar').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(eliminar).toHaveBeenCalledWith(1);
    expect(html()).not.toContain('¿Eliminar');
    expect(html()).toContain('Todavía no guardaste diagramas');
  });

  it('abrir lleva a /app con el id del diagrama', async () => {
    const { fixture } = await montar({
      listar: vi.fn().mockResolvedValue({ diagrams: [resumen(7, 'Login')] }),
    });
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const abrir = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Abrir'),
    )!;
    abrir.click();
    expect(navegar).toHaveBeenCalledWith(['/app'], { queryParams: { diagrama: 7 } });
  });
});
