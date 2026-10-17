# Componentes

Todos son standalone, con `ChangeDetectionStrategy.OnPush`, `input()` / `output()` y signals. Solo usan tokens de `tokens.css`. Se pueden ver en todos sus estados en `/design`.

## Diagrama (`app/diagrama/`)

### `ui-diagrama`

Diagrama de arquitectura en notación C4, dibujado en SVG sin librerías. Es el lienzo del producto: lo usan el acceso, `/app` y `/design`.

| Input | Tipo | Descripción |
|---|---|---|
| `nodos` | `NodoDiagrama[]` (requerido) | Cajas con posición, forma, título, tipo, detalle, filas, estado y marca |
| `aristas` | `AristaDiagrama[]` | Conexiones entre nodos (o desde una fila de un nodo) |
| `descripcion` | `string` (requerido) | Texto para lectores de pantalla; el SVG se anuncia como una sola imagen |
| `filaActiva` | `string \| null` | Id de la fila resaltada (el campo enfocado) |
| `dibujar` | `boolean` | Al aparecer, el diagrama se dibuja nodo por nodo |
| `seleccionable` | `boolean` | Un clic en un nodo emite `nodoClic` con su id (cursor de mano) |

| Output | Tipo | Descripción |
|---|---|---|
| `nodoClic` | `string` | Id del nodo clicado (solo con `seleccionable`) |

Cada nodo lleva un `<title>` con `tituloCompleto` (o el título): el navegador lo muestra como tooltip. Una fila puede traer su propio `glifo` (en clases, la visibilidad `+` o `−`); sin él, el glifo sale del estado como siempre.

| Método | Qué hace |
|---|---|
| `recorrer(ids, msPorArista = 360)` | Un paquete viaja por las aristas indicadas, en orden. Devuelve una promesa. No anima con movimiento reducido ni con la pestaña oculta. |

**Formas** (`FormaNodo`): `persona`, `componente` (con las pestañas de UML), `contenedor`, `base-datos` (cilindro), `externo` (relleno gris).

**Estados del nodo** (`EstadoNodo`):

| Estado | Cómo se ve |
|---|---|
| `normal` | Contorno de tinta del color del texto |
| `trabajando` | Contorno en el primario, discontinuo y avanzando |
| `ok` | Contorno verde |
| `error` | Contorno rojo; la `marca` dice el código (por ejemplo `401`) |
| `caido` | Contorno rojo discontinuo; la `marca` dice el motivo ("sin respuesta") |

**Estados de la fila** (`EstadoFila`): `vacia` ○, `llena` ●, `ok` ✓ (verde), `error` ✕ (rojo). El glifo acompaña al color.

**Estados de la arista** (`EstadoArista`): `lapiz` (discontinua, pendiente), `tinta` (se dibuja de origen a destino), `error` (roja, con un hueco y una ✕ en el medio).

**Cambios del diff** (campo opcional `cambio` en nodos y aristas, más `fantasma`):

| Cambio | Cómo se ve |
|---|---|
| `agregado` | Trazo verde (`--color-exito`), más grueso |
| `modificado` | Trazo ámbar (`--color-aviso`), discontinuo |
| `eliminado` | Trazo rojo (`--color-error`), punteado |
| `fantasma` | Opacidad 0,45: eliminado, mostrado en la vista Comparar |

Sin `cambio`, el nodo o la arista se ven exactamente como antes: el login y `/design` no cambian.

La geometría (alto de cada nodo, rutas ortogonales, carriles para las aristas que salen de filas, punto medio y punta de flecha) son funciones puras en `modelo.ts`: no miden el DOM.

### `ui-diagrama-secuencia`

Diagrama de secuencia en SVG: cajas de participantes arriba, líneas de vida discontinuas y mensajes numerados de arriba abajo. Usa las mismas clases de cambio que `ui-diagrama`.

| Input | Tipo | Descripción |
|---|---|---|
| `layout` | `LayoutSecuencia` (requerido) | Participantes y mensajes ya ubicados por `layoutSecuencia` o `vistaDiffSecuencia` |
| `descripcion` | `string` (requerido) | Texto para lectores de pantalla |

### `ui-detalle-nodos`

Panel "Detalle" (`diagrama/detalle/`): un `<details>` por nodo con el nombre completo, `[Categoría: tecnología]`, descripción, archivo, atributos, métodos y, si el nodo no está en el código, el aviso en `--color-error`.

| Input | Tipo | Descripción |
|---|---|---|
| `diagrama` | `Diagram` (requerido) | El diagrama actual |
| `abierto` | `string \| null` | Id del nodo cuyo detalle se abre (y se desplaza a la vista) |

### `ui-leyenda`

Sin inputs. Explica los tres trazos de arista con texto: Pendiente, Confirmada, Falló.

## Base (`app/ui/`)

### `ui-button`

| Input | Tipo | Por defecto |
|---|---|---|
| `variante` | `'primario' \| 'secundario' \| 'fantasma' \| 'peligro'` | `'primario'` |
| `tipo` | `'button' \| 'submit'` | `'button'` |
| `tamano` | `'normal' \| 'compacto'` | `'normal'` (48 px; compacto 44 px) |
| `cargando` | `boolean` | `false` |
| `textoCargando` | `string` | `'Cargando…'` |
| `deshabilitado` | `boolean` | `false` |
| `anchoCompleto` | `boolean` | `false` |
| `etiqueta` | `string \| null` | Etiqueta accesible para botones de solo ícono |

Estados: hover (solo con puntero), foco (anillo de tinta), presionado (baja 1 px), deshabilitado (50 % y `not-allowed`), cargando (el texto cambia a `textoCargando` dentro de un `role="status"`, una arista se traza en bucle, `aria-busy` y el clic no hace nada).

