import { TestBed } from '@angular/core/testing';
import { create } from '@bufbuild/protobuf';
import { Code, ConnectError } from '@connectrpc/connect';
import {
  Diagram,
  ProgressStage,
  SavedDiagramSchema,
  StreamDiagramResponse,
  StreamDiagramResponseSchema,
} from '../../gen/codetodiagram/v1/diagram_pb';
import { diagramaDePrueba } from '../../diagrama/fabrica.spec-util';
import { DiagramasService } from '../../services/diagramas.service';
import {
  DEBOUNCE_MS,
  ESPERA_DESPERTAR_MS,
  EspacioTrabajo,
  MIN_INTERVALO_MS,
} from './espacio-trabajo';

type Respuesta = Diagram | Error | (() => Promise<Diagram>);

// Servicio gRPC simulado: cada llamada a stream() consume la siguiente respuesta de la cola.
function servicioFalso(respuestas: Respuesta[]) {
  const llamadas: { previous?: Diagram; files: unknown }[] = [];
  const servicio = {
    llamadas,
    stream(req: { previous?: Diagram; files: unknown }): AsyncIterable<StreamDiagramResponse> {
      llamadas.push(req);
      const respuesta = respuestas.shift() ?? new Error('sin respuesta preparada');
      return (async function* () {
        yield create(StreamDiagramResponseSchema, {
          event: {
            case: 'progress',
            value: { stage: ProgressStage.ANALYZING, message: 'Analizando el código…' },
          },
        });
        const diagrama = typeof respuesta === 'function' ? await respuesta() : respuesta;
        if (diagrama instanceof Error) throw diagrama;
        yield create(StreamDiagramResponseSchema, { event: { case: 'diagram', value: diagrama } });
      })();
    },
    obtener: vi.fn(),
    guardar: vi.fn(),
  };
  return servicio;
}

function preparar(respuestas: Respuesta[]) {
  const servicio = servicioFalso(respuestas);
  TestBed.configureTestingModule({
    providers: [EspacioTrabajo, { provide: DiagramasService, useValue: servicio }],
  });
  const espacio = TestBed.inject(EspacioTrabajo);
  espacio.archivos.set([{ nombre: 'index.js', contenido: 'const a = 1;' }]);
  return { espacio, servicio };
}

const editar = (espacio: EspacioTrabajo, contenido: string) => {
  espacio.archivos.set([{ nombre: 'index.js', contenido }]);
  espacio.alEditar();
};

const v1 = diagramaDePrueba();
const v2 = diagramaDePrueba({ nodos: ['web', 'api', 'db', 'cache'] });
const v3 = diagramaDePrueba({ nodos: ['web', 'api'], aristas: [['c1', 'web', 'api', 'login']] });

