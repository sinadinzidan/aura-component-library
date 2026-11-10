import { Alert } from '@cognite/aura/components/alert';
import { useState } from 'react';
import type { ComponentProps } from 'react';

import type { DismissalStore } from './dismissalStore';

type DismissibleAlertProps = Omit<ComponentProps<typeof Alert>, 'id' | 'visible' | 'defaultVisible' | 'onClose'> & {
  /** Stable id for this message. Change it when the message changes so it shows again. */
  id: string;
  /** Where dismissals are remembered, for example `createStorageDismissalStore(localStorage)`. */
  store: DismissalStore;
  onDismiss?: () => void;
};

/**
 * An Alert with a close button that stays closed: the dismissal is written to an injected store
 * and read back on mount, so a notice someone has already read does not return on the next visit.
 */
export function DismissibleAlert({ id, store, onDismiss, children, ...alertProps }: DismissibleAlertProps) {
  const [visible, setVisible] = useState(() => !store.isDismissed(id));

  const close = () => {
    store.dismiss(id);
    setVisible(false);
    onDismiss?.();
  };

  return (
    <Alert {...alertProps} visible={visible} onClose={close}>
      {children}
    </Alert>
  );
}
