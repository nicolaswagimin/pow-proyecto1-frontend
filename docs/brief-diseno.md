# Brief de diseño · Proyecto 1 · Bioluminiscencia

## Encargo
- **Pantalla:** acceso (login y registro). Trabajo principal: que alguien entre o cree su cuenta en segundos, y que la primera impresión sea espectacular.
- **Quién la usa:** un profesor evaluando el proyecto (escritorio) y cualquier persona desde el móvil.
- **Qué debe sentir:** asombro, calma eléctrica, curiosidad (quiere mover el mouse para ver qué pasa).
- **Restricciones:** contraste AA, `prefers-reduced-motion`, 60 fps (solo `transform`/`opacity` o canvas), modo claro/oscuro, sin librerías de UI. El tema del proyecto aún no se conoce: el nombre vive en `nombreApp`.
- **Prioridad del usuario:** muchas animaciones en todos los elementos (sustituye la regla de "un solo momento memorable").

## Dirección elegida: Bioluminiscencia
El fondo del océano de noche: la interfaz brilla como plancton y medusas, y la luz responde al cursor como al tocar el agua. En claro, aguas someras iluminadas por el sol.

### Paleta (contraste verificado)
| Token | Oscuro (abismo) | Claro (aguas someras) |
|---|---|---|
| fondo | `#04121F` | `#E3F6F8` |
| superficie (vidrio) | `#0A2233` al 60 % | `#FFFFFF` al 70 % |
| texto | `#E6FBFF` (17.6:1) | `#06283A` (13.7:1) |
| texto-2 | `#8FB8C9` (8.9:1) | `#3D6475` (6.4:1) |
| primario | `#2EF2E0`, texto botón `#04121F` (13.4:1) | `#007C8A`, texto botón `#FFFFFF` (4.9:1) |
| acento | `#FF4FD8` | `#B0189A` |
| error | `#FF6B7A` | `#C0263D` |
| éxito | `#5CFFA8` | `#0F7A4A` |

### Tipografía (solo estos pesos)
- **Syne** 700 y 800: títulos. Ancha, orgánica, futurista.
- **Manrope** 400, 500 y 700: texto, labels y botones.

### Composición
Escritorio
```
┌──────────────────────────────────────────────────────────────┐
│ ◉ nombreApp            ·  ˚  ·    ✦      ·   ˚   [☾/☀]      │
│      ·    ˚       ╭───────────────────────────╮    ·        │
│  ˚        ·       │  ≋ luz que sigue al mouse │       ˚     │
│     ·             │  Bienvenido de vuelta     │  ·          │
│          ✦        │  Entra a tu cuenta        │       ·     │
│   ·        ˚      │  ┌ Correo ─────────────┐  │    ˚        │
│        ·          │  └─────────────────────┘  │        ·    │
│  ˚          ·     │  ┌ Contraseña ──────👁─┐  │  ·          │
│      ·            │  └─────────────────────┘  │      ˚      │
│           ˚       │  [   Iniciar sesión    ]  │   ·         │
│  ·     ✦          │  ¿Sin cuenta? Crear una   │        ✦    │
│       ·     ˚     ╰───────────────────────────╯  ˚          │
│  ∿∿∿∿∿∿∿∿∿ ondas de luz en la base ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿ │
└──────────────────────────────────────────────────────────────┘
```
Móvil
```
┌────────────────────┐
│ ◉ nombreApp   [☾]  │
│  ·  ˚    ✦    ·    │
│╭──────────────────╮│
││ Bienvenido de    ││
││ vuelta           ││
││┌ Correo ───────┐ ││
││└───────────────┘ ││
││┌ Contraseña ─👁┐ ││
││└───────────────┘ ││
││[ Iniciar sesión ]││
││ Crear una cuenta ││
│╰──────────────────╯│
│ ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿ │
└────────────────────┘
```

### Animaciones
- **Fondo:** plancton en canvas. Partículas luminosas que derivan, huyen del cursor y dejan estela; un clic lanza una onda que las empuja. Hay unas 120 en escritorio y unas 45 en móvil (según el área de pantalla).
- **Entrada:** el abismo se enciende, la tarjeta sube como burbuja y los elementos entran en cascada cada 70 ms.
- **Tarjeta:** vidrio esmerilado con un foco de luz cáustica que sigue al mouse y un borde más brillante del lado cercano.
- **Login ↔ registro:** morph líquido. La forma de la gota cambia con escala elástica, el contenido sale en ola y "Nombre" brota desde dentro.
- **Campos:** label flotante con rebote, luz cian que recorre el borde al enfocar y un ícono que se enciende y pulsa.
- **Botón:** brillo que respira; onda de agua desde el punto del clic; al enviar se vuelve un círculo con partículas orbitando.
- **Medidor de contraseña:** tubo de líquido luminoso con oleaje, de magenta a cian.
- **Mostrar contraseña:** ojo SVG con párpados que se abren y parpadean.
- **Error:** sacudida tipo corriente y mensaje que emerge con destello rojo.
- **Éxito:** burbujas luminosas que suben, anillo de luz y check dibujado; después se funde hacia `/app`.
- **Bienvenida en `/app`:** las partículas convergen en el avatar y el nombre aparece letra por letra.
- **Tema:** un botón donde la luna se hunde en el agua y sale el sol (y al revés), con una onda.

### Rendimiento y accesibilidad
- El canvas se pausa con `visibilitychange` y la cantidad de partículas depende del área de la pantalla.
- Los efectos que siguen al mouse se actualizan dentro de `requestAnimationFrame`.
- En dispositivos táctiles (`hover: none` / `pointer: coarse`) se desactivan la inclinación y el magnetismo.
- Con `prefers-reduced-motion`, el fondo queda estático, las transiciones son fundidos breves y no hay partículas en la celebración.
- El tema recuerda la elección en `localStorage`; la primera vez usa `prefers-color-scheme`.

## Textos
- Login: "Bienvenido de vuelta" / "Entra a tu cuenta para seguir". Botón "Iniciar sesión". Enlace "¿Sin cuenta? Crear una".
- Registro: "Crea tu cuenta" / "Solo te toma un momento". Botón "Crear cuenta". Enlace "¿Ya tienes cuenta? Inicia sesión".
- Errores:
  - "El correo o la contraseña no coinciden."
  - "Ese correo ya tiene una cuenta. Inicia sesión."
  - "La contraseña necesita al menos 8 caracteres."
  - "Escribe un correo válido, como nombre@dominio.com."
  - "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo."
  - "Demasiados intentos. Espera unos minutos y vuelve a intentarlo."

## Direcciones de los otros proyectos (no reutilizar aquí)
- **Constructiva (Proyecto 2):** póster Bauhaus con geometría primaria, giro 3D de dos caras y confeti geométrico.
- **Hora Dorada (Proyecto 3):** atardecer en el desierto con brillo holográfico, panel solar con rebote y estallido solar.

## Cómo re-tematizar
- Cambia los tokens de color en `src/styles/tokens.css` (fondo, superficie, primario, acento). El canvas lee `--color-primario` y `--color-acento`, así que las partículas cambian solas.
- Cambia las familias en `--font-display` y `--font-texto` (y el `<link>` de Google Fonts en `index.html`).
- Cambia `nombreApp` y los textos del saludo.
