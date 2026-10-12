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
  environments/            URL del backend en desarrollo y en producción
  app/
    app.config.ts          HttpClient con el interceptor y router con input binding
    app.routes.ts          rutas (ver abajo)
    config.ts              APP_NOMBRE = 'CodeToDiagram'
    core/                  sesión, guards, interceptor, errores, tema, fortaleza, movimiento
    services/api.service.ts   /health, /items y /ia
    diagrama/              el lienzo del producto: modelo y geometría, ui-diagrama, ui-leyenda
    ui/                    componentes base (botón, campos, medidor, código, alerta, avatar, íconos, tema)
    layouts/auth-layout/   plantilla de acceso: hoja y tapete
    pages/
      acceso/              login y registro (un solo componente) + diagrama-acceso.ts
      inicio/              /app + arquitectura-app.ts (diagrama de la propia app)
      guia/                /design
```

`diagrama-acceso.ts` y `arquitectura-app.ts` son funciones puras: reciben el estado (formulario, fase de la petición, respuesta de `/health`) y devuelven nodos y aristas. Las páginas solo las conectan con signals. Es la misma forma en que el producto convertirá el JSON de Gemini en diagrama.

## Rutas

| Ruta | Componente | Guard | Qué muestra |
|---|---|---|---|
| `/` | — | — | Redirige a `/app` con sesión o a `/login` sin ella |
| `/login`, `/registro` | `Acceso` (carga diferida) | `invitadoGuard` | Un solo componente para los dos: el modo llega como input desde la URL (`rutaAcceso`), así el cambio es una transición del diagrama y no una recarga |
| `/app` | `Inicio` (carga diferida) | `authGuard` | Bienvenida, diagrama de la app con el estado real, registros e IA |
| `/design` | `Guia` (carga diferida) | — | Guía de estilo viva. No se enlaza desde la app |
| `**` | — | — | Redirige a `/` |

`withComponentInputBinding()` pasa `modo` y `?sesion=expirada` como inputs del componente.

## Servicios

| Archivo | Qué hace |
|---|---|
| `core/auth.service.ts` | `login`, `registrar`, `refrescarUsuario` y `cerrarSesion`. Guarda token y usuario en `localStorage` (con `try/catch`: en modo privado la sesión dura la pestaña) y los expone como signals. `estaAutenticado()` revisa la expiración del JWT en cada navegación. |
| `services/api.service.ts` | `estado()` (`GET /health`), `listar`, `crear` y `eliminar` items, `preguntarIA`. |
| `core/tema.service.ts` | Tema claro u oscuro. La primera vez sigue al sistema; después recuerda la elección. Aplica `data-theme` en `<html>` dentro de una View Transition. |
| `core/errores.ts` | `mapearError(err, contexto)`: el único lugar donde las respuestas del backend se convierten en mensajes (0, 400, 401, 409, 429, 502, 5xx). |
| `core/fuerza.ts` | Nivel de fortaleza de una contraseña y su pista. |
| `core/movimiento.ts` | `prefiereMenosMovimiento()` y `leerToken()`. |

## Guards

- `authGuard`: deja pasar solo con sesión válida; si no, redirige a `/login`.
- `invitadoGuard`: login y registro son solo para quien no tiene sesión; con sesión, redirige a `/app`.

## Interceptor

`core/auth.interceptor.ts`:
1. Agrega `Authorization: Bearer <token>` a las peticiones al backend, salvo las públicas (`/auth/login`, `/auth/registro`, `/health`).
2. Si una ruta protegida responde 401, cierra la sesión y lleva a `/login?sesion=expirada`, donde el acceso muestra "Tu sesión expiró".

## Flujo de un login

1. `Acceso` valida el formulario. Si hay errores, enfoca el primer campo inválido, anuncia el resumen y sacude el formulario.
2. Pasa la fase a `enviando`: el diagrama entinta la llamada HTTP, la API queda trabajando y `recorrer()` mueve el paquete.
3. `AuthService.login` hace `POST /api/auth/login`. Si tarda más de 4 s, aparece "El servidor está despertando" (Render gratuito).
4. Si sale bien: se guarda la sesión, el paquete llega a `usuarios`, la fase pasa a `ok` y, tras 450 ms, se navega a `/app`.
5. Si sale mal: `mapearError` traduce el error y la fase pasa a `error` con el código, que el diagrama dibuja (corte, 401, sin respuesta).

## Configuración

- Puerto fijo 4201 en `angular.json` (los tres proyectos corren a la vez).
- Budgets de producción: inicial 500 kB (aviso) y 1 MB (error); estilos por componente 8 kB (aviso) y 12 kB (error).
- `vercel.json` reescribe todas las rutas a `index.html`.
