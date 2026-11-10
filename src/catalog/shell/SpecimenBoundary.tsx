import { Component } from 'react';
import type { ReactNode } from 'react';

type SpecimenBoundaryProps = { children: ReactNode };
type SpecimenBoundaryState = { failed: boolean };

/** Keeps one broken specimen from taking the whole page down. */
export class SpecimenBoundary extends Component<SpecimenBoundaryProps, SpecimenBoundaryState> {
  state: SpecimenBoundaryState = { failed: false };

  static getDerivedStateFromError(): SpecimenBoundaryState {
    return { failed: true };
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <p role="alert" className="text-sm text-critical-foreground-strong">
          This variant failed to render.
        </p>
      );
    }
    return this.props.children;
  }
}
