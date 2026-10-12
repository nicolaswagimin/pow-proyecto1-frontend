# Design system · Mesa de trazado

Todos los valores viven en `src/styles/tokens.css`. Ningún componente usa un color, tamaño o duración fuera de estos tokens. La única excepción es la geometría del diagrama (alto de fila, radio de 3 px de los nodos), que vive en `src/app/diagrama/modelo.ts` porque el SVG la calcula en TypeScript.

El modo oscuro se aplica de dos formas: siguiendo al sistema (`prefers-color-scheme: dark`) y por elección manual (`[data-theme='dark']`, que guarda el botón de la lámpara). Por eso los valores oscuros aparecen dos veces en el archivo.

## Color

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `--color-fondo` | El tapete: fondo del lienzo y del área de trabajo | `#E9EEE9` | `#10211B` |
| `--color-superficie` | El papel: formulario, paneles, relleno de los nodos | `#F7F9F6` | `#162B23` |
| `--color-reticula` | Retícula fina del tapete (decorativa) | `#D6DFD8` | `#1A332A` |
| `--color-reticula-mayor` | Retícula cada 120 px y bordes de paneles | `#C3CFC6` | `#234236` |
| `--color-texto` | Texto principal y contorno de nodos | `#14231D` | `#E8EFE9` |
| `--color-texto-suave` | Texto secundario, `[Tipo]` de los nodos | `#4A5F55` | `#9DB5A8` |
| `--color-borde` | Borde de campos y controles | `#647A6F` | `#6E8F80` |
| `--color-lapiz` | Aristas pendientes | `#4A5F55` | `#9DB5A8` |
| `--color-primario` | La tinta: aristas confirmadas, botón principal, detalle de código | `#8A5300` | `#F5B33A` |
| `--color-primario-contraste` | Texto sobre el primario | `#FFFFFF` | `#10211B` |
| `--color-enlace` | Enlaces | `#8A5300` | `#F5B33A` |
| `--color-error` | Errores, aristas cortadas, nodos caídos | `#B42318` | `#FF7A6E` |
| `--color-exito` | Nodos y filas listos | `#17703F` | `#6FD99A` |
| `--color-aviso` | Avisos (Bloq Mayús, servicio no configurado) | `#9A3F00` | `#FFD08A` |
| `--color-foco` | Anillo de foco | `#8A5300` | `#F5B33A` |

### Contraste verificado (WCAG 2.2)

| Par | Claro | Oscuro | Mínimo |
|---|---|---|---|
| texto / fondo | 13.9:1 | 14.3:1 | 4.5:1 |
| texto / superficie | 15.4:1 | 12.8:1 | 4.5:1 |
| texto suave / fondo | 5.8:1 | 7.7:1 | 4.5:1 |
| texto suave / superficie | 6.5:1 | 6.8:1 | 4.5:1 |
| primario / superficie | 6.0:1 | 8.1:1 | 4.5:1 |
| texto del botón / primario | 6.3:1 | 9.1:1 | 4.5:1 |
| error / superficie | 6.2:1 | 5.9:1 | 4.5:1 |
| éxito / superficie | 5.8:1 | 8.6:1 | 4.5:1 |
| aviso / superficie | 6.4:1 | 10.4:1 | 4.5:1 |
| borde de control / superficie | 4.3:1 | 4.2:1 | 3:1 |

La retícula está por debajo de 3:1 a propósito: es textura del tapete y no transmite información.

## Tipografía

| Token | Valor |
|---|---|
| `--font-display`, `--font-texto` | B612, con respaldo `system-ui` |
| `--font-codigo` | B612 Mono, con respaldo `ui-monospace` |
| Pesos | `--peso-normal` 400, `--peso-fuerte` 700, `--peso-display` 700 (B612 solo tiene esos dos) |
| Interlineado | `--leading-ajustado` 1.15 (títulos), `--leading-normal` 1.55 (texto) |

Escala: `--text-xs` 0.75rem, `--text-sm` 0.875rem, `--text-base` 1rem, `--text-lg` 1.125rem, `--text-xl` 1.375rem, `--text-2xl` clamp(1.6rem → 2.1rem), `--text-3xl` clamp(2rem → 3rem).

Las fuentes se cargan desde Google Fonts en `index.html`, con `preconnect` y `display=swap`, y solo los pesos 400 y 700.

## Espaciado

Escala de 4 px: `--space-1` (4 px), `-2` (8), `-3` (12), `-4` (16), `-5` (20), `-6` (24), `-8` (32), `-10` (40), `-12` (48), `-16` (64).

## Radios

Dibujo técnico: esquinas casi rectas, con radio según la jerarquía.

| Token | Valor | Dónde |
|---|---|---|
| (modelo.ts) | 3 px | Nodos del diagrama |
| `--radius-control` | 6 px | Botones, campos, alertas |
| `--radius-panel` | 10 px | Paneles, fragmento de código, tapete de la guía |

## Sombras

Un solo nivel: `--shadow-elevacion-1`, una sombra corta y dura, como una hoja apoyada en el tapete. Está tintada con el verde del tapete (en oscuro, negro). Solo la usan el botón principal, los paneles y el fragmento de código. Los nodos no llevan sombra: son tinta sobre papel.

## Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--duracion-rapida` | 120 ms | Respuesta al presionar |
| `--duracion-media` | 220 ms | Hover, resaltado de fila y línea, fundido de tema |
| `--duracion-lenta` | 420 ms | Entrada de un campo o de una fila nueva |
| `--duracion-escena` | 700 ms | Arista de lápiz a tinta, reacomodo de nodos |
| `--easing-salida` | `cubic-bezier(0.16, 1, 0.3, 1)` | Casi todo: empieza rápido y frena |
| `--easing-entrada` | `cubic-bezier(0.7, 0, 0.84, 0)` | Elementos que salen |
| `--easing-resorte` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Ojo de la contraseña |
| `--easing-suave` | `cubic-bezier(0.45, 0, 0.55, 1)` | Arista de carga del botón, cono de la lámpara |

El detalle de cada animación está en [animaciones.md](animaciones.md).

## Texturas

El tapete es CSS puro, sin imágenes: cuatro `linear-gradient` dibujan la retícula fina (24 px) y la mayor (120 px) con `--color-reticula` y `--color-reticula-mayor`.
