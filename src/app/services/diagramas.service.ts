import { Injectable, inject } from '@angular/core';
import { Interceptor, createClient } from '@connectrpc/connect';
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

// Cliente del servicio de diagramas por gRPC-Web (el transporte que entienden los navegadores).
@Injectable({ providedIn: 'root' })
export class DiagramasService {
  private readonly auth = inject(AuthService);

  private readonly cliente = createClient(
    DiagramService,
    createGrpcWebTransport({
      baseUrl: environment.grpcUrl,
      interceptors: [interceptorToken(() => this.auth.token())],
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
