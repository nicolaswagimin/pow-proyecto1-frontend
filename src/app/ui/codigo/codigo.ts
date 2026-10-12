import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface LineaCodigo {
  texto: string;
  id?: string; // permite resaltar la línea que corresponde al campo enfocado
}

type ClaseToken = 'clave' | 'cadena' | 'comentario' | 'texto';

const PATRON = /(\/\/.*$)|('[^']*')|\b(const|export|class|return|this|new|async|await|if)\b/g;

// Fragmento de código con números de línea y una línea activa. Es una vista de apoyo del
// diagrama (lo que el producto analiza), así que se oculta a los lectores de pantalla.
@Component({
  selector: 'ui-codigo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pestana">{{ archivo() }}</div>
    <pre aria-hidden="true"><code>@for (linea of lineasVista(); track $index) {<span class="linea" [class.linea--activa]="linea.id && linea.id === activa()"><span class="numero">{{ $index + 1 }}</span>@for (token of linea.tokens; track $index) {<span [class]="'t-' + token.clase">{{ token.texto }}</span>}</span>}</code></pre>
  `,
  styleUrl: './codigo.css',
})
export class Codigo {
  readonly archivo = input.required<string>();
  readonly lineas = input.required<LineaCodigo[]>();
  readonly activa = input<string | null>(null);

  protected readonly lineasVista = computed(() =>
    this.lineas().map((linea) => ({ ...linea, tokens: tokenizar(linea.texto) })),
  );
}

// Resaltado mínimo: palabras clave, cadenas y comentarios.
function tokenizar(texto: string): { texto: string; clase: ClaseToken }[] {
  const tokens: { texto: string; clase: ClaseToken }[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(PATRON)) {
    const inicio = m.index ?? 0;
    if (inicio > ultimo) tokens.push({ texto: texto.slice(ultimo, inicio), clase: 'texto' });
    tokens.push({ texto: m[0], clase: m[1] ? 'comentario' : m[2] ? 'cadena' : 'clave' });
    ultimo = inicio + m[0].length;
  }
  if (ultimo < texto.length) tokens.push({ texto: texto.slice(ultimo), clase: 'texto' });
  return tokens.length ? tokens : [{ texto: ' ', clase: 'texto' }];
}
