const IMPORT_BLOCK = /^import[\s\S]*?;\s*$/gm;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns the source of the top-level `function <name>` in a module, or `null` when the module
 * has no such function. Relies on the formatter placing the closing brace in column 0.
 */
export function extractFunctionSource(moduleSource: string, name: string): string | null {
  const pattern = new RegExp(`^(?:export )?function ${escapeRegExp(name)}\\b[\\s\\S]*?^}`, 'm');
  const match = pattern.exec(moduleSource);
  return match ? match[0].replace(/^export /, '') : null;
}

/** Top-level identifiers declared in a module: functions, consts and types. */
function topLevelDeclarations(moduleSource: string): Map<string, string> {
  const declarations = new Map<string, string>();
  const pattern = /^(?:export )?(?:function|const|type) ([A-Za-z_$][\w$]*)\b[\s\S]*?(?:^}[;)]*$|;$)/gm;
  for (const match of moduleSource.matchAll(pattern)) {
    declarations.set(match[1], match[0].replace(/^export /, ''));
  }
  return declarations;
}

function usesIdentifier(code: string, identifier: string): boolean {
  return new RegExp(`(?<![\\w$.])${escapeRegExp(identifier)}(?![\\w$])`).test(code);
}

/** Import statements whose bindings are referenced by `code`. */
function usedImports(moduleSource: string, code: string): string[] {
  const statements = moduleSource.match(IMPORT_BLOCK) ?? [];
  return statements.filter((statement) => {
    const clause = /^import\s+(?:type\s+)?([\s\S]*?)\s+from\s/.exec(statement)?.[1];
    if (!clause) return false;
    const names = clause
      .replace(/[{}]/g, ',')
      .split(',')
      .map((part) => part.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop() ?? '')
      .filter(Boolean);
    return names.some((name) => usesIdentifier(code, name));
  });
}

/**
 * Builds a paste-ready snippet for one specimen: the specimen function, the module-level helpers
 * it references (transitively) and only the imports those need.
 */
export function extractSpecimenSource(moduleSource: string, name: string): string | null {
  const specimen = extractFunctionSource(moduleSource, name);
  if (!specimen) return null;

  const declarations = topLevelDeclarations(moduleSource);
  const included = new Map<string, string>();
  const queue = [specimen];
  while (queue.length > 0) {
    const code = queue.pop() ?? '';
    for (const [identifier, declaration] of declarations) {
      if (identifier === name || included.has(identifier)) continue;
      if (usesIdentifier(code, identifier)) {
        included.set(identifier, declaration);
        queue.push(declaration);
      }
    }
  }

  // Keep helpers in the order they appear in the module.
  const helpers = [...declarations.keys()]
    .filter((identifier) => included.has(identifier))
    .map((identifier) => included.get(identifier) ?? '');
  const body = [...helpers, specimen].join('\n\n');
  const imports = usedImports(moduleSource, body).filter((statement) => !statement.includes('?raw'));

  // Pages import the library relatively; a pasted snippet should use the app alias instead.
  const portableImports = imports.map((statement) => statement.replace(/'(?:\.\.\/)+library\//, "'@/library/"));

  return [portableImports.join('\n'), body].filter(Boolean).join('\n\n');
}
