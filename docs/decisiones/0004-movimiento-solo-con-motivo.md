# 0004 · Movimiento solo con motivo, sin efectos de cursor

- **Estado:** aceptada
- **Fecha:** 2026-10-12

## Contexto
El diseño anterior tenía partículas que huían del mouse, una luz que seguía al cursor, un botón magnético, halos que latían y confeti. Además de ser genéricos, esos efectos no funcionan en táctil, gastan batería y no dicen nada.

## Decisión
1. Toda animación cuenta algo del producto o responde a una acción (lista en `docs/animaciones.md`).
2. Un solo momento orquestado por pantalla: el dibujo inicial del diagrama.
3. Ningún efecto depende del cursor.
4. Las animaciones en bucle (nodo trabajando, carga del botón) solo existen mientras dura el proceso y se pausan con la pestaña oculta.
5. Con `prefers-reduced-motion` no hay recorrido, dibujo ni sacudida, y el estado final se muestra igual.

## Consecuencias
- La experiencia es la misma en táctil y con mouse.
- Se eliminaron `fx/plancton`, `fx/celebracion`, `esTactil()` y la luz del auth-layout.
- Animar un trazo con `stroke-dashoffset` y transformar nodos es barato; el contorno que crece usa la propiedad CSS `d`, y en navegadores que no la soportan el contorno cambia sin animación.
