# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Los commits siguen Conventional Commits.

## [Sin publicar] · 2026-10-15

La funcionalidad propia de CodeToDiagram: pegar código y obtener un diagrama que cambia, con diff, mientras editas.

### Agregado
- Espacio de trabajo en `/app`: editor con pestañas por archivo (`ui-editor`), tipo de diagrama (arquitectura o secuencia), pregunta opcional que lo enfoca y botón Generar.
- Cliente gRPC-Web del servicio de diagramas (`DiagramasService`) con interceptores para el JWT y para cerrar la sesión ante `unauthenticated`; código generado con Buf desde una copia sincronizada del `.proto` (`npm run proto:sync`, `proto:check`, `proto:gen`).
- Generación por streaming con progreso visible, y regeneración automática al editar: pausa de 2 s, al menos 5 s entre regeneraciones, sin repetir contenido y descartando respuestas viejas.
- Validación del diagrama en el cliente antes de dibujar (falla cerrado) y reintentos cuando Render está despertando.
- Layout determinista por capas para arquitectura y diagrama de secuencia nuevo (`ui-diagrama-secuencia`).
- Diff antes/después: agregados, modificados y eliminados resaltados con color y forma de trazo, resumen, leyenda y vistas Antes / Después / Comparar.
- Guardar, exportar como SVG o PNG y `/historial` con abrir y eliminar con confirmación.
- Pruebas unitarias con Vitest (`npm test`): validador, diff, layouts, exportación, errores gRPC, espacio de trabajo e historial.

### Cambiado
- La barra superior pasa a un componente compartido (`app-barra`) con enlace al historial; en teléfonos oculta el avatar para no desbordar.

### Corregido
- Números de línea del editor alineados con el código (el atajo `font` reiniciaba `line-height`).
- Generar con el editor vacío ya no llama a la IA.
- Reintentar repite la última acción (generar o volver a abrir un guardado) y los errores de red fuera de la generación no prometen reintentos.
- Los diagramas anchos no se encogen hasta ser ilegibles: escala mínima 0,75 con scroll centrado; etiquetas más cortas cuando un nodo tiene varias salidas.

### Eliminado
- De `/app`: el diagrama de la propia app con el estado del backend, el CRUD de ejemplo (`items`) y la caja de preguntas a la IA. Se eliminan `ApiService` y `arquitectura-app.ts`.

### Documentación
- Nuevos `docs/funcionalidades.md`, `docs/diagramas.md`, `docs/grpc-cliente.md` y decisiones `0005` a `0008`.
- Actualizados `docs/arquitectura-frontend.md` y `docs/componentes.md`.
- gRPC-Web verificado en producción contra Render (unario y streaming).

## 2026-10-12

Rediseño de identidad: de "Bioluminiscencia" (sin relación con el tema) a **CodeToDiagram**, con la dirección "Mesa de trazado".

### Agregado
- Componente `ui-diagrama`: diagrama C4 en SVG propio con formas por tipo (persona, componente, contenedor, base de datos, sistema externo), filas tipo UML, rutas ortogonales y aristas a lápiz, en tinta o cortadas.
- Recorrido de un paquete de datos por las aristas (`recorrer()`) y dibujo inicial nodo por nodo.
- `ui-leyenda` con la notación de aristas y `ui-codigo` con fragmento de código y línea activa.
- Login como demostración del producto: el formulario se diagrama a sí mismo en vivo (debounce de 300 ms), el envío recorre el flujo y el diagrama marca dónde falla (401, 409, sin respuesta).
- Registro: el diagrama se reacomoda con la fila `nombre`, `registrar()` y `INSERT`.
- Franja horizontal del diagrama para móvil.
- `/app`: el estado del sistema como diagrama C4 de la propia app (Navegador → API → Neon y Gemini).
- `/design`: muestra de cada forma y estado de la notación, con prueba del recorrido.
- Documentación en `docs/`: brief, design system, componentes, animaciones, accesibilidad, arquitectura, cuatro ADR y capturas.

### Cambiado
- Tokens: paleta de tapete de corte, papel y tinta (claro y oscuro, contraste anotado), radios de dibujo técnico y una sola sombra corta.
- Tipografía: B612 y B612 Mono, pesos 400 y 700.
- Nombre de la app, título de la pestaña y `theme-color`.
- Campos: el label queda fijo arriba con el nombre del control en el código; nuevo output `enfoque`.
- Botón: la carga cambia el texto de forma visible y traza una arista.
- Medidor de contraseña: regla de cuatro tramos.
- Alertas, avatar y botón de tema (ahora una lámpara de mesa) sin efectos decorativos.
- Auth-layout: hoja del formulario y tapete del diagrama; el error es una sacudida de 280 ms.
- Cambio de tema: fundido corto en lugar del círculo de luz.

### Eliminado
- Plancton en canvas, celebración con burbujas, tarjeta de vidrio con luz que seguía al cursor, botón magnético, onda de agua, halos en bucle, morph líquido, saludo letra por letra y la entrada en cascada.
- Tokens sin uso y alias del diseño anterior.

### Corregido
- `/design` no tenía región `main` (axe: `landmark-one-main`).
- Tramos del medidor de contraseña demasiado delgados.
- Detalle de los nodos fuera de la caja y texto encimado con la tapa del cilindro.

## 2026-10-06

- Login y registro con la dirección visual "Bioluminiscencia".
- Preparación del despliegue en Vercel.
- Base inicial: frontend y backend conectados con base de datos e IA.
