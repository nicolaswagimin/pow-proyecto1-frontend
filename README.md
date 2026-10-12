# CodeToDiagram · Frontend

**CodeToDiagram** es un visualizador reactivo de arquitectura: pegas código (uno o varios archivos) y la app dibuja el diagrama de sus módulos, clases, servicios, dependencias y flujo de datos. Al editar el código, el diagrama se actualiza solo. Gemini analiza el código y devuelve nodos y conexiones en JSON; este frontend los dibuja.

Proyecto 1 de la materia Programación orientada a la web. Angular 22 (standalone, signals, sin SSR, CSS plano, SVG propio).

Backend: <https://github.com/nicolaswagimin/pow-proyecto1-backend>

## Capturas

El acceso es una demostración del producto: mientras llenas el formulario, a la derecha se ve su propio código y su diagrama C4. Los campos válidos pasan de lápiz a tinta; al enviar, un paquete recorre el flujo y, si algo falla, el diagrama marca dónde.

| | Claro | Oscuro |
|---|---|---|
| Acceso, escritorio | ![Acceso en escritorio, modo claro](docs/capturas/login-escritorio-claro.png) | ![Acceso en escritorio, modo oscuro](docs/capturas/login-escritorio-oscuro.png) |
| `/app`, escritorio | ![App en escritorio, modo claro](docs/capturas/app-escritorio-claro.png) | ![App en escritorio, modo oscuro](docs/capturas/app-escritorio-oscuro.png) |
| Acceso, móvil | <img src="docs/capturas/login-movil-claro.png" alt="Acceso en móvil, modo claro" width="260"> | <img src="docs/capturas/login-movil-oscuro.png" alt="Acceso en móvil, modo oscuro" width="260"> |
| `/app`, móvil | <img src="docs/capturas/app-movil-claro.png" alt="App en móvil, modo claro" width="260"> | <img src="docs/capturas/app-movil-oscuro.png" alt="App en móvil, modo oscuro" width="260"> |

## Requisitos

- Node.js 22.22.3+ o 24.15+ (lo exige Angular 22). En Vercel: *Settings → Build and Deployment → Node.js Version* en 22.x o superior.
- El backend corriendo en <http://localhost:3001>.

## Correr en local

```bash
npm install
npm start          # ng serve en http://localhost:4201
```

El puerto está fijo en `angular.json`, así los tres proyectos pueden correr a la vez (desde la carpeta raíz, `./demo.sh` arranca todo).

Para compilar la versión de producción:

```bash
npm run build      # genera dist/pow-proyecto1-frontend/browser
```

## Rutas

| Ruta | Qué muestra |
|---|---|
| `/` | Redirige a `/app` si hay sesión, o a `/login` si no. |
| `/login` | Inicio de sesión con el diagrama en vivo del formulario. |
| `/registro` | Crear cuenta. Comparte componente con `/login`: el diagrama se reacomoda. |
| `/app` | Protegida. Diagrama de la propia app con el estado real, registros e IA. |
| `/design` | Guía de estilo viva: tokens, notación del diagrama y componentes. |

## Entornos (URL del backend)

| Archivo | Se usa con | `apiUrl` |
|---|---|---|
| `src/environments/environment.development.ts` | `ng serve` (local) | `http://localhost:3001/api` |
| `src/environments/environment.ts` | `ng build` (producción) | `https://pow-proyecto1-backend.onrender.com/api` |

## Desplegar en Vercel

1. Despliega primero el backend en Render como `pow-proyecto1-backend`.
2. En <https://vercel.com> crea un **New Project** e importa este repositorio.
3. Configura **Framework Preset:** Angular, **Build Command:** `npm run build`, **Output Directory:** `dist/pow-proyecto1-frontend/browser`.
4. Agrega la URL de Vercel a `FRONTEND_URL` del backend en Render (sin `/` final) para que CORS la permita.

`vercel.json` reescribe todas las rutas a `/index.html`, así que recargar `/login` o `/app` no da 404.

## Documentación

| Documento | Contenido |
|---|---|
| [docs/brief-diseno.md](docs/brief-diseno.md) | Concepto "Mesa de trazado", demostración del login, direcciones descartadas |
| [docs/design-system.md](docs/design-system.md) | Tokens de color (con contraste), tipografía, espaciado, radios, sombras y movimiento |
| [docs/componentes.md](docs/componentes.md) | Cada componente con sus inputs, outputs y estados |
| [docs/animaciones.md](docs/animaciones.md) | Qué comunica cada animación y cómo se reduce |
| [docs/accesibilidad.md](docs/accesibilidad.md) | Decisiones de accesibilidad y resultado de axe |
| [docs/arquitectura-frontend.md](docs/arquitectura-frontend.md) | Carpetas, rutas, servicios, guards, interceptor y flujo de un login |
| [docs/decisiones/](docs/decisiones/) | ADR: SVG propio con C4, login como demostración, B612, movimiento con motivo |
| [CHANGELOG.md](CHANGELOG.md) | Cambios agrupados |

## Estructura

```
src/
  styles/tokens.css     todos los tokens de diseño
  app/core/             sesión, guards, interceptor, tema, errores, fortaleza
  app/diagrama/         ui-diagrama, ui-leyenda y la geometría (modelo.ts)
  app/ui/               componentes base
  app/layouts/          auth-layout: hoja y tapete
  app/pages/            acceso, inicio (/app) y guía (/design)
```
