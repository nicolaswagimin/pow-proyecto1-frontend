# Brief de diseño · CodeToDiagram

## El encargo

- **Producto:** CodeToDiagram, un visualizador reactivo de arquitectura. La persona pega código y la app dibuja un diagrama de módulos, clases, servicios, dependencias y flujo de datos, que se actualiza solo al editar (con debounce). Gemini analiza el código y devuelve nodos y conexiones en JSON; el frontend los dibuja.
- **Pantallas de este trabajo:** acceso (login y registro), bienvenida de `/app` y guía `/design`.
- **Trabajo principal del acceso:** que alguien entre o cree su cuenta en segundos y, mientras lo hace, entienda qué hace el producto.
- **Quién la usa:** estudiantes y desarrolladores que quieren entender o documentar un proyecto; en la sustentación, el profesor.
- **Qué debe sentir:** claridad técnica, control (ve qué pasa con sus datos), curiosidad por el código.
- **Restricciones:** WCAG 2.2 AA, `prefers-reduced-motion`, modo claro y oscuro, móvil, sin librerías de UI ni de diagramas, budgets de `angular.json`.

## El problema que resuelve el rediseño

El diseño anterior ("Bioluminiscencia": plancton en canvas, tarjeta de vidrio con luz que seguía al cursor, botón magnético, burbujas de celebración) no tenía nada que ver con el tema. Varias apps de compañeros usaban casi los mismos recursos. La regla nueva: **el diseño sale del mundo del producto, y ningún elemento debe poder trasladarse a otro producto sin perder sentido.**

## Dirección elegida: Mesa de trazado

La interfaz es la mesa donde un equipo dibuja su arquitectura. Tiene tres materiales:

- **Tapete de corte** verde con retícula: el lienzo donde vive el diagrama.
- **Papel**: la hoja del formulario y el relleno de los nodos.
- **Lápiz y tinta**: una dependencia pendiente se dibuja a lápiz (discontinua); cuando se confirma, se entinta.

La notación es **C4 real**: cada caja dice `Nombre [Tipo]` y el tipo de elemento se lee por la forma (persona, componente con las pestañas de UML, contenedor, cilindro de base de datos, sistema externo), no por un color decorativo.

### Paleta

| Token | Claro (tapete pálido) | Oscuro (tapete verde) |
|---|---|---|
| fondo (tapete) | `#E9EEE9` | `#10211B` |
| superficie (papel) | `#F7F9F6` | `#162B23` |
| texto | `#14231D`: 13.9:1 | `#E8EFE9`: 14.3:1 |
| texto suave | `#4A5F55`: 5.8:1 | `#9DB5A8`: 7.7:1 |
| tinta (primario) | `#8A5300`, texto blanco 6.3:1 | `#F5B33A`, texto `#10211B` 9.1:1 |
| error / éxito | `#B42318` 5.6:1 · `#17703F` 5.2:1 | `#FF7A6E` 6.6:1 · `#6FD99A` 9.6:1 |

Los valores completos y los demás pares de contraste están en [design-system.md](design-system.md).

### Tipografía

- **B612** (400 y 700) para la interfaz. Airbus la diseñó para las pantallas de cabina: está hecha para leer etiquetas técnicas bajo presión, que es lo que hace quien lee un diagrama.
- **B612 Mono** (400 y 700) para el código y el texto de los nodos. Aquí el monoespaciado no es decoración: se muestra código real.

### Composición

```
Escritorio                                         Móvil
┌──────────────────────┬─────────────────────────┐ ┌──────────────────┐
│ CodeToDiagram    [⌂] │ El diagrama sale del…   │ │ CodeToDiagram [⌂]│
│                      │ ┌ acceso.ts ─┐ ┌──────┐ │ │░░░░░░░░░░░░░░░░░░│
│ Inicia sesión        │ │ 1 form = … │ │ Tú   │ │ │ ▭→▭→▭→◯  tapete  │
│ Correo      email    │ │ 2 email: … │ └──┬───┘ │ │ ---- ── ─✕─      │
│ [_______________]    │ └────────────┘ ┌──▼───┐ │ │░░░░░░░░░░░░░░░░░░│
│ Contraseña password  │ ---- ── ─✕─    │Form. │ │ │ Inicia sesión    │
│ [_______________]    │                └──┬───┘ │ │ Correo [_______] │
│ [ Iniciar sesión ]   │      tapete    ┌──▼───┐ │ │ Contraseña [___] │
│ ¿No tienes cuenta?   │                │ API  │ │ │ [Iniciar sesión] │
│                      │                └──┬───┘ │ │ ¿No tienes…?     │
│                      │               ◯usuarios │
└──────────────────────┴─────────────────────────┘
```

