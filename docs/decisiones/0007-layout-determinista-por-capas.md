# 0007 · Layout determinista por capas

- **Estado:** aceptada
- **Fecha:** 2026-10-15

## Contexto
Gemini devuelve nodos y conexiones, no posiciones. La IA no debe decidir el dibujo (idea de Archify: la IA entiende, un compilador fijo dibuja). Además, el diff solo se entiende si un nodo que no cambió queda en el mismo lugar entre versiones. Librerías como dagre o ELK resuelven el layout, pero suman peso y su resultado depende del orden de entrada.

## Decisión
Un layout propio por capas en funciones puras (`layout-arquitectura.ts`): ciclos rotos con un recorrido en orden de id, capa por camino más largo, orden dentro de la capa por baricentro con empate por id, y una grilla fija. Para secuencia, carriles por orden de aparición y mensajes por `order` (`layout-secuencia.ts`). La vista Comparar usa el layout de la unión de los dos diagramas.

## Consecuencias
- El mismo diagrama se dibuja siempre igual, aunque la IA cambie el orden de su respuesta (está probado).
- Con 12 nodos como máximo, el algoritmo simple alcanza; no minimiza cruces como un layout de Sugiyama completo.
- Reutiliza `ui-diagrama`, que ya dibujaba C4 con rutas ortogonales: solo faltaba calcular las posiciones.
