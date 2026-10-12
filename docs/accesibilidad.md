# Accesibilidad

Objetivo: WCAG 2.2 nivel AA en todas las pantallas, en modo claro y oscuro, en escritorio y móvil.

## Decisiones

### El diagrama
- Cada `ui-diagrama` es un `<svg role="img">` con un `aria-label` que resume su estado en texto ("Listos: correo. Pendientes: contraseña."). Un lector de pantalla no tiene que recorrer cajas y líneas.
- El estado nunca depende solo del color: las filas llevan glifo (○ ● ✓ ✕), las aristas cambian de trazo (discontinua, continua, cortada con ✕) y los nodos con problema muestran una insignia de texto ("401", "sin respuesta").
- La leyenda explica los trazos con texto.
- El fragmento de código y el nombre del control (`email`, `password`) son `aria-hidden`: repiten información que el formulario ya da.
- En `/app`, el estado del sistema se anuncia además en una región `role="status"` oculta visualmente, y cada fallo tiene su alerta con la solución.

### Formularios
- Cada campo tiene `<label for>` visible arriba (no flota ni desaparece).
- `autocomplete`: `email`, `current-password`, `new-password`, `name`. `type="email"` con `inputmode="email"`.
- Los errores aparecen al salir del campo la primera vez y se actualizan al escribir. Se enlazan con `aria-describedby` y marcan `aria-invalid`. Llevan ícono además del color.
- Al enviar con errores, el foco va al primer campo inválido y un `aria-live` anuncia el resumen ("Revisa los campos: Correo, Contraseña.").
- Los errores del servidor van en `ui-alert` con `role="alert"`, o junto al campo cuando el backend dice cuál es.
- El botón de mostrar contraseña tiene `aria-label` y `aria-pressed`, y no saca el foco del campo.
- Bloq Mayús y la fortaleza de la contraseña se anuncian con `aria-live`; la regla del medidor es `aria-hidden` porque el texto ya lo dice.
- Mientras carga, el botón usa `aria-busy` y su nuevo texto está en un `role="status"`.

### Foco y teclado
- `:focus-visible` con un anillo de 3 px en `--color-foco`; los campos muestran además un anillo por fuera del borde.
- Orden de tabulación del acceso: logo, tema, correo, contraseña, mostrar contraseña, botón, enlace a registro. Enter envía.
- Al cambiar entre login y registro, el foco va al título (`tabindex="-1"`), salvo que la persona ya esté escribiendo en un campo.

### Contraste y color
- Todos los pares de texto superan 4.5:1 y los bordes de control superan 3:1, en ambos modos. La tabla está en [design-system.md](design-system.md).
- `color-scheme` y `theme-color` cambian con el modo para que los controles nativos y la barra del navegador acompañen.

### Movimiento
- `prefers-reduced-motion` desactiva el dibujo inicial, el recorrido del paquete, la sacudida y todas las transiciones (ver [animaciones.md](animaciones.md)).
- No hay efectos de cursor: nada depende de mover el mouse.

### Táctil
- Áreas táctiles de al menos 44 × 44 px (botones, ojo, tema). En móvil, Cerrar sesión queda como ícono con `aria-label`.

## Verificación

Fecha: 2026-10-12. Herramientas: axe-core 4.14 (reglas `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` y `best-practice`) con Playwright sobre Chrome, más pruebas de teclado y de movimiento reducido.

| Ruta | Claro 1440 px | Claro 390 px | Oscuro 1440 px | Oscuro 390 px |
|---|---|---|---|---|
| `/login` | 0 violaciones | 0 | 0 | 0 |
| `/registro` | 0 | 0 | 0 | 0 |
| `/app` (con sesión) | 0 | 0 | 0 | 0 |
| `/design` | 0 | 0 | 0 | 0 |

- La primera pasada encontró una violación en `/design` (`landmark-one-main`: la guía no tenía región `main`). Se corrigió en el commit `fix(design): la guía usa main como región principal`.
- Teclado: el recorrido con Tab sigue el orden de arriba; al enviar vacío con Enter, el foco queda en Correo con `aria-invalid="true"`.
- Movimiento reducido: con `reducedMotion: 'reduce'` el diagrama aparece completo y los errores se muestran sin sacudida.

axe no reemplaza una prueba con lector de pantalla real. Queda pendiente recorrer el acceso con VoiceOver.
