// El login como demostración del producto: a partir del estado del formulario se arma el
// diagrama de su propia arquitectura (formulario → AuthService → API → tabla usuarios) y el
// fragmento de código del que sale. Funciones puras: la página solo les pasa el estado.
import { AristaDiagrama, EstadoFila, NodoDiagrama } from '../../diagrama/modelo';
import { LineaCodigo } from '../../ui/codigo/codigo';
import type { Modo } from './acceso';

export type CampoDiagrama = 'nombre' | 'email' | 'password';

export interface EstadoCampo {
  texto: string;
  valido: boolean;
  mostrarError: boolean;
}

export type Instantanea = Record<CampoDiagrama, EstadoCampo>;

const MAX_VALOR = 18;

export function camposDe(modo: Modo): CampoDiagrama[] {
  return modo === 'registro' ? ['nombre', 'email', 'password'] : ['email', 'password'];
}

function valorVisible(campo: CampoDiagrama, texto: string): string {
  const valor = campo === 'password' ? '•'.repeat(Math.min(texto.length, 12)) : texto;
  return valor.length > MAX_VALOR ? `${valor.slice(0, MAX_VALOR - 1)}…` : valor;
}

function estadoFila(campo: EstadoCampo): EstadoFila {
  if (campo.valido) return 'ok';
  if (campo.mostrarError) return 'error';
  return campo.texto ? 'llena' : 'vacia';
}

export function nodosAcceso(modo: Modo, estado: Instantanea): NodoDiagrama[] {
  const campos = camposDe(modo);
  const registro = modo === 'registro';
  // El formulario crece una fila en registro; los nodos de abajo se desplazan lo mismo.
  const extra = registro ? 20 : 0;
  return [
    { id: 'persona', titulo: 'Tú', tipo: 'Persona', forma: 'persona', x: 40, y: 0, ancho: 120 },
    {
      id: 'formulario',
      titulo: 'Formulario de acceso',
      tipo: 'Componente: Angular',
      forma: 'componente',
      x: 0,
      y: 92,
      ancho: 250,
      filas: campos.map((campo) => ({
        id: campo,
        texto: `${campo} = "${valorVisible(campo, estado[campo].texto)}"`,
        estado: estadoFila(estado[campo]),
      })),
    },
    {
      id: 'auth',
      titulo: 'AuthService',
      tipo: 'Servicio',
      forma: 'contenedor',
      x: 130,
      y: 262 + extra,
      ancho: 270,
      detalle: registro ? 'registrar(nombre, email, password)' : 'login(email, password)',
    },
    {
      id: 'api',
      titulo: 'API de sesión',
      tipo: 'Contenedor: Express',
      forma: 'contenedor',
      x: 130,
      y: 388 + extra,
      ancho: 270,
      detalle: registro ? 'POST /api/auth/registro' : 'POST /api/auth/login',
    },
    {
      id: 'db',
      titulo: 'usuarios',
      tipo: 'Tabla: PostgreSQL',
      forma: 'base-datos',
      x: 0,
      y: 514 + extra,
      ancho: 230,
      detalle: registro ? 'INSERT INTO usuarios' : 'SELECT … WHERE email',
    },
  ];
}

export function aristasAcceso(modo: Modo, estado: Instantanea): AristaDiagrama[] {
  const campos = camposDe(modo);
  const todoValido = campos.every((campo) => estado[campo].valido);
  const algoEscrito = campos.some((campo) => estado[campo].texto);
  return [
    {
      id: 'escribe',
      de: 'persona',
      a: 'formulario',
      estado: algoEscrito ? 'tinta' : 'lapiz',
      etiqueta: 'escribe',
    },
    ...campos.map((campo): AristaDiagrama => ({
      id: `campo-${campo}`,
      de: 'formulario',
      deFila: campo,
      a: 'auth',
      estado: estado[campo].valido ? 'tinta' : 'lapiz',
    })),
    {
      id: 'http',
      de: 'auth',
      a: 'api',
      estado: todoValido ? 'tinta' : 'lapiz',
      etiqueta: 'HTTP + JSON',
    },
    { id: 'sql', de: 'api', a: 'db', estado: 'lapiz', etiqueta: 'SQL' },
  ];
}

