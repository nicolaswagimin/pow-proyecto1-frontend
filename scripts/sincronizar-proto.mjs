// Copia el contrato gRPC del backend (fuente única) a este repo.
//   npm run proto:sync   → copia ../backend/proto a ./proto
//   npm run proto:check  → falla (código 1) si las dos copias no son idénticas
// Ruta del backend configurable con BACKEND_DIR (por defecto, la carpeta hermana ../backend).
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const raiz = resolve(import.meta.dirname, '..');
const origen = resolve(raiz, process.env.BACKEND_DIR ?? '../backend', 'proto');
const destino = join(raiz, 'proto');

function listar(carpeta) {
  if (!existsSync(carpeta)) return [];
  return readdirSync(carpeta, { recursive: true })
    .map((ruta) => join(carpeta, ruta))
    .filter((ruta) => statSync(ruta).isFile())
    .map((ruta) => relative(carpeta, ruta))
    .sort();
}

if (!existsSync(origen)) {
  console.error(`No se encontró el contrato del backend en ${origen}.`);
  process.exit(1);
}

if (process.argv.includes('--comprobar')) {
  const archivos = new Set([...listar(origen), ...listar(destino)]);
  const distintos = [...archivos].filter((archivo) => {
    const a = join(origen, archivo);
    const b = join(destino, archivo);
    return !existsSync(a) || !existsSync(b) || !readFileSync(a).equals(readFileSync(b));
  });
  if (distintos.length) {
    console.error('El .proto del frontend no coincide con el del backend:');
    for (const archivo of distintos) console.error(`  - ${archivo}`);
    console.error('Ejecuta: npm run proto:sync && npm run proto:gen');
    process.exit(1);
  }
  console.log('El .proto del frontend es idéntico al del backend.');
} else {
  rmSync(destino, { recursive: true, force: true });
  cpSync(origen, destino, { recursive: true });
  console.log(`Copiado ${relative(raiz, origen)} → proto/ (${listar(destino).length} archivos).`);
}
