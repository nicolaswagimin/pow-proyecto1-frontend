# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Los commits siguen Conventional Commits.

## [Sin publicar] · 2026-10-12

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
