# Cliente gRPC

El servicio de diagramas va por gRPC; login y registro siguen por REST con `HttpClient`.

## Transporte: gRPC-Web

Los navegadores no pueden hablar gRPC puro, así que el cliente usa **gRPC-Web** con Connect (`@connectrpc/connect-web`, `createGrpcWebTransport`). El backend acepta gRPC-Web en el mismo puerto que REST, sin proxy Envoy. La URL está en `environment*.ts` como `grpcUrl` (la del backend, sin `/api`):

| Entorno | `grpcUrl` |
|---|---|
| Desarrollo (`ng serve`) | `http://localhost:3001` |
| Producción (`ng build`) | `https://pow-proyecto1-backend.onrender.com` |

Verificado en producción el 2026-10-16: contra Render funcionan las llamadas unarias y el streaming de `StreamDiagram` por gRPC-Web.

## `DiagramasService` (`src/app/services/diagramas.service.ts`)

| Método | RPC |
|---|---|
| `stream(req, signal)` | `StreamDiagram`: progreso, diagrama y diff; `signal` cancela la llamada |
| `guardar(req)` | `SaveDiagram` |
| `listar()` | `ListDiagrams` |
| `obtener(id)` | `GetDiagram` |
| `eliminar(id)` | `DeleteDiagram` |

Dos interceptores, el equivalente de `auth.interceptor.ts` para REST:

- `interceptorToken`: agrega `authorization: Bearer <token>` con el token de `AuthService`.
- `interceptorSesion`: si el servidor responde `unauthenticated`, en una llamada normal o a mitad de un stream, cierra la sesión y lleva a `/login?sesion=expirada`.

Los errores se traducen en `mapearErrorGrpc` (`core/errores.ts`):

| Situación | Lo que ve el usuario |
|---|---|
| Sin respuesta del servidor (`fetch` falló, o 502/503 del proxy) | "El servidor está despertando, reintentando…" (y `/app` reintenta 3 veces) |
| `invalid_argument`, `resource_exhausted`, `not_found`, `internal`, `unavailable`, `failed_precondition` | El mensaje en español que manda el servidor |
| `unauthenticated` | "Tu sesión expiró. Inicia sesión de nuevo." |
| `canceled` | Nada (la cancelamos nosotros al seguir escribiendo) |
| Cualquier otro | "Algo falló de nuestro lado…" |

## Código generado

`src/app/gen/codetodiagram/v1/diagram_pb.ts` sale del `.proto` con Buf (`protoc-gen-es`, `target=ts`). No se edita a mano y se commitea.

## El `.proto` sincronizado

El contrato vive en el backend (`backend/proto/`), que es la fuente única. Este repo tiene una copia idéntica en `proto/`:

```bash
npm run proto:sync    # copia ../backend/proto a ./proto (o BACKEND_DIR=/ruta/al/backend)
npm run proto:check   # falla si las dos copias no son idénticas
npm run proto:gen     # regenera src/app/gen/
```

Al cambiar el contrato: edítalo en el backend, regenera allí, y aquí ejecuta `proto:sync`, `proto:gen` y `proto:check` antes de commitear.
