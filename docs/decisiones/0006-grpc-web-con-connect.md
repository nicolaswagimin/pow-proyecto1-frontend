# 0006 · gRPC-Web con Connect

- **Estado:** aceptada
- **Fecha:** 2026-10-15

## Contexto
El servicio de diagramas va por gRPC (requisito del curso). El navegador no puede hablar gRPC puro. Las opciones eran `grpc-web` de Google (con Envoy delante del backend) o Connect.

## Decisión
`@connectrpc/connect-web` con `createGrpcWebTransport`, contra el mismo backend y puerto que REST. Tipos generados con Buf (`protoc-gen-es`, `target=ts`) desde una copia del `.proto` sincronizada con el backend. Login y registro siguen en REST con `HttpClient`.

## Consecuencias
- Sin proxy: el backend de Render acepta gRPC-Web directamente.
- `StreamDiagram` llega como un `AsyncIterable` que se recorre con `for await`; cancelar es abortar un `AbortSignal`.
- El cliente es una API de promesas, no de Observables: `EspacioTrabajo` usa `async/await` y signals en lugar de RxJS.
- Dos formas de llamar al backend conviven (REST y gRPC), cada una con su traducción de errores (`mapearError` y `mapearErrorGrpc`).
