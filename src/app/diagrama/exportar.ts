// Exportación del diagrama tal como se ve: SVG con los estilos copiados en línea (para que se vea
// igual fuera de la app) y PNG a partir de ese SVG.

const NS_SVG = 'http://www.w3.org/2000/svg';

// Propiedades que dan su aspecto al dibujo; el resto sale de los atributos del propio SVG.
const PROPIEDADES = [
  'fill',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'paint-order',
  'font-family',
  'font-size',
  'font-weight',
] as const;

export function serializarSvg(svg: SVGSVGElement): string {
  const copia = svg.cloneNode(true) as SVGSVGElement;
  const originales = [svg, ...svg.querySelectorAll('*')];
  const copias = [copia, ...copia.querySelectorAll('*')];
  originales.forEach((original, i) => {
    const calculado = getComputedStyle(original);
    const destino = copias[i] as SVGElement;
    for (const propiedad of PROPIEDADES) {
      const valor = calculado.getPropertyValue(propiedad);
      if (valor) destino.style.setProperty(propiedad, valor);
    }
    // Las transiciones y animaciones no tienen sentido en un archivo estático.
    destino.style.removeProperty('transition');
  });

  copia.setAttribute('xmlns', NS_SVG);
  const caja = svg.viewBox.baseVal;
  const fondo = document.createElementNS(NS_SVG, 'rect');
  fondo.setAttribute('class', 'exportar-fondo');
  fondo.setAttribute('x', String(caja?.x ?? 0));
  fondo.setAttribute('y', String(caja?.y ?? 0));
  fondo.setAttribute('width', String(caja?.width || svg.width.baseVal.value));
  fondo.setAttribute('height', String(caja?.height || svg.height.baseVal.value));
  fondo.setAttribute('fill', colorDeFondo());
  copia.insertBefore(fondo, copia.firstChild);

  return new XMLSerializer().serializeToString(copia);
}

function colorDeFondo(): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue('--color-superficie').trim() ||
    '#ffffff'
  );
}

export function nombreArchivo(titulo: string, extension: 'svg' | 'png'): string {
  const base = titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'diagrama'}.${extension}`;
}
