// Diagrama C4 de esta misma app: navegador → API → Neon y Gemini. Cada arista se entinta o se
// corta según lo que responde /api/health, así el estado del sistema se lee como arquitectura.
import { AristaDiagrama, NodoDiagrama } from '../../diagrama/modelo';
import { Estado } from '../../services/api.service';

// Los dominios de producción son largos: se recortan para que quepan en el nodo.
function corto(texto: string): string {
  return texto.length > 26 ? `${texto.slice(0, 25)}…` : texto;
}

export function nodosApp(estado: Estado | null, cargando: boolean, apiHost: string): NodoDiagrama[] {
  const sinApi = !cargando && !estado;
  return [
    {
      id: 'web',
      titulo: 'Navegador',
      tipo: 'Contenedor: Angular',
      forma: 'contenedor',
      x: 90,
      y: 0,
      ancho: 190,
      detalle: corto(location.host),
      estado: 'ok',
    },
    {
      id: 'api',
      titulo: 'API',
      tipo: 'Contenedor: Express',
      forma: 'contenedor',
      x: 90,
      y: 116,
      ancho: 190,
      detalle: corto(apiHost),
      estado: cargando ? 'trabajando' : sinApi ? 'caido' : 'ok',
      marca: sinApi ? 'sin respuesta' : undefined,
    },
    {
      id: 'db',
      titulo: 'Neon',
      tipo: 'PostgreSQL',
      forma: 'base-datos',
      x: 0,
      y: 252,
      ancho: 170,
      detalle: 'DATABASE_URL',
      estado: cargando || sinApi ? 'normal' : estado?.db ? 'ok' : 'caido',
      marca: estado && !estado.db ? 'no responde' : undefined,
    },
    {
      id: 'ia',
      titulo: 'Gemini',
      tipo: 'Sistema externo',
      forma: 'externo',
      x: 200,
      y: 252,
      ancho: 170,
      detalle: 'GEMINI_API_KEY',
      estado: cargando || sinApi ? 'normal' : estado?.ia ? 'ok' : 'caido',
      marca: estado && !estado.ia ? 'sin configurar' : undefined,
    },
  ];
}

export function aristasApp(estado: Estado | null, cargando: boolean): AristaDiagrama[] {
  const segun = (ok: boolean | undefined) => (cargando ? 'lapiz' : ok ? 'tinta' : 'error');
  return [
    { id: 'web-api', de: 'web', a: 'api', estado: segun(estado?.ok), etiqueta: 'HTTPS + JWT' },
    { id: 'api-db', de: 'api', a: 'db', estado: segun(estado?.db), etiqueta: 'SQL' },
    { id: 'api-ia', de: 'api', a: 'ia', estado: segun(estado?.ia), etiqueta: 'HTTPS' },
  ];
}

export function describirApp(estado: Estado | null, cargando: boolean): string {
  if (cargando) return 'Arquitectura de esta app. Revisando la conexión con el backend.';
  if (!estado) return 'Arquitectura de esta app. El backend no responde.';
  const parte = (nombre: string, ok: boolean) => `${nombre}: ${ok ? 'conectada' : 'sin conexión'}.`;
  return `Arquitectura de esta app. Navegador conectado con la API. ${parte('Base de datos', estado.db)} ${parte('IA', estado.ia)}`;
}
