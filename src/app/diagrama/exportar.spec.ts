import { nombreArchivo, serializarSvg } from './exportar';

function lienzo(): SVGSVGElement {
  const estilo = document.createElement('style');
  estilo.textContent = '.trazo { stroke: rgb(255, 0, 0); stroke-width: 3px; }';
  document.head.append(estilo);
  const contenedor = document.createElement('div');
  contenedor.innerHTML =
    '<svg viewBox="0 0 100 50" width="100" height="50"><path class="trazo" d="M0 0L10 10"/><text>Hola</text></svg>';
  document.body.append(contenedor);
  return contenedor.querySelector('svg')!;
}

describe('serializarSvg', () => {
  it('incluye xmlns para abrirse fuera de la app', () => {
    expect(serializarSvg(lienzo())).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('copia el estilo de trazo en línea', () => {
    const texto = serializarSvg(lienzo());
    expect(texto).toMatch(/style="[^"]*stroke: rgb\(255, 0, 0\)/);
  });

  it('agrega un fondo y conserva el contenido', () => {
    const texto = serializarSvg(lienzo());
    expect(texto).toContain('class="exportar-fondo"');
    expect(texto).toContain('Hola');
  });

  it('no modifica el SVG original', () => {
    const svg = lienzo();
    serializarSvg(svg);
    expect(svg.querySelector('path')!.getAttribute('style')).toBeNull();
  });
});

describe('nombreArchivo', () => {
  it('convierte el título en un nombre de archivo', () => {
    expect(nombreArchivo('Flujo de Login: API', 'svg')).toBe('flujo-de-login-api.svg');
  });

  it('usa un nombre por defecto si el título está vacío', () => {
    expect(nombreArchivo('  ', 'png')).toBe('diagrama.png');
  });
});
