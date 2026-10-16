# 0005 · Editor propio sobre un textarea, sin CodeMirror ni Monaco

- **Estado:** aceptada
- **Fecha:** 2026-10-15

## Contexto
El usuario pega código y lo edita para ver cómo cambia el diagrama. CodeMirror o Monaco dan resaltado y autocompletado, pero pesan cientos de kB, traen sus propios estilos (que chocarían con la regla de no tocar el design system) y no son lo que se evalúa: el producto es el diagrama, no el editor.

## Decisión
`ui-editor`: pestañas por archivo y un `textarea` con un margen de números de línea sincronizado con el scroll, en B612 Mono y con los tokens actuales. Tab inserta espacios; Esc y luego Tab sale del editor.

## Consecuencias
- El bundle inicial no crece: `/app` sigue cargando en diferido y liviano.
- Se ve como `ui-codigo`, el fragmento de código del login.
- No hay resaltado de sintaxis ni autocompletado. Si hiciera falta, se puede reemplazar el `textarea` sin cambiar la interfaz del componente (`archivos` como `model`).