export function codigoAcceso(modo: Modo): LineaCodigo[] {
  if (modo === 'registro') {
    return [
      { texto: 'form = fb.group({' },
      { texto: "  nombre: ['', required],", id: 'nombre' },
      { texto: "  email: ['', [required, email]],", id: 'email' },
      { texto: "  password: ['', [required, minLength(8)]],", id: 'password' },
      { texto: '});' },
      { texto: 'enviar() {', id: 'enviar' },
      { texto: '  // POST /api/auth/registro', id: 'enviar' },
      { texto: '  return auth.registrar(', id: 'enviar' },
      { texto: '    nombre, email, password);', id: 'enviar' },
      { texto: '}' },
    ];
  }
  return [
    { texto: 'form = fb.group({' },
    { texto: "  email: ['', [required, email]],", id: 'email' },
    { texto: "  password: ['', required],", id: 'password' },
    { texto: '});' },
    { texto: 'enviar() {', id: 'enviar' },
    { texto: '  // POST /api/auth/login', id: 'enviar' },
    { texto: '  return auth.login(email, password);', id: 'enviar' },
    { texto: '}' },
  ];
}

const NOMBRES: Record<CampoDiagrama, string> = {
  nombre: 'nombre',
  email: 'correo',
  password: 'contraseña',
};

// Resumen para lectores de pantalla: qué campos ya están listos.
export function describirAcceso(modo: Modo, estado: Instantanea): string {
  const campos = camposDe(modo);
  const listos = campos.filter((campo) => estado[campo].valido).map((c) => NOMBRES[c]);
  const pendientes = campos.filter((campo) => !estado[campo].valido).map((c) => NOMBRES[c]);
  const partes = [
    'Diagrama de este formulario: Tú, Formulario de acceso, AuthService, API de sesión y tabla usuarios.',
    listos.length ? `Listos: ${listos.join(', ')}.` : '',
    pendientes.length ? `Pendientes: ${pendientes.join(', ')}.` : 'Todo listo para enviar.',
  ];
  return partes.filter(Boolean).join(' ');
}

// Qué pasó con la última petición. Cambia el diagrama encima del estado del formulario.
export type Fase =
  | { tipo: 'reposo' }
  | { tipo: 'enviando' }
  | { tipo: 'ok'; codigo: number }
  | { tipo: 'error'; codigo: number };

// Errores que se deciden después de consultar la tabla (credenciales o correo repetido).
const ERRORES_DE_TABLA = [401, 409];

export function aplicarFase(
  nodos: NodoDiagrama[],
  aristas: AristaDiagrama[],
  fase: Fase,
): { nodos: NodoDiagrama[]; aristas: AristaDiagrama[] } {
  if (fase.tipo === 'reposo') return { nodos, aristas };
  const nodo = (id: string, cambios: Partial<NodoDiagrama>) => (n: NodoDiagrama) =>
    n.id === id ? { ...n, ...cambios } : n;
  const arista = (id: string, cambios: Partial<AristaDiagrama>) => (a: AristaDiagrama) =>
    a.id === id ? { ...a, ...cambios } : a;

  switch (fase.tipo) {
    case 'enviando':
      return {
        nodos: nodos.map(nodo('api', { estado: 'trabajando' })),
        aristas: aristas.map(arista('http', { estado: 'tinta' })),
      };
    case 'ok':
      return {
        nodos: nodos
          .map(nodo('api', { estado: 'ok', marca: String(fase.codigo) }))
          .map(nodo('db', { estado: 'ok', marca: '✓' })),
        aristas: aristas
          .map(arista('http', { estado: 'tinta' }))
          .map(arista('sql', { estado: 'tinta' })),
      };
    case 'error':
      // Sin respuesta: la API se dibuja discontinua y se corta la llamada HTTP.
      if (fase.codigo === 0) {
        return {
          nodos: nodos.map(nodo('api', { estado: 'caido', marca: 'sin respuesta' })),
          aristas: aristas.map(arista('http', { estado: 'error' })),
        };
      }
      return {
        nodos: nodos.map(nodo('api', { estado: 'error', marca: String(fase.codigo) })),
        aristas: aristas
          .map(arista('http', { estado: 'tinta' }))
          .map(
            ERRORES_DE_TABLA.includes(fase.codigo) ? arista('sql', { estado: 'error' }) : (a) => a,
          ),
      };
  }
}
