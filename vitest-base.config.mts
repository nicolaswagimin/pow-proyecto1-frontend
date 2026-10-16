import { defineConfig } from 'vitest/config';

// Configuración extra de Vitest para `ng test`.
export default defineConfig({
  test: {
    globals: true,
    // Angular entrega a Vitest archivos compilados con nombres estables; con la caché de módulos
    // activada, Vitest reutilizaba versiones viejas y las pruebas no veían los cambios.
    fsModuleCache: false,
  },
});
