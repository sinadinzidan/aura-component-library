import { render } from '@testing-library/react';

import { Pane } from './Pane';
import type { PaneProps } from './Pane';
import { PaneHandle } from './PaneHandle';
import type { PaneHandleProps } from './PaneHandle';
import { ResizablePanes } from './ResizablePanes';
import type { ResizablePanesProps } from './ResizablePanes';

type Options = {
  group?: Partial<ResizablePanesProps>;
  first?: Partial<PaneProps>;
  handle?: Partial<PaneHandleProps>;
};

/** Renders a navigation pane (30%, 20–50) beside a content pane for the resizable tests. */
export function renderPanes({ group, first, handle }: Options = {}) {
  return render(
    <ResizablePanes {...group}>
      <Pane label="Navigation" defaultSize={30} minSize={20} maxSize={50} {...first}>
        Asset tree
      </Pane>
      <PaneHandle {...handle} />
      <Pane label="Content" minSize={30}>
        Trend
      </Pane>
    </ResizablePanes>
  );
}
