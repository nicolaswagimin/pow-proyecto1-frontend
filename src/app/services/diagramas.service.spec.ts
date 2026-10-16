import { createContextValues } from '@connectrpc/connect';
import { interceptorToken } from './diagramas.service';

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
