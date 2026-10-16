import { Code, ConnectError, createContextValues } from '@connectrpc/connect';
import { interceptorSesion, interceptorToken } from './diagramas.service';

describe('interceptorToken', () => {
  const peticion = () => ({ header: new Headers(), contextValues: createContextValues() }) as never;

  it('envía el JWT en el metadato authorization', async () => {
    const req = peticion();
    await interceptorToken(() => 'abc')(async (r) => r as never)(req);
    expect((req as { header: Headers }).header.get('authorization')).toBe('Bearer abc');
  });

  it('sin sesión no agrega el header', async () => {
    const req = peticion();
    await interceptorToken(() => null)(async (r) => r as never)(req);
    expect((req as { header: Headers }).header.has('authorization')).toBe(false);
  });
});

describe('interceptorSesion', () => {
  const noAutenticado = () => new ConnectError('expiró', Code.Unauthenticated);

  it('llama alExpirar si una llamada unaria responde Unauthenticated', async () => {
    let expiro = 0;
    const llamada = interceptorSesion(() => expiro++)(async () => {
      throw noAutenticado();
    });
    await expect(llamada({} as never)).rejects.toThrow('expiró');
    expect(expiro).toBe(1);
  });

  it('llama alExpirar si el stream falla con Unauthenticated', async () => {
    let expiro = 0;
    async function* mensajes() {
      yield 1;
      throw noAutenticado();
    }
    const res = await interceptorSesion(() => expiro++)(
      async () => ({ stream: true, message: mensajes() }) as never,
    )({} as never);
    const recibidos: unknown[] = [];
    await expect(
      (async () => {
        for await (const m of (res as unknown as { message: AsyncIterable<unknown> }).message) recibidos.push(m);
      })(),
    ).rejects.toThrow('expiró');
    expect(recibidos).toEqual([1]);
    expect(expiro).toBe(1);
  });

  it('otros errores no cierran la sesión', async () => {
    let expiro = 0;
    const llamada = interceptorSesion(() => expiro++)(async () => {
      throw new ConnectError('x', Code.Internal);
    });
    await expect(llamada({} as never)).rejects.toThrow();
    expect(expiro).toBe(0);
  });
});
