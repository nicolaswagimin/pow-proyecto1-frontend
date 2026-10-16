import { calcularFuerza, pistaFuerza } from './fuerza';

describe('calcularFuerza', () => {
  it('vacía es 0', () => expect(calcularFuerza('')).toBe(0));
  it('corta es débil', () => expect(calcularFuerza('Ab1!')).toBe(1));
  it('12 caracteres variados es muy fuerte', () => expect(calcularFuerza('Abcdefgh123!')).toBe(4));
  it('pide 8 caracteres si es corta', () => expect(pistaFuerza('abc', 1)).toBe('Usa al menos 8 caracteres.'));
});
