# 0002 · El login es una demostración del producto

- **Estado:** aceptada
- **Fecha:** 2026-10-12

## Contexto
El diseño anterior del acceso (plancton, vidrio, confeti) era intercambiable con el de cualquier otra app. La primera pantalla es la que todos ven, incluido el profesor en la sustentación, y es la única que se usa sin cuenta.

## Decisión
El acceso se diagrama a sí mismo. Mientras la persona llena el formulario, al lado se ve el fragmento de código del formulario y su diagrama C4 (Tú → Formulario → AuthService → API → usuarios). Los campos válidos entintan sus aristas, el envío hace viajar un paquete y los errores se dibujan donde ocurren (401, 409, sin respuesta).

## Consecuencias
- Se entiende qué hace el producto antes de tener cuenta.
- Los errores tienen una segunda explicación visual, además del mensaje.
- El estado del diagrama se arma con funciones puras (`diagrama-acceso.ts`) a partir del formulario y de la fase de la petición, igual que el producto armará diagramas desde el JSON de Gemini.
- En móvil no cabe el diagrama completo: se muestra una franja horizontal con los mismos estados.
- El login no debe esperar a la animación: los campos se pueden usar desde el primer instante y el paquete corre en paralelo a la petición.
