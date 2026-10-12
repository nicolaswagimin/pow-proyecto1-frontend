# 0003 · Tipografía B612 y B612 Mono

- **Estado:** aceptada
- **Fecha:** 2026-10-12

## Contexto
El diseño anterior usaba Syne y Manrope, elegidas por estética. El producto muestra código y etiquetas pequeñas dentro de cajas.

## Decisión
Usar **B612** para la interfaz y **B612 Mono** para el código y el texto de los nodos, solo en los pesos 400 y 700. B612 fue diseñada para las pantallas de cabina de Airbus: su trabajo es que una etiqueta técnica se lea bien a tamaño pequeño y bajo presión.

## Consecuencias
- La familia tiene un motivo ligado al producto: leer información técnica densa.
- El monoespaciado aparece solo donde hay código real (fragmento, nodos, nombre del control, correo en `/app`), no como adorno de etiquetas.
- Solo hay dos pesos, así que la jerarquía se hace con tamaño y color, no con 500 o 800. `--peso-display` es 700.
- Se cargan cuatro archivos de fuente desde Google Fonts con `display=swap`; si fallan, queda `system-ui` / `ui-monospace`.
