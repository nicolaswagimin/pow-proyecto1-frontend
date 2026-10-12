# Animaciones

Regla: cada animación cuenta algo del producto o responde a una acción de la persona. No hay movimiento decorativo, ni efectos que sigan al cursor, ni nada que se anime solo en bucle sin motivo.

Con `prefers-reduced-motion: reduce`, `base.css` lleva toda duración a 1 ms y además el diagrama lo comprueba en TypeScript para no lanzar el recorrido del paquete ni el dibujo inicial. Las animaciones en bucle se pausan cuando la pestaña no se ve (`visibilitychange`).

| Animación | Dónde | Qué comunica | Duración | Con movimiento reducido |
|---|---|---|---|---|
| Dibujo inicial | `ui-diagrama` con `dibujar` | El diagrama se genera a partir del código: cada contorno se traza, se rellena y después aparecen las aristas. Es el único momento orquestado de la pantalla. | 700 ms por contorno, 110 ms entre nodos, aristas a los 900 ms | El diagrama aparece completo |
| Arista de lápiz a tinta | `ui-diagrama` | Una dependencia quedó satisfecha (un campo válido, la llamada lista, la consulta confirmada) | `--duracion-escena` (700 ms) | Cambio instantáneo |
| Fila que se llena | `ui-diagrama` | El diagrama reacciona al código: la fila muestra el valor 300 ms después de la última tecla (el debounce del producto) | Debounce de 300 ms, sin transición | Igual (no es movimiento) |
| Resaltado de fila y de línea | `ui-diagrama`, `ui-codigo` | Qué parte del código y del diagrama corresponde al campo enfocado | `--duracion-media` | Cambio instantáneo |
| Recorrido del paquete | `Diagrama.recorrer()` | El flujo de datos real de la petición: formulario → AuthService → API → tabla | 360 ms por arista | No se anima; el estado final se muestra igual |
| Nodo trabajando | `ui-diagrama` (`trabajando`) | La API está procesando la petición | Bucle de 1.2 s mientras dura la petición | Contorno discontinuo quieto |
| Arista cortada y marca | `ui-diagrama` (`error`, `caido`) | Dónde falló: 401 o 409 cortan la consulta a `usuarios`; sin backend se corta la llamada HTTP | Transición de 700 ms | Cambio instantáneo |
| Reacomodo al pasar a registro | `ui-diagrama` | El código cambió (se agregó `nombre`) y el diagrama se actualiza solo: el componente crece y los nodos de abajo se desplazan | `--duracion-escena` | Cambio instantáneo |
| Entrada del campo Nombre | `acceso` (`.brota`) | El campo nuevo es la misma fila que acaba de aparecer en el diagrama | `--duracion-lenta` | Aparece sin desplazamiento |
| Arista de carga del botón | `ui-button` | La petición va en camino; acompaña al texto que cambia ("Iniciando sesión…") | Bucle de 900 ms mientras carga | Arista quieta; el texto sigue cambiando |
| Sacudida del formulario | `AuthLayout.sacudir()` | El envío no se pudo hacer; el mensaje explica por qué | 280 ms | No se sacude; solo el mensaje |
| Ojo de la contraseña | `ui-password-field` | Contraseña visible u oculta | `--duracion-lenta` con resorte | Cambio instantáneo |
| Tramos de la regla | `ui-strength-meter` | Nivel de fortaleza | `--duracion-media` | Cambio instantáneo |
| Registro que entra o sale | `/app` (`animate.enter` / `animate.leave`) | Qué cambió en la lista | 420 ms / 220 ms | Cambio instantáneo |
| Cambio de tema | `TemaService` (View Transitions) | Encender o apagar la lámpara de la mesa | Fundido de 220 ms | Sin transición |

## Qué se quitó del diseño anterior y por qué

| Antes | Motivo |
|---|---|
| Plancton en canvas que huía del cursor | Decorativo y trasladable a cualquier producto |
| Tarjeta de vidrio con luz que seguía al cursor | Efecto de cursor sin información |
| Botón magnético y onda de agua al hacer clic | Efecto de cursor; la respuesta ahora es el cambio de texto y de estado |
| Halo del botón y orbe que latían en bucle | Movimiento sin acción que lo provoque |
| Morph líquido entre login y registro | Lo reemplaza el reacomodo del diagrama, que sí explica qué cambió |
| Burbujas y check de celebración | El éxito es el diagrama completo en tinta antes de entrar |
| Saludo letra por letra en `/app` | Decorativo |
