import { Toaster } from '@cognite/aura/components/sonner-toast';
import { useEffect, useId, useSyncExternalStore } from 'react';

type SingleToasterProps = Parameters<typeof Toaster>[0];

const mounted: string[] = [];
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const currentOwner = () => mounted[0] ?? null;
const serverOwner = () => null;

/**
 * Aura's Toaster, safe to render in more than one place. Every Toaster on a page shows every
 * toast, so two of them double each message; only the first mounted SingleToaster renders, and
 * the next one takes over when it unmounts. Use it where a feature cannot know whether the app
 * shell already mounted a Toaster.
 */
export function SingleToaster(props: SingleToasterProps) {
  const id = useId();
  const owner = useSyncExternalStore(subscribe, currentOwner, serverOwner);

  useEffect(() => {
    mounted.push(id);
    notify();
    return () => {
      mounted.splice(mounted.indexOf(id), 1);
      notify();
    };
  }, [id]);

  return owner === id ? <Toaster {...props} /> : null;
}
