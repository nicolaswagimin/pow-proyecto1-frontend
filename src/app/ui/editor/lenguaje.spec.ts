import { detectarLenguaje, lenguajePorNombre, revisarLenguaje } from './lenguaje';

const PYTHON = `from abc import ABC, abstractmethod
import random

class Arma:
    def __init__(self, nombre: str):
        self.nombre = nombre

if __name__ == "__main__":
    print(Arma("Hacha").nombre)
`;
const JS =
  "import express from 'express';\nconst app = express();\napp.get('/', (req, res) => res.send('ok'));\n";
const TS =
  'interface Usuario { nombre: string }\nexport const saludar = (u: Usuario): string => `Hola ${u.nombre}`;\n';
const JAVA =
  'public class Main {\n  public static void main(String[] args) {\n    System.out.println("hola");\n  }\n}\n';
const GO = 'package main\n\nimport "fmt"\n\nfunc main() {\n  x := 1\n  fmt.Println(x)\n}\n';

describe('detectarLenguaje', () => {
  it.each([
    [PYTHON, 'python'],
    [JS, 'javascript'],
    [TS, 'typescript'],
    [JAVA, 'java'],
    [GO, 'go'],
  ])('reconoce el lenguaje por el contenido (%#)', (codigo, lenguaje) => {
    expect(detectarLenguaje(codigo)).toBe(lenguaje);
  });

  it('con poco código no adivina', () => {
    expect(detectarLenguaje('x = 1')).toBeNull();
    expect(detectarLenguaje('')).toBeNull();
  });
});

describe('lenguajePorNombre', () => {
  it('usa la extensión', () => {
    expect(lenguajePorNombre('index.js')).toBe('javascript');
    expect(lenguajePorNombre('app.py')).toBe('python');
    expect(lenguajePorNombre('README')).toBeNull();
  });
});

describe('revisarLenguaje', () => {
  it('Python en index.js sugiere index.py', () => {
    expect(revisarLenguaje({ nombre: 'index.js', contenido: PYTHON }, [])).toEqual({
      mensaje: 'Parece Python, pero la pestaña se llama index.js.',
      nombreSugerido: 'index.py',
    });
  });

  it('no repite un nombre que ya existe', () => {
    expect(
      revisarLenguaje({ nombre: 'index.js', contenido: PYTHON }, ['index.py'])?.nombreSugerido,
    ).toBe('index-2.py');
  });

  it('JavaScript en un .ts no es un problema (TypeScript lo incluye)', () => {
    expect(revisarLenguaje({ nombre: 'app.ts', contenido: JS }, [])).toBeNull();
  });

  it('sin extensión también sugiere una', () => {
    expect(revisarLenguaje({ nombre: 'combate', contenido: PYTHON }, [])?.nombreSugerido).toBe(
      'combate.py',
    );
  });

  it('si coincide, no avisa', () => {
    expect(revisarLenguaje({ nombre: 'main.py', contenido: PYTHON }, [])).toBeNull();
  });
});
