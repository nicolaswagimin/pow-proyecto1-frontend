# Diagramas

Cómo se pasa del mensaje `Diagram` que llega por gRPC a un dibujo. Todo vive en `src/app/diagrama/` y casi todo son funciones puras, probadas con Vitest.

```
Diagram (gRPC) ──► validarDiagrama ──► calcularDiff (si hay anterior) ──► diagramaDeVista ──► layout ──► componente SVG
```

## 1. Validación (`validar.ts`)

Segunda capa: el servidor ya validó, pero el cliente no dibuja nada que no pase las mismas reglas que el backend (1 a 12 nodos, ids únicos con `^[a-z0-9-]+$`, nombre y categoría válidos, conexiones a nodos existentes, sin autoconexiones, orden en secuencia). Si falla, `/app` muestra el error y conserva el diagrama anterior. También se valida un diagrama guardado antes de abrirlo.

## 2. Tipos (`tipos.ts`)

`TIPOS_DIAGRAMA` registra los tipos que ofrece la interfaz: Arquitectura, Secuencia y Clases. Clases usa el mismo layout que Arquitectura.

`analizarPregunta(pregunta, tipo)` (`pregunta.ts`) avisa cuando la pregunta pide algo que el tipo elegido no muestra y sugiere el que sí: atributos o métodos → Clases; "paso a paso", "en qué orden" → Secuencia. Para agregar uno (flujo de trabajo, flujo de datos, ciclo de vida):

1. Un valor en `DiagramType` del `.proto` (en el backend) y `npm run proto:sync && npm run proto:gen`.
2. Una entrada en `TIPOS_DIAGRAMA`.
3. Un layout puro y un componente de dibujo, y su caso en `inicio.ts`.

## 3. Layout de arquitectura (`layout-arquitectura.ts`)

Determinista: el mismo diagrama se dibuja siempre igual, sin importar el orden en que la IA devolvió nodos y conexiones.

1. **Ciclos**: un recorrido en profundidad, en orden de id, ignora las aristas de retroceso (A→B→A no cuelga el layout).
2. **Capas**: la capa de cada nodo es su camino más largo desde una fuente. Los nodos aislados quedan en la capa 0.
3. **Orden dentro de la capa**: por baricentro de sus padres ya ubicados, con empate por id (reduce cruces).
4. **Posición**: cada fila se centra según el ancho real de sus nodos, separados 48 px; las filas, 72 px.

**Ancho de cada nodo**: crece con su texto más largo (título a ~7,6 px por letra; tipo, archivo y filas a ~6,4 px), entre 200 y 320 px. Lo que aún no cabe se recorta con `…`; el nombre completo va en `tituloCompleto`, que `ui-diagrama` muestra como tooltip.

**Clases**: los atributos (`nombre: tipo`) y métodos (`metodo(param: tipo): retorno`) son las filas del nodo (los compartimentos de UML), con la visibilidad como glifo: `−` si el nombre empieza con `_`, `+` si no. Los nodos se etiquetan `[Clase: …]`. Para calcular las capas, las conexiones de herencia (`hereda`, `extiende`, `implementa`) se invierten: la clase madre queda arriba.

**Nodos sin respaldo**: un nodo con `notInCode` lleva la insignia `no está en el código` (la `marca` de `ui-diagrama`).

Si un nodo tiene varias salidas, sus etiquetas se recortan a 12 caracteres: todas nacen del mismo tramo y, más largas, se pisarían.

Con muchos nodos en una capa el dibujo es ancho. En `/app` nunca se encoge por debajo de 0,75 de su tamaño (`anchoMinimoDibujo`): la mesa hace scroll horizontal y arranca centrada, en vez de dejar el texto ilegible.

Cada `Node` se convierte en un nodo de `ui-diagrama`: el nombre como título, `[Categoría: tecnología]` como tipo, la forma C4 según la categoría (persona, componente, contenedor, base de datos, externo) y el archivo como detalle. Los textos largos se recortan con `…`.

## 4. Layout de secuencia (`secuencia/layout-secuencia.ts`)

Un carril por participante, en orden de primera aparición (los que no envían ni reciben mensajes van al final, por id), cada 180 px. Un mensaje por fila, cada 44 px, ordenado por `order` y con empate por id. Lo dibuja `ui-diagrama-secuencia`.

## 5. Diff (`diff.ts`)

Mismas reglas que el backend:

- **Nodos** por id. Modificado si cambia el nombre, la categoría, la tecnología o la descripción.
- **Conexiones** primero por id (si unen los mismos nodos) y, las que quedan, por extremos + etiqueta: una conexión que la IA renumeró no cuenta como cambio. Modificada si cambia la etiqueta o el orden.

`DiffVista` separa las conexiones eliminadas (`aristasEliminadas`, ids del diagrama anterior) de las agregadas y modificadas, porque un id puede reutilizarse.

## 6. Vistas del diff (`vistas.ts`)

| Vista | Qué se dibuja |
|---|---|
| Antes | El diagrama anterior, con lo eliminado marcado |
| Después | El nuevo, con lo agregado y modificado marcado |
| Comparar | La unión de los dos con un layout propio (sin solapes); lo eliminado aparece tenue ("fantasma") |

Los estados se ven con color **y** con forma de trazo (continuo, discontinuo, punteado), así no dependen solo del color. Los colores son los tokens existentes `--color-exito`, `--color-aviso` y `--color-error`.

## 7. Exportación (`exportar.ts`)

- **SVG**: se clona el `<svg>` en pantalla, se copian en línea los estilos calculados (relleno, trazo, tipografía, opacidad…), se agrega `xmlns` y un fondo del color de la superficie. Así el archivo se ve igual fuera de la app, en el tema actual.
- **PNG**: ese SVG se pinta en un `canvas` al doble de resolución.
- El nombre del archivo sale del título: "Flujo de Login: API" → `flujo-de-login-api.svg`.
