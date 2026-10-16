import { Code, ConnectError } from '@connectrpc/connect';
import { mapearErrorGrpc } from './errores';

const delServidor = (mensaje: string, codigo: Code) => new ConnectError(mensaje, codigo);

describe('mapearErrorGrpc', () => {
  it('sin conexión (fetch falló) → el servidor está despertando', () => {
    const err = new ConnectError('Failed to fetch', Code.Unknown, undefined, undefined, new TypeError('Failed to fetch'));
    expect(mapearErrorGrpc(err)).toEqual({ mensaje: 'El servidor está despertando, reintentando…', despertando: true });
  });

  it('502/503 del proxy de Render → despertando', () => {
    expect(mapearErrorGrpc(delServidor('HTTP 503', Code.Unavailable))?.despertando).toBe(true);
    expect(mapearErrorGrpc(delServidor('HTTP 502', Code.Unavailable))?.despertando).toBe(true);
  });

  it('Unavailable con mensaje del servidor muestra ese mensaje', () => {
    expect(mapearErrorGrpc(delServidor('No se pudo consultar a la IA: cuota agotada', Code.Unavailable))).toEqual({
      mensaje: 'No se pudo consultar a la IA: cuota agotada',
    });
  });

  it.each([Code.ResourceExhausted, Code.InvalidArgument, Code.NotFound, Code.Internal, Code.FailedPrecondition])(
    'código %s muestra el mensaje del servidor',
    (codigo) => {
      expect(mapearErrorGrpc(delServidor('Mensaje claro.', codigo))).toEqual({ mensaje: 'Mensaje claro.' });
    },
  );

  it('Unauthenticated pide iniciar sesión', () => {
    expect(mapearErrorGrpc(delServidor('x', Code.Unauthenticated))).toEqual({
      mensaje: 'Tu sesión expiró. Inicia sesión de nuevo.',
    });
  });

  it('Canceled no muestra nada', () => {
    expect(mapearErrorGrpc(delServidor('cancelado', Code.Canceled))).toBeNull();
  });

  it('cualquier otro error da el mensaje genérico', () => {
    expect(mapearErrorGrpc(new Error('raro'))).toEqual({
      mensaje: 'Algo falló de nuestro lado. Inténtalo de nuevo en unos segundos.',
    });
    expect(mapearErrorGrpc(delServidor('x', Code.DataLoss))?.mensaje).toBe(
      'Algo falló de nuestro lado. Inténtalo de nuevo en unos segundos.',
    );
  });
});
