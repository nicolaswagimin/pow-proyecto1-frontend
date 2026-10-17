// Detección del lenguaje por el contenido, para avisar cuando no coincide con la extensión de la
// pestaña (por ejemplo, Python pegado en index.js). Heurística por patrones típicos de cada
// lenguaje: gana el que más patrones cumple, con al menos 2.

export type Lenguaje =
  'python' | 'javascript' | 'typescript' | 'java' | 'csharp' | 'go' | 'php' | 'ruby';

const NOMBRES: Record<Lenguaje, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  java: 'Java',
  csharp: 'C#',
  go: 'Go',
  php: 'PHP',
  ruby: 'Ruby',
};

const EXTENSIONES: Record<Lenguaje, string> = {
  python: 'py',
  javascript: 'js',
  typescript: 'ts',
  java: 'java',
  csharp: 'cs',
  go: 'go',
  php: 'php',
  ruby: 'rb',
};

const POR_EXTENSION: Record<string, Lenguaje> = {
  py: 'python',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  java: 'java',
  cs: 'csharp',
  go: 'go',
  php: 'php',
  rb: 'ruby',
};

const JAVASCRIPT = [
  /\b(const|let|var)\s+\w+\s*=/,
  /=>/,
  /\brequire\(['"]/,
  /^\s*import\s+.+\s+from\s+['"]/m,
  /\bfunction\s*\w*\s*\(/,
  /\bconsole\.log\(/,
];

const PATRONES: Record<Lenguaje, RegExp[]> = {
  python: [
    /^\s*def\s+\w+\s*\(.*\)\s*(->\s*[\w\[\], |]+)?\s*:\s*$/m,
    /^\s*class\s+\w+\s*(\(.*\))?\s*:\s*$/m,
    /^\s*(from\s+[\w.]+\s+import\s+\w+|import\s+\w+\s*$)/m,
    /\bself\./,
    /__name__\s*==\s*['"]__main__['"]/,
    /^\s*elif\b|\bprint\(f?['"]/m,
  ],
  javascript: JAVASCRIPT,
  typescript: [
    ...JAVASCRIPT,
    /\binterface\s+\w+\s*\{/,
    /:\s*(string|number|boolean|void|any|unknown)\b/,
    /\bexport\s+type\s+\w+/,
  ],
  java: [
    /\bpublic\s+(static\s+)?(class|void|final)\b/,
    /\bSystem\.out\.println\(/,
    /\bprivate\s+\w+(<.*>)?\s+\w+\s*;/,
    /^\s*package\s+[\w.]+;/m,
  ],
  csharp: [
    /^\s*using\s+System/m,
    /\bnamespace\s+[\w.]+/,
    /\bConsole\.WriteLine\(/,
    /\{\s*get;\s*set;\s*\}/,
  ],
  go: [/^\s*package\s+\w+\s*$/m, /\bfunc\s+(\(.*\)\s*)?\w+\s*\(/, /:=/, /\bfmt\.\w+\(/],
  php: [/<\?php/, /\$\w+\s*=/, /\bfunction\s+\w+\s*\(.*\$/, /->\w+\(/],
  ruby: [/^\s*def\s+\w+[?!]?\s*(\(.*\))?\s*$/m, /^\s*end\s*$/m, /\bputs\s/, /^\s*require\s+['"]/m],
};

export function detectarLenguaje(contenido: string): Lenguaje | null {
  let mejor: Lenguaje | null = null;
  let puntos = 1; // hace falta al menos 2 patrones
  for (const lenguaje of Object.keys(PATRONES) as Lenguaje[]) {
    const cumplidos = PATRONES[lenguaje].filter((patron) => patron.test(contenido)).length;
    if (cumplidos > puntos) {
      mejor = lenguaje;
      puntos = cumplidos;
    }
  }
  // TypeScript incluye los patrones de JavaScript: solo gana si además tiene alguno propio.
  if (
    mejor === 'typescript' &&
    puntos === PATRONES.javascript.filter((p) => p.test(contenido)).length
  ) {
    return 'javascript';
  }
  return mejor;
}

export function lenguajePorNombre(nombre: string): Lenguaje | null {
  const punto = nombre.lastIndexOf('.');
  return punto > 0 ? (POR_EXTENSION[nombre.slice(punto + 1).toLowerCase()] ?? null) : null;
}
