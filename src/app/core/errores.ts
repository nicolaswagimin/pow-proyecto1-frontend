import { HttpErrorResponse } from '@angular/common/http';
import { Code, ConnectError } from '@connectrpc/connect';

export type CampoAuth = 'nombre' | 'email' | 'password';
export type ContextoError = 'login' | 'registro' | 'general';

export interface ErrorInterfaz {
  mensaje: string;
  // Campo al que pertenece el error (se muestra junto a él en lugar de arriba).
  campo?: CampoAuth;
  // Acción sugerida que la interfaz ofrece como enlace.
  accion?: 'ir-a-login';
}

// Único lugar donde las respuestas del backend se traducen a mensajes de interfaz.
export function mapearError(err: unknown, contexto: ContextoError = 'general'): ErrorInterfaz {
  if (!(err instanceof HttpErrorResponse)) {
    return { mensaje: 'Algo falló de nuestro lado. Inténtalo de nuevo en unos segundos.' };
  }

  const delServidor: string | undefined = err.error?.error;
  const campo: CampoAuth | undefined = esCampo(err.error?.campo) ? err.error.campo : undefined;

  switch (err.status) {
    case 0:
      return {
        mensaje: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
      };
    case 400:
      return { mensaje: delServidor ?? 'Revisa los datos del formulario.', campo };
    case 401:
      return contexto === 'login'
        ? { mensaje: 'El correo o la contraseña no coinciden.' }
        : { mensaje: 'Tu sesión expiró. Inicia sesión de nuevo.' };
    case 409:
      return { mensaje: 'Ese correo ya tiene una cuenta.', campo: 'email', accion: 'ir-a-login' };
    case 429:
      return {
        mensaje: delServidor ?? 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
      };
    case 502:
      return { mensaje: delServidor ?? 'El servicio externo no respondió. Inténtalo de nuevo.' };
    default:
      if (err.status >= 500) {
        return { mensaje: 'Algo falló de nuestro lado. Inténtalo de nuevo en unos segundos.' };
      }
      return { mensaje: delServidor ?? 'No se pudo completar la acción.' };
  }
}

function esCampo(valor: unknown): valor is CampoAuth {
  return valor === 'nombre' || valor === 'email' || valor === 'password';
}

const MENSAJE_GENERICO = 'Algo falló de nuestro lado. Inténtalo de nuevo en unos segundos.';

// Errores del servicio de diagramas (gRPC-Web). Devuelve null si no hay nada que mostrar (el
// usuario o la app cancelaron la llamada). `despertando` indica que el servidor no respondió:
// en Render, el servicio gratuito tarda hasta un minuto en arrancar, así que vale la pena reintentar.
export function mapearErrorGrpc(err: unknown): (ErrorInterfaz & { despertando?: boolean }) | null {
  if (!(err instanceof ConnectError)) return { mensaje: MENSAJE_GENERICO };

  const sinRespuesta =
    (err.code === Code.Unknown && err.cause instanceof TypeError) ||
    (err.code === Code.Unavailable && /^HTTP 50\d$/.test(err.rawMessage));
  if (sinRespuesta)
    return { mensaje: 'El servidor está despertando, reintentando…', despertando: true };

  switch (err.code) {
    case Code.Canceled:
      return null;
    case Code.Unauthenticated:
      return { mensaje: 'Tu sesión expiró. Inicia sesión de nuevo.' };
    case Code.Unavailable:
    case Code.ResourceExhausted:
    case Code.InvalidArgument:
    case Code.NotFound:
    case Code.Internal:
    case Code.FailedPrecondition:
      return { mensaje: err.rawMessage };
    default:
      return { mensaje: MENSAJE_GENERICO };
  }
}

// Para llamadas que no se reintentan solas: "reintentando…" sería falso, así que se avisa
// directamente que no hubo conexión.
export function sinReintentos<T extends ErrorInterfaz & { despertando?: boolean }>(
  problema: T,
): ErrorInterfaz {
  return problema.despertando
    ? { mensaje: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.' }
    : problema;
}
