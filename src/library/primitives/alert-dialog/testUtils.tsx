import { Button } from '@cognite/aura/components/button';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

import { AlertDialog } from './AlertDialog';
import type { AlertDialogProps } from './AlertDialog';
import { AlertDialogAction } from './AlertDialogAction';
import type { AlertDialogActionProps } from './AlertDialogAction';
import { AlertDialogCancel } from './AlertDialogCancel';
import { AlertDialogContent } from './AlertDialogContent';
import { AlertDialogDescription } from './AlertDialogDescription';
import { AlertDialogFooter } from './AlertDialogFooter';
import { AlertDialogHeader } from './AlertDialogHeader';
import { AlertDialogTitle } from './AlertDialogTitle';
import { AlertDialogTrigger } from './AlertDialogTrigger';

type Options = {
  root?: Partial<AlertDialogProps>;
  action?: Partial<AlertDialogActionProps>;
  /** Extra parts between the header and the footer. */
  body?: ReactNode;
  cancel?: boolean;
};

/** Renders a complete delete confirmation for the alert-dialog tests. */
export function renderAlertDialog({ root, action, body, cancel = true }: Options = {}) {
  return render(
    <AlertDialog tone="destructive" {...root}>
      <AlertDialogTrigger render={<Button variant="destructive">Delete pipeline</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete pipeline?</AlertDialogTitle>
          <AlertDialogDescription>All runs are removed.</AlertDialogDescription>
        </AlertDialogHeader>
        {body}
        <AlertDialogFooter>
          {cancel ? <AlertDialogCancel /> : null}
          <AlertDialogAction {...action}>Delete pipeline</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** A promise the test settles by hand. */
export function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (reason: Error) => void = () => undefined;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