Método público: `enfocar()`.

### `ui-text-field`

Compatible con Reactive Forms (`ControlValueAccessor`).

| Input / output | Tipo | Descripción |
|---|---|---|
| `label` | `string` (requerido) | Siempre visible, arriba del campo |
| `clave` | `string \| null` | Nombre del control en el código (por ejemplo `email`); se muestra a la derecha del label y es el nombre de su fila en el diagrama. `aria-hidden`: es una referencia visual. |
| `tipo` | `'text' \| 'email'` | `email` agrega `inputmode="email"` |
| `autocomplete` | `string` | Por defecto `'off'` |
| `icono` | `NombreIcono \| null` | Ícono decorativo a la izquierda |
| `ayuda` | `string \| null` | Texto bajo el campo, enlazado con `aria-describedby` |
| `error` | `string \| null` | Mensaje ya traducido; activa `aria-invalid` y reemplaza la ayuda |
| `multilinea` | `boolean` | Usa `<textarea>` |
| `opcional` | `boolean` | Agrega "(opcional)" al label |
| `maxlength` | `number \| null` | |
| `enfoque` (output) | `boolean` | Emite `true` al enfocar y `false` al salir |

Estados: reposo (borde `--color-borde`), hover, foco (borde de tinta y anillo por fuera), error (borde rojo, ícono rojo, mensaje con ícono), deshabilitado.

Método público: `enfocar()`.

### `ui-password-field`

Comparte estilos (`campo.css`) con `ui-text-field`.

| Input / output | Tipo | Descripción |
|---|---|---|
| `label` | `string` | Por defecto `'Contraseña'` |
| `clave` | `string \| null` | Igual que en `ui-text-field` |
| `autocomplete` | `'current-password' \| 'new-password'` | |
| `ayuda`, `error` | `string \| null` | |
| `conMedidor` | `boolean` | Muestra `ui-strength-meter` cuando hay valor |
| `enfoque` (output) | `boolean` | |

Botón de mostrar u ocultar con `aria-label` y `aria-pressed`. Cambia el tipo del input sin perder el foco ni la posición del cursor. El aviso de Bloq Mayús se anuncia con `aria-live`.

### `ui-strength-meter`

| Input | Tipo |
|---|---|
| `password` | `string` |

Regla de cuatro tramos que se entintan según el nivel (`core/fuerza.ts`). El nivel débil usa el color de error. El texto ("Fortaleza: Aceptable. Mezcla mayúsculas…") se anuncia con `aria-live`; la regla es `aria-hidden`.

### `ui-codigo`

| Input | Tipo | Descripción |
|---|---|---|
| `archivo` | `string` (requerido) | Nombre en la pestaña |
| `lineas` | `LineaCodigo[]` (requerido) | `{ texto, id? }` |
| `activa` | `string \| null` | Resalta las líneas con ese `id` |

Resaltado mínimo de palabras clave, cadenas y comentarios. Es una vista de apoyo del diagrama, así que el `<pre>` es `aria-hidden`.

### `ui-editor`

Editor de código liviano: pestañas por archivo y un `textarea` con números de línea, en `--font-codigo`. Sin CodeMirror ni Monaco (ver [decisiones/0005](decisiones/0005-editor-textarea-propio.md)).

| Input / output | Tipo | Descripción |
|---|---|---|
| `archivos` | `model<ArchivoEditor[]>` (requerido) | `{ nombre, contenido }` de cada pestaña; emite `archivosChange` en cada cambio |

- `+` agrega un archivo (`archivo.js`, `archivo-2.js`…), hasta 10; doble clic renombra (Enter confirma, Esc cancela); `×` quita, si hay más de uno.
- Tab inserta dos espacios; Esc y después Tab sale del editor, así el teclado nunca queda atrapado.
- Si el contenido parece de otro lenguaje que el de la extensión (`lenguaje.ts`: Python, JavaScript, TypeScript, Java, C#, Go, PHP y Ruby), muestra "Parece Python, pero la pestaña se llama index.js." con un botón para renombrarla.
- Pestañas con `role="tab"` y `aria-selected`; el `textarea` se anuncia como "Código de <archivo>" y está descrito por la línea de ayuda.

### `ui-alert`

| Input | Tipo |
|---|---|
| `tipo` | `'error' \| 'exito' \| 'info' \| 'aviso'` |
| `titulo` | `string \| null` |

Nota con borde lateral del color del tipo y un ícono. Los errores usan `role="alert"`; el resto, `role="status"`.

### `ui-avatar`

| Input | Tipo |
|---|---|
| `iniciales` | `string` (requerido) |

Las iniciales en un nodo de tinta. Tamaño con `--avatar-tamano` (44 px por defecto). Es `aria-hidden`: el nombre se muestra al lado.

### `ui-icon`

| Input | Tipo |
|---|---|
| `nombre` | `NombreIcono` (requerido) |

Íconos propios en línea, trazo de 1.8 px. Siempre decorativos: el texto accesible lo pone el elemento que los contiene.

### `ui-theme-toggle`

Sin inputs. La lámpara de la mesa: el cono de luz está encendido en modo claro y apagado en oscuro. `aria-label` dice a qué modo cambia.

## Plantilla

### `app-barra`

Barra superior de `/app` y `/historial` (`layouts/barra-app/`): marca, enlace al historial, tema, perfil y cerrar sesión. Sin inputs. En pantallas de 480 px o menos oculta el avatar para que todo quepa sin desbordar.

### `app-auth-layout`

Slots: `[auth-encabezado]`, contenido por defecto (el formulario), `[auth-pie]` y `[auth-lienzo]` (lo que va sobre el tapete).

Método público: `sacudir()`, una sacudida de 280 ms del formulario cuando un envío falla. No hace nada con movimiento reducido.
