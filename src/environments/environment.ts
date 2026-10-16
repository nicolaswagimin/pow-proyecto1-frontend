// Se usa con `ng build` (producción): apunta al backend desplegado en Render.
export const environment = {
  production: true,
  apiUrl: 'https://pow-proyecto1-backend.onrender.com/api',
  // Servicio de diagramas por gRPC-Web (mismo servidor, sin el prefijo /api).
  grpcUrl: 'https://pow-proyecto1-backend.onrender.com',
};
