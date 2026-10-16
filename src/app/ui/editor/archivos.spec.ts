import { contarLineas, insertarSangria, nombreLibre } from './archivos';

describe('nombreLibre', () => {
  it('usa el nombre base si está libre', () => expect(nombreLibre([])).toBe('archivo.js'));
  it('numera si ya existe', () => expect(nombreLibre(['archivo.js', 'archivo-2.js'])).toBe('archivo-3.js'));
});

describe('insertarSangria', () => {
  it('inserta dos espacios en el cursor', () => {
    expect(insertarSangria('ab', 1, 1)).toEqual({ texto: 'a  b', cursor: 3 });
  });
  it('reemplaza la selección', () => {
    expect(insertarSangria('abcd', 1, 3)).toEqual({ texto: 'a  d', cursor: 3 });
  });
});

describe('contarLineas', () => {
  it('un texto vacío tiene una línea', () => expect(contarLineas('')).toBe(1));
  it('cuenta los saltos de línea', () => expect(contarLineas('a\nb\n')).toBe(3));
});
