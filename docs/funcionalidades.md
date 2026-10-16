# Funcionalidades

Qué hace cada pantalla de CodeToDiagram.

## `/login` y `/registro`

Acceso con correo y contraseña. El diagrama de la derecha muestra en vivo cómo viaja la sesión mientras llenas el formulario (ver [decisiones/0002](decisiones/0002-el-login-es-una-demostracion-del-producto.md)). Sin cambios en esta versión.

## `/app`: espacio de trabajo

Dos columnas en escritorio (código | diagrama) y una debajo de la otra en móvil.

### Tu código

- **Editor con pestañas**: un archivo por pestaña, hasta 10. `+` agrega uno, doble clic renombra, `×` lo quita. Tab inserta dos espacios; Esc y luego Tab sale del editor (no atrapa el foco).
- **Tipo de diagrama**: *Arquitectura* (qué piezas hay y cómo se conectan) o *Secuencia* (qué pasa, paso a paso, en un flujo concreto).
- **¿Qué quieres entender?** (opcional, hasta 300 caracteres): enfoca el diagrama en una pregunta, por ejemplo "¿cómo se valida el login?". Así el diagrama tiene como mucho 12 nodos y responde algo concreto en lugar de mapearlo todo.
- **Generar diagrama**: pide el primero. Con el editor vacío no se llama a la IA: aparece "Pega algo de código antes de generar."

### El diagrama

- Mientras se genera aparece el progreso que manda el servidor: "Analizando el código…", "Validando el diagrama…" y, si hizo falta, "El primer intento no pasó la validación. Reintentando…".
- **Se actualiza solo**: una vez que hay un diagrama, cada cambio en el código, el tipo o la pregunta lo regenera tras 2 segundos sin escribir. Si el contenido no cambió, no se pide nada; entre dos regeneraciones automáticas pasan al menos 5 segundos. Mientras llega la nueva versión, la anterior queda visible pero atenuada.
- **Diff**: al regenerar después de una edición se resaltan los cambios: verde para lo agregado, ámbar con trazo discontinuo para lo modificado y rojo punteado para lo eliminado. El resumen dice, por ejemplo, "2 agregados · 1 modificado".
- **Antes / Después / Comparar**: *Antes* muestra la versión anterior con lo eliminado marcado; *Después*, la nueva con lo agregado y modificado; *Comparar*, las dos juntas, con lo eliminado tenue.
- **Guardar** lo agrega al historial con su código. **Exportar SVG** y **Exportar PNG** descargan el diagrama tal como se ve.

### Errores

- Si la IA devuelve algo inválido o el servidor responde con error, **no se dibuja nada a medias**: queda el diagrama anterior (si había) y una alerta con el motivo y un botón **Reintentar**.
- Si el servidor no responde (Render dormido), el progreso dice "El servidor está despertando, reintentando (1/3)…" y lo intenta 3 veces, cada 8 segundos. Si sigue sin responder: "No pudimos conectar con el servidor…".
- **Reintentar** repite la última acción: volver a generar o volver a abrir el diagrama guardado.
- Si la sesión expiró, vuelve a `/login`.

## `/historial`

Los diagramas guardados, del más reciente al más antiguo, con su tipo, cantidad de nodos y fecha.

- **Abrir** lleva a `/app` con el código, la pregunta y el diagrama. Ese diagrama es el "Antes" de la próxima edición.
- **Eliminar** pide confirmación en la misma tarjeta antes de borrar.

## `/design`

Guía viva del design system. Sin cambios.
