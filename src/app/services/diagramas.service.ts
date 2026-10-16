import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Code, ConnectError, Interceptor, createClient } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth.service';
import { MessageInitShape } from '@bufbuild/protobuf';
import {
  DiagramService,
  SaveDiagramRequestSchema,
  StreamDiagramRequestSchema,
  StreamDiagramResponse,
} from '../gen/codetodiagram/v1/diagram_pb';

// Agrega el JWT de la sesión como metadato "authorization", igual que el interceptor HTTP de REST.
export function interceptorToken(obtenerToken: () => string | null): Interceptor {
  return (next) => (req) => {
    const token = obtenerToken();
    if (token) req.header.set('authorization', `Bearer ${token}`);
    return next(req);
  };
}

// Si el servidor rechaza el token (expiró o el usuario ya no existe), se cierra la sesión, igual
// que con un 401 en REST. En un stream el error llega mientras se leen los mensajes.
export function interceptorSesion(alExpirar: () => void): Interceptor {
  const revisar = (err: unknown) => {
    if (err instanceof ConnectError && err.code === Code.Unauthenticated) alExpirar();
  };
  async function* vigilar<T>(mensajes: AsyncIterable<T>) {
    try {
      yield* mensajes;
    } catch (err) {
      revisar(err);
      throw err;
    }
  }
  return (next) => async (req) => {
    try {
      const res = await next(req);
      return res.stream ? { ...res, message: vigilar(res.message) } : res;
    } catch (err) {
      revisar(err);
      throw err;
    }
  };
}

// Cliente del servicio de diagramas por gRPC-Web (el transporte que entienden los navegadores).
@Injectable({ providedIn: 'root' })
export class DiagramasService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly cliente = createClient(
    DiagramService,
    createGrpcWebTransport({
      baseUrl: environment.grpcUrl,
      interceptors: [
        interceptorSesion(() => {
          this.auth.cerrarSesion();
          this.router.navigate(['/login'], { queryParams: { sesion: 'expirada' } });
        }),
        interceptorToken(() => this.auth.token()),
      ],
    }),
  );

  // Progreso, diagrama y diff a medida que el servidor los envía. Cancelar la señal corta la
  // llamada (por ejemplo, cuando el usuario sigue escribiendo).
  stream(
    req: MessageInitShape<typeof StreamDiagramRequestSchema>,
    signal: AbortSignal,
  ): AsyncIterable<StreamDiagramResponse> {
    return this.cliente.streamDiagram(req, { signal });
  }

  guardar(req: MessageInitShape<typeof SaveDiagramRequestSchema>) {
    return this.cliente.saveDiagram(req);
  }

  listar() {
    return this.cliente.listDiagrams({});
  }

  obtener(id: number) {
    return this.cliente.getDiagram({ id });
  }

  eliminar(id: number) {
    return this.cliente.deleteDiagram({ id });
  }
}
