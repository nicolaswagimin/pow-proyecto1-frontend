# 0001 · Diagrama en SVG propio con notación C4

- **Estado:** aceptada
- **Fecha:** 2026-10-12

## Contexto
El producto dibuja diagramas de arquitectura a partir del JSON que devuelve Gemini. El login también necesita un diagrama vivo. Había tres opciones: una librería de grafos (Mermaid, Cytoscape, JointJS), un canvas propio o SVG propio.

## Decisión
Dibujar en SVG con un componente propio (`ui-diagrama`) y la notación C4: cada caja dice `Nombre [Tipo]` y el tipo se lee por la forma. La geometría (alto de nodos, rutas ortogonales, carriles) son funciones puras en `diagrama/modelo.ts`.

## Consecuencias
- No suma peso al bundle inicial y no depende de una librería que haya que mantener.
- El SVG se estiliza con los mismos tokens que el resto de la interfaz y respeta claro, oscuro y movimiento reducido.
- Las rutas se calculan sin medir el DOM, así que el paquete puede recorrerlas y se pueden probar sin navegador.
- El SVG es accesible como una sola imagen con descripción de texto.
- No hay distribución automática de nodos: las posiciones las da quien arma el diagrama. Cuando el producto reciba diagramas de Gemini hará falta un algoritmo de distribución (por capas, por ejemplo), que se puede agregar en `modelo.ts` sin cambiar el componente.
