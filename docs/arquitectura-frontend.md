# Arquitectura del frontend

Angular 22 con componentes standalone, signals y `ChangeDetectionStrategy.OnPush` en todos los componentes. Sin SSR, sin librerías de UI ni de diagramas: CSS plano y SVG propio.

## Carpetas

```
src/
  index.html               título, fuentes (B612 y B612 Mono) y tema guardado antes de pintar
  main.ts                  arranque con appConfig
  styles.css               importa los tres archivos de styles/
  styles/
    tokens.css             todos los tokens de diseño (único archivo para re-tematizar)
    base.css               reset, foco visible, fuente de código, movimiento reducido
    utilities.css          .visually-hidden y .stack
  environments/            URL del backend (apiUrl para REST, grpcUrl para gRPC-Web)
  app/
    app.config.ts          HttpClient con el interceptor y router con input binding
    gen/                   código generado del .proto (no se edita a mano)
    app.routes.ts          rutas (ver abajo)
    config.ts              APP_NOMBRE = 'CodeToDiagram'
    core/                  sesión, guards, interceptor, errores, tema, fortaleza, movimiento
    services/diagramas.service.ts   cliente gRPC-Web del servicio de diagramas
    diagrama/              el lienzo del producto: modelo, ui-diagrama, ui-leyenda, validación,
                           diff, layouts, vistas del diff, exportación, pregunta.ts (tipo
                           adecuado para la pregunta), secuencia/ y detalle/ (panel Detalle)
    ui/                    componentes base (botón, campos, medidor, código, editor con detección
                           de lenguaje, alerta, avatar, íconos, tema)
    layouts/auth-layout/   plantilla de acceso: hoja y tapete
    layouts/barra-app/     barra superior de /app y /historial
    pages/
      acceso/              login y registro (un solo componente) + diagrama-acceso.ts
      inicio/              /app + espacio-trabajo.ts (estado y lógica del espacio de trabajo)
      historial/           /historial
      guia/                /design
proto/                     copia sincronizada del contrato gRPC del backend
scripts/                   sincronizar-proto.mjs
```

`diagrama-acceso.ts`, `layout-arquitectura.ts` y `layout-secuencia.ts` son funciones puras: reciben un estado o un `Diagram` y devuelven lo que se dibuja. Las páginas solo las conectan con signals. Ver [diagramas.md](diagramas.md).

## Rutas

| Ruta | Componente | Guard | Qué muestra |
|---|---|---|---|
| `/` | — | — | Redirige a `/app` con sesión o a `/login` sin ella |
| `/login`, `/registro` | `Acceso` (carga diferida) | `invitadoGuard` | Un solo componente para los dos: el modo llega como input desde la URL (`rutaAcceso`), así el cambio es una transición del diagrama y no una recarga |
| `/app` | `Inicio` (carga diferida) | `authGuard` | Espacio de trabajo: editor, tipo, pregunta y diagrama con diff. `?diagrama=<id>` abre uno guardado |
| `/historial` | `Historial` (carga diferida) | `authGuard` | Diagramas guardados: abrir y eliminar |
| `/design` | `Guia` (carga diferida) | — | Guía de estilo viva. No se enlaza desde la app |
| `**` | — | — | Redirige a `/` |

`withComponentInputBinding()` pasa `modo` y `?sesion=expirada` como inputs del componente.

## Servicios