Alineación a la izquierda en todo el formulario. El tapete ocupa el resto del ancho en escritorio y se vuelve una franja horizontal en móvil.

### El login es una demostración del producto

1. Al cargar, el diagrama del propio formulario **se dibuja nodo por nodo**: `Tú [Persona]` → `Formulario de acceso [Componente: Angular]` → `AuthService [Servicio]` → `API de sesión [Contenedor: Express]` → `usuarios [Tabla: PostgreSQL]`. Las aristas empiezan a lápiz.
2. Junto al diagrama se ve el fragmento de `acceso.ts` del que sale. Cada campo muestra su nombre en el código (`email`, `password`), que es también el nombre de su fila en el diagrama.
3. Al escribir, la fila del campo muestra su valor (la contraseña enmascarada) 300 ms después de la última tecla, el mismo debounce del producto.
4. Cuando un campo es válido, su arista pasa de lápiz a tinta. Con todos válidos se entinta la llamada `HTTP + JSON`.
5. Al enviar, un paquete recorre las aristas y la API queda "trabajando" (su contorno avanza) hasta la respuesta.
6. Si el login falla, la API muestra `401` y la arista hacia `usuarios` se corta. Si el backend está apagado, la API se dibuja discontinua con "sin respuesta" y se corta la llamada HTTP. El diagrama explica dónde falló.
7. Al pasar a registro, el componente crece una fila (`nombre`) y el resto se reacomoda: el endpoint cambia a `POST /api/auth/registro` y la consulta a `INSERT`. Es el "reactivo" del producto.

### Extensión a `/app`

El área de trabajo es el tapete y los paneles son hojas de papel encima. El estado del sistema deja de ser tres puntos de color: es el **diagrama C4 de la propia app** (Navegador → API → Neon y Gemini), con cada arista entintada o cortada según `/api/health`.

## Revisión contra lo genérico

| Default genérico | Qué se hizo |
|---|---|
| Partículas, auroras, vidrio | Ninguno. El fondo es un tapete de corte con retícula, el material de quien dibuja planos. |
| Tarjeta 3D o luz que sigue al cursor, botón magnético | No hay ningún efecto de cursor. Todo el movimiento responde al formulario. |
| Confeti al entrar | El éxito es el diagrama completo en tinta (la consulta SQL confirmada) y la navegación. |
| Plano azul (cliché de "arquitectura") | Se usa el verde del tapete y el ámbar de la tinta. El plano se reinventa como dibujo a lápiz y tinta. |
| Monoespaciado de adorno en etiquetas | Solo se usa donde hay código: el fragmento, los nodos y el nombre del control. |

## Direcciones descartadas

- **Pizarra de arquitectura:** marcadores de colores sobre pizarra blanca, como en una sesión de diseño. Se descartó porque el trazo de marcador es impreciso y la notación C4 pide líneas limpias.
- **Editor de código oscuro con minimapa:** todo el login dentro de un IDE falso. Se descartó porque convierte el formulario en un disfraz y se acerca al cliché de "fondo negro con acento neón".

## Textos

- Login: "Inicia sesión" / "Mientras llenas el formulario, el diagrama muestra cómo viaja tu sesión." Botón "Iniciar sesión". Enlace "¿No tienes cuenta? Crea una".
- Registro: "Crea tu cuenta" / "Mientras lo llenas, el diagrama muestra cómo se guarda tu cuenta." Botón "Crear cuenta". Enlace "¿Ya tienes cuenta? Inicia sesión".
- Lienzo: "El diagrama sale del código de este formulario y cambia mientras escribes."
- Errores: "El correo o la contraseña no coinciden.", "Ese correo ya tiene una cuenta.", "La contraseña necesita al menos 8 caracteres.", "Escribe un correo válido, como nombre@dominio.com.", "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo."
