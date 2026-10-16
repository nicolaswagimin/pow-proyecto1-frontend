# 0008 · Validar también en el cliente

- **Estado:** aceptada
- **Fecha:** 2026-10-15

## Contexto
El backend ya valida lo que devuelve Gemini antes de responder. Pero el cliente también dibuja diagramas guardados (que pudieron guardarse con reglas anteriores), y un error de serialización o un cambio de versión del contrato podría hacer llegar un diagrama que rompa el layout (por ejemplo, una conexión a un nodo que no existe).

## Decisión
`validarDiagrama` en `src/app/diagrama/validar.ts` repite las reglas del backend sobre el mensaje `Diagram` antes de dibujar, tanto al generar como al abrir un diagrama guardado. Si falla, no se dibuja nada: se muestra el error y se conserva el diagrama anterior.

## Consecuencias
- Falla cerrado en las dos puntas: un diagrama roto nunca llega a la pantalla.
- Las reglas existen dos veces (JS en el backend, TS aquí) con los mismos mensajes; si cambian, hay que cambiarlas en los dos lados. Sus pruebas son espejo una de la otra.