| Archivo | Qué hace |
|---|---|
| `core/auth.service.ts` | `login`, `registrar`, `refrescarUsuario` y `cerrarSesion`. Guarda token y usuario en `localStorage` (con `try/catch`: en modo privado la sesión dura la pestaña) y los expone como signals. `estaAutenticado()` revisa la expiración del JWT en cada navegación. |
| `services/diagramas.service.ts` | Cliente gRPC-Web de `DiagramService`: `stream`, `guardar`, `listar`, `obtener`, `eliminar`. Interceptores para el JWT y para cerrar la sesión ante `unauthenticated`. Ver [grpc-cliente.md](grpc-cliente.md). |
| `pages/inicio/espacio-trabajo.ts` | `EspacioTrabajo`, provisto en `/app`: archivos, tipo y pregunta; genera por stream, regenera al editar (pausa de 2 s, mínimo 5 s entre automáticas, sin repetir contenido), descarta respuestas viejas, reintenta si Render duerme, valida, calcula el diff, abre y guarda. |
| `core/tema.service.ts` | Tema claro u oscuro. La primera vez sigue al sistema; después recuerda la elección. Aplica `data-theme` en `<html>` dentro de una View Transition. |
| `core/errores.ts` | `mapearError(err, contexto)` para REST y `mapearErrorGrpc(err)` para gRPC: los únicos lugares donde las respuestas del backend se convierten en mensajes. |
| `core/fuerza.ts` | Nivel de fortaleza de una contraseña y su pista. |
| `core/movimiento.ts` | `prefiereMenosMovimiento()` y `leerToken()`. |

## Guards

- `authGuard`: deja pasar solo con sesión válida; si no, redirige a `/login`.
- `invitadoGuard`: login y registro son solo para quien no tiene sesión; con sesión, redirige a `/app`.

## Interceptores

REST, `core/auth.interceptor.ts`:
1. Agrega `Authorization: Bearer <token>` a las peticiones al backend, salvo las públicas (`/auth/login`, `/auth/registro`, `/health`).
2. Si una ruta protegida responde 401, cierra la sesión y lleva a `/login?sesion=expirada`, donde el acceso muestra "Tu sesión expiró".

gRPC, en `services/diagramas.service.ts`: `interceptorToken` agrega el mismo token como metadato `authorization` e `interceptorSesion` hace lo del punto 2 cuando el servidor responde `unauthenticated`.

## Flujo de una edición

1. El editor emite los archivos nuevos; `/app` los pasa a `EspacioTrabajo` y llama a `alEditar()`.
2. Tras 2 s sin cambios (y al menos 5 s desde la última regeneración automática), si el contenido cambió, `generar()` cancela la llamada anterior y abre `StreamDiagram` con el diagrama actual como `previous`.
3. Los eventos `progress` actualizan el texto de estado; las respuestas de una llamada vieja se descartan por número de secuencia.
4. El diagrama recibido se valida. Si pasa, el anterior pasa a ser el "Antes", se calcula el diff y la vista vuelve a "Después".
5. `/app` recalcula el dibujo (`vistaDiff` o `vistaDiffSecuencia`) con signals.

## Flujo de un login

1. `Acceso` valida el formulario. Si hay errores, enfoca el primer campo inválido, anuncia el resumen y sacude el formulario.
2. Pasa la fase a `enviando`: el diagrama entinta la llamada HTTP, la API queda trabajando y `recorrer()` mueve el paquete.
3. `AuthService.login` hace `POST /api/auth/login`. Si tarda más de 4 s, aparece "El servidor está despertando" (Render gratuito).
4. Si sale bien: se guarda la sesión, el paquete llega a `usuarios`, la fase pasa a `ok` y, tras 450 ms, se navega a `/app`.
5. Si sale mal: `mapearError` traduce el error y la fase pasa a `error` con el código, que el diagrama dibuja (corte, 401, sin respuesta).

## Configuración

- Puerto fijo 4201 en `angular.json` (los tres proyectos corren a la vez).
- Pruebas: `npm test` (Vitest con jsdom vía `@angular/build:unit-test`). `vitest-base.config.mts` desactiva la caché de módulos de Vitest, que servía versiones viejas del código compilado por Angular.
- Budgets de producción: inicial 500 kB (aviso) y 1 MB (error); estilos por componente 8 kB (aviso) y 12 kB (error).
- `vercel.json` reescribe todas las rutas a `index.html`.
