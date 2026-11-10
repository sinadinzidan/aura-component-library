import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeaderCenter,
  CardHeaderEnd,
  CardTitle,
} from '@cognite/aura/components/card';
import type { ReactNode } from 'react';

type DashboardPanelProps = {
  title: string;
  /** One line under the title: what the panel shows, or its key takeaway. */
  description?: string;
  /** Small controls in the header: a range switch, a link, a menu. */
  actions?: ReactNode;
  /** Footer line: source, last update or a text summary of a chart. */
  footnote?: ReactNode;
  children: ReactNode;
};

/**
 * A titled dashboard panel on Aura's Card. Every panel has the same header, padding and optional
 * footnote, which is what keeps a dashboard reading as one surface.
 */
export function DashboardPanel({ title, description, actions, footnote, children }: DashboardPanelProps) {
  return (
    <Card aria-label={title} role="group">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle as="h4">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeaderCenter>
        {actions ? <CardHeaderEnd>{actions}</CardHeaderEnd> : null}
      </CardHeader>
      <CardContent>
        {/* CardContent aligns its children to the start; w-full makes the panel body span the card. */}
        <div className="flex w-full min-w-0 flex-col gap-3">
          {children}
          {footnote ? <p className="text-xs text-muted-foreground">{footnote}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
