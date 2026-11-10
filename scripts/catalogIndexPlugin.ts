import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript';
import type { Plugin } from 'vite';

/**
 * Builds `virtual:catalog-index`: the id, title, note and origin of every specimen on every
 * catalog page, read from the page files with the TypeScript parser. Navigation counts and search
 * use it, so neither has to load a page's code.
 */

export type IndexedSpecimen = { id: string; title: string; note: string; origin: string };
export type IndexedSection = { id: string; title: string; specimens: IndexedSpecimen[] };
export type IndexedPage = { area: string; id: string; title: string; sections: IndexedSection[] };

const VIRTUAL_ID = 'virtual:catalog-index';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

function stringProperty(node: ts.ObjectLiteralExpression, name: string): string {
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property) || property.name.getText() !== name) continue;
    const value = property.initializer;
    if (ts.isStringLiteralLike(value)) return value.text;
  }
  return '';
}

function arrayProperty(node: ts.ObjectLiteralExpression, name: string): ts.ObjectLiteralExpression[] {
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property) || property.name.getText() !== name) continue;
    const value = property.initializer;
    if (ts.isArrayLiteralExpression(value)) return value.elements.filter(ts.isObjectLiteralExpression);
  }
  return [];
}

function findDefinePageArgument(sourceFile: ts.SourceFile): ts.ObjectLiteralExpression | null {
  let found: ts.ObjectLiteralExpression | null = null;
  const visit = (node: ts.Node) => {
    if (found) return;
    if (ts.isCallExpression(node) && node.expression.getText() === 'definePage') {
      const [argument] = node.arguments;
      if (argument && ts.isObjectLiteralExpression(argument)) found = argument;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

export function indexPageSource(area: string, fileName: string, source: string): IndexedPage | null {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const page = findDefinePageArgument(sourceFile);
  if (!page) return null;
  return {
    area,
    id: stringProperty(page, 'id'),
    title: stringProperty(page, 'title'),
    sections: arrayProperty(page, 'sections').map((section) => ({
      id: stringProperty(section, 'id'),
      title: stringProperty(section, 'title'),
      specimens: arrayProperty(section, 'specimens').map((specimen) => ({
        id: stringProperty(specimen, 'id'),
        title: stringProperty(specimen, 'title'),
        note: stringProperty(specimen, 'note'),
        origin: stringProperty(specimen, 'origin'),
      })),
    })),
  };
}

export function buildCatalogIndex(pagesDir: string): IndexedPage[] {
  if (!fs.existsSync(pagesDir)) return [];
  const pages: IndexedPage[] = [];
  for (const area of fs.readdirSync(pagesDir).sort()) {
    const areaDir = path.join(pagesDir, area);
    if (!fs.statSync(areaDir).isDirectory()) continue;
    for (const file of fs.readdirSync(areaDir).sort()) {
      if (!file.endsWith('.tsx') || file.endsWith('.test.tsx')) continue;
      const indexed = indexPageSource(area, file, fs.readFileSync(path.join(areaDir, file), 'utf8'));
      if (indexed) pages.push(indexed);
    }
  }
  return pages;
}

export function catalogIndexPlugin(): Plugin {
  let pagesDir = '';
  return {
    name: 'catalog-index',
    configResolved(config) {
      pagesDir = path.resolve(config.root, 'src/catalog/pages');
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      return `export default ${JSON.stringify(buildCatalogIndex(pagesDir))};`;
    },
    handleHotUpdate({ file, server }) {
      if (!file.startsWith(pagesDir)) return;
      const module = server.moduleGraph.getModuleById(RESOLVED_ID);
      if (module) server.moduleGraph.invalidateModule(module);
    },
  };
}