describe('EspacioTrabajo', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('genera y deja el diagrama listo', async () => {
    const { espacio } = preparar([v1]);
    await espacio.generar();
    expect(espacio.estado()).toBe('listo');
    expect(espacio.despues()?.nodes.length).toBe(3);
    expect(espacio.diff()).toBeNull();
  });

  it('no regenera antes de 2 s', async () => {
    const { espacio, servicio } = preparar([v1, v2]);
    await espacio.generar();
    editar(espacio, 'const a = 2;');
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 1);
    expect(servicio.llamadas.length).toBe(1);
    await vi.advanceTimersByTimeAsync(MIN_INTERVALO_MS);
    expect(servicio.llamadas.length).toBe(2);
  });

  it('no regenera si el contenido no cambió', async () => {
    const { espacio, servicio } = preparar([v1, v2]);
    await espacio.generar();
    editar(espacio, 'const a = 1;');
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + MIN_INTERVALO_MS);
    expect(servicio.llamadas.length).toBe(1);
  });

  it('no regenera solo antes del primer diagrama', async () => {
    const { espacio, servicio } = preparar([v1]);
    editar(espacio, 'const a = 2;');
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + MIN_INTERVALO_MS);
    expect(servicio.llamadas.length).toBe(0);
  });

  it('respeta 5 s entre regeneraciones automáticas', async () => {
    const { espacio, servicio } = preparar([v1, v2, v3]);
    await espacio.generar();
    editar(espacio, 'const a = 2;');
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(servicio.llamadas.length).toBe(2);
    editar(espacio, 'const a = 3;');
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(servicio.llamadas.length).toBe(2); // solo pasaron 2 s desde la anterior automática
    await vi.advanceTimersByTimeAsync(MIN_INTERVALO_MS - DEBOUNCE_MS);
    expect(servicio.llamadas.length).toBe(3);
  });

  it('descarta respuestas obsoletas', async () => {
    let liberarLenta!: () => void;
    const lenta = () => new Promise<Diagram>((r) => (liberarLenta = () => r(v2)));
    const { espacio } = preparar([v1, lenta, v3]);
    await espacio.generar();
    const primera = espacio.generar(); // queda esperando a Gemini
    await vi.advanceTimersByTimeAsync(0);
    editar(espacio, 'const a = 9;');
    await espacio.generar(); // la más nueva termina antes
    liberarLenta();
    await primera;
    expect(espacio.despues()?.nodes.map((n) => n.id)).toEqual(['web', 'api']);
  });

  it('diagrama inválido deja estado error y conserva el anterior', async () => {
    const roto = diagramaDePrueba({ aristas: [['c1', 'web', 'fantasma']] });
    const { espacio } = preparar([v1, roto]);
    await espacio.generar();
    await espacio.generar();
    expect(espacio.estado()).toBe('error');
    expect(espacio.error()?.mensaje).toMatch(/no es válido/);
    expect(espacio.despues()?.nodes.length).toBe(3);
  });

  it('calcula el diff contra el diagrama previo y lo envía como previous', async () => {
    const { espacio, servicio } = preparar([v1, v2]);
    await espacio.generar();
    await espacio.generar();
    expect(servicio.llamadas[1].previous?.nodes.length).toBe(3);
    expect(espacio.antes()?.nodes.length).toBe(3);
    expect([...espacio.diff()!.nodos]).toEqual([['cache', 'agregado']]);
    expect(espacio.vista()).toBe('despues');
  });

  it('reintenta 3 veces si el servidor está despertando', async () => {
    const caido = () => new ConnectError('HTTP 503', Code.Unavailable);
    const { espacio, servicio } = preparar([caido(), caido(), caido(), v1]);
    const generando = espacio.generar();
    await vi.advanceTimersByTimeAsync(0);
    expect(espacio.progreso()).toMatch(/despertando/);
    await vi.advanceTimersByTimeAsync(ESPERA_DESPERTAR_MS * 3);
    await generando;
    expect(servicio.llamadas.length).toBe(4);
    expect(espacio.estado()).toBe('listo');
  });

  it('tras 3 reintentos fallidos muestra un error y deja de intentar', async () => {
    const caido = () => new ConnectError('HTTP 503', Code.Unavailable);
    const { espacio, servicio } = preparar([caido(), caido(), caido(), caido(), v1]);
    const generando = espacio.generar();
    await vi.advanceTimersByTimeAsync(ESPERA_DESPERTAR_MS * 4);
    await generando;
    expect(servicio.llamadas.length).toBe(4);
    expect(espacio.estado()).toBe('error');
    expect(espacio.error()?.mensaje).toMatch(/No pudimos conectar/);
  });

  it('cargarGuardado abre el código y el diagrama', async () => {
    const { espacio, servicio } = preparar([]);
    servicio.obtener.mockResolvedValue({
      diagram: create(SavedDiagramSchema, {
        id: 4,
        question: '¿Cómo entra el usuario?',
        files: [{ name: 'auth.js', content: 'login()' }],
        diagram: v1,
      }),
    });
    await espacio.cargarGuardado(4);
    expect(espacio.estado()).toBe('listo');
    expect(espacio.archivos()).toEqual([{ nombre: 'auth.js', contenido: 'login()' }]);
    expect(espacio.pregunta()).toBe('¿Cómo entra el usuario?');
    expect(espacio.despues()?.nodes.length).toBe(3);
    expect(espacio.antes()).toBeNull();
    expect(espacio.guardadoId()).toBe(4);
  });

  it('cargarGuardado inválido da error y no dibuja', async () => {
    const { espacio, servicio } = preparar([]);
    servicio.obtener.mockResolvedValue({
      diagram: create(SavedDiagramSchema, {
        id: 5,
        diagram: diagramaDePrueba({ nodos: [], aristas: [] }),
      }),
    });
    await espacio.cargarGuardado(5);
    expect(espacio.estado()).toBe('error');
    expect(espacio.despues()).toBeNull();
  });

  it('con todo el código vacío no llama al servidor y pide pegar código', async () => {
    const { espacio, servicio } = preparar([v1]);
    espacio.archivos.set([{ nombre: 'index.js', contenido: '   ' }]);
    await espacio.generar();
    expect(servicio.llamadas.length).toBe(0);
    expect(espacio.estado()).toBe('error');
    expect(espacio.error()?.mensaje).toBe('Pega algo de código antes de generar.');
  });

  it('reintentar tras fallar al abrir un guardado vuelve a abrirlo, sin generar', async () => {
    const { espacio, servicio } = preparar([]);
    servicio.obtener
      .mockRejectedValueOnce(
        new ConnectError('Ese diagrama no existe o no es tuyo.', Code.NotFound),
      )
      .mockResolvedValueOnce({
        diagram: create(SavedDiagramSchema, {
          id: 4,
          files: [{ name: 'a.js', content: 'x' }],
          diagram: v1,
        }),
      });
    await espacio.cargarGuardado(4);
    expect(espacio.estado()).toBe('error');
    await espacio.reintentar();
    expect(servicio.obtener).toHaveBeenCalledTimes(2);
    expect(servicio.llamadas.length).toBe(0);
    expect(espacio.estado()).toBe('listo');
  });

  it('si no hay conexión al abrir un guardado, no promete reintentos que no hace', async () => {
    const { espacio, servicio } = preparar([]);
    servicio.obtener.mockRejectedValue(new ConnectError('HTTP 503', Code.Unavailable));
    await espacio.cargarGuardado(4);
    expect(espacio.error()?.mensaje).toMatch(/No pudimos conectar/);
  });

  it('guardar envía el diagrama actual y recuerda el id', async () => {
    const { espacio, servicio } = preparar([v1]);
    servicio.guardar.mockResolvedValue({ diagram: { id: 9 } });
    await espacio.generar();
    await espacio.guardar();
    expect(servicio.guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Login',
        diagram: v1,
        files: [{ name: 'index.js', content: 'const a = 1;' }],
      }),
    );
    expect(espacio.guardadoId()).toBe(9);
  });
});
