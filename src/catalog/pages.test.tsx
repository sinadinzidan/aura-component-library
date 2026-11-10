import fs from 'node:fs';
import path from 'node:path';

import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';

import { allPages, findPage } from './manifest';
import { extractSpecimenSource } from './source/extractSpecimenSource';
import type { CatalogPage } from './types';

/**
 * Contract every catalog page must meet. Run one page with:
 *   npx vitest run src/catalog/pages.test.tsx -t "<page id>"
 */

const MIN_VARIANTS_PER_PRIMITIVE = 20;
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

const modules = import.meta.glob<CatalogPage>(['./pages/*/*.tsx', '!./pages/*/*.test.tsx'], { import: 'default' });
const built = Object.keys(modules).sort();

function parsePath(modulePath: string): { area: string; id: string } {
  const [, , area, file] = modulePath.split('/');
  return { area, id: file.replace(/\.tsx$/, '') };
}

function specimensOf(page: CatalogPage) {
  return page.sections.flatMap((section) => section.specimens);
}

describe('catalog pages', () => {
  it('has at least one built page', () => {
    expect(built.length).toBeGreaterThan(0);
  });

  it('only contains pages that are listed in the manifest, in the right area', () => {
    for (const modulePath of built) {
      const { area, id } = parsePath(modulePath);
      expect(findPage(id)?.area.id, `${modulePath} is not in the manifest under ${area}`).toBe(area);
    }
  });

  it('has globally unique specimen ids', async () => {
    const seen = new Map<string, string>();
    for (const modulePath of built) {
      const page = await modules[modulePath]();
      for (const specimen of specimensOf(page)) {
        expect(seen.get(specimen.id), `${specimen.id} is used by ${seen.get(specimen.id)} and ${page.id}`).toBeUndefined();
        seen.set(specimen.id, page.id);
      }
    }
    // Imports every page module, so it needs more than the default five seconds.
  }, 120_000);

  describe.each(built.map((modulePath) => ({ modulePath, ...parsePath(modulePath) })))(
    '$id',
    ({ modulePath, area, id }) => {
      let page: CatalogPage;

      beforeAll(async () => {
        page = await modules[modulePath]();
      });

      afterEach(cleanup);

      it(`${id}: matches its manifest entry`, () => {
        expect(page.id).toBe(id);
        expect(page.title).toBe(findPage(id)?.page.title);
        expect(page.summary.length).toBeGreaterThan(20);
      });

      it(`${id}: has enough variants`, () => {
        const minimum = area === 'primitives' ? MIN_VARIANTS_PER_PRIMITIVE : 1;
        expect(specimensOf(page).length).toBeGreaterThanOrEqual(minimum);
      });

      it(`${id}: gives every variant a title, a note and extractable source`, () => {
        for (const specimen of specimensOf(page)) {
          expect(specimen.title, specimen.id).not.toBe('');
          expect(specimen.note.length, `${specimen.id} note`).toBeGreaterThan(10);
          expect(specimen.id, 'id must be a PascalCase function name').toMatch(/^[A-Z][A-Za-z0-9]+$/);
          expect(extractSpecimenSource(page.source, specimen.id), `${specimen.id} has no top-level function`).not.toBeNull();
        }
      });

      it(`${id}: uses library files that exist`, () => {
        for (const specimen of specimensOf(page)) {
          for (const file of specimen.uses ?? []) {
            expect(fs.existsSync(path.resolve('src/library', file)), `${specimen.id} uses ${file}`).toBe(true);
          }
        }
      });

      it(`${id}: uses no raw colour values`, () => {
        const withoutComments = page.source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        expect(RAW_COLOR.exec(withoutComments)?.[0]).toBeUndefined();
      });

      it(`${id}: renders every variant without throwing`, () => {
        for (const specimen of specimensOf(page)) {
          const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
          const { unmount } = render(
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <specimen.Component />
              </TooltipProvider>
            </QueryClientProvider>
          );
          unmount();
        }
      });
    }
  );
});

describe('manifest', () => {
  it('has unique page ids', () => {
    const ids = allPages().map(({ page }) => page.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
