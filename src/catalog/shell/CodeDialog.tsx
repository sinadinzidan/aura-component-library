import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@cognite/aura/components/dialog';
import { Loader } from '@cognite/aura/components/loader';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';

import { useCatalogDeps } from '../CatalogDeps';
import { extractSpecimenSource } from '../source/extractSpecimenSource';
import type { CatalogPage, Specimen } from '../types';

// Shiki is heavy; load the highlighter only when someone opens a code view.
const CodeView = lazy(() => import('./CodeView'));

type CodeDialogProps = {
  page: CatalogPage;
  specimen: Specimen | null;
  onClose: () => void;
};

function fileLabel(file: string): string {
  return file.split('/').pop() ?? file;
}

function LibraryFile({ file }: { file: string }) {
  const { loadLibrarySource } = useCatalogDeps();
  const query = useQuery({
    queryKey: ['library-source', file],
    queryFn: () => loadLibrarySource(file),
    staleTime: Infinity,
  });

  if (query.isPending) return <Loader size={20} aria-label="Loading source" />;
  if (!query.data) return <p className="text-sm text-muted-foreground">Source for {file} is not available.</p>;
  return (
    <>
      <p className="mb-3 font-mono text-xs text-muted-foreground">src/library/{file}</p>
      <CodeView code={query.data} />
    </>
  );
}

export function CodeDialog({ page, specimen, onClose }: CodeDialogProps) {
  const code = specimen ? extractSpecimenSource(page.source, specimen.id) : null;
  const uses = specimen?.uses ?? [];

  return (
    <Dialog open={specimen !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{specimen?.title ?? 'Code'}</DialogTitle>
          <DialogDescription>{specimen?.note}</DialogDescription>
        </DialogHeader>
        <Suspense fallback={<Loader size={20} aria-label="Loading code" />}>
          <Tabs defaultValue="variant" className="flex min-h-0 flex-1 flex-col">
            {uses.length > 0 ? (
              <TabsList size="small">
                <TabsTrigger value="variant">Variant</TabsTrigger>
                {uses.map((file) => (
                  <TabsTrigger key={file} value={file}>
                    {fileLabel(file)}
                  </TabsTrigger>
                ))}
              </TabsList>
            ) : null}
            <TabsPanel value="variant" className="min-h-0 flex-1 overflow-auto pt-3">
              {code ? (
                <CodeView code={code} />
              ) : (
                <p className="text-sm text-muted-foreground">No source found for this variant.</p>
              )}
            </TabsPanel>
            {uses.map((file) => (
              <TabsPanel key={file} value={file} className="min-h-0 flex-1 overflow-auto pt-3">
                <LibraryFile file={file} />
              </TabsPanel>
            ))}
          </Tabs>
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
