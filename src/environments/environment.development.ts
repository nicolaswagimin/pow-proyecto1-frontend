// Se usa con `ng serve` (configuración development).
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001/api',
  // Servicio de diagramas por gRPC-Web (mismo servidor, sin el prefijo /api).
  grpcUrl: 'http://localhost:3001',
};
