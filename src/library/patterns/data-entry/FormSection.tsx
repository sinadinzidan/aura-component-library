import { useId } from 'react';
import type { ReactNode } from 'react';

type FormSectionProps = {
  title: string;
  /** One sentence on what the fields in this group are for. */
  description?: ReactNode;
  /**
   * `stacked`: heading above the fields, for single-column forms.
   * `aside`: heading in a left column and fields on the right once the container is wide enough.
   */
  layout?: 'stacked' | 'aside';
  /** The group's fields. They are spaced `space-y-4` apart. */
  children: ReactNode;
};

/**
 * One named group of fields in a longer form: a heading, an optional description and the fields,
 * exposed as a labelled group so assistive tech announces which section a field belongs to.
 */
export function FormSection({ title, description, layout = 'stacked', children }: FormSectionProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  const heading = (
    <div className="flex min-w-0 flex-col gap-1">
      <h3 id={titleId} className="text-base font-semibold text-base-foreground">
        {title}
      </h3>
      {description ? (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="@container w-full">
      <section
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        data-layout={layout}
        className={layout === 'aside' ? 'grid gap-4 @xl:grid-cols-3 @xl:gap-8' : 'flex flex-col gap-4'}
      >
        {heading}
        <div className={layout === 'aside' ? 'min-w-0 space-y-4 @xl:col-span-2' : 'min-w-0 space-y-4'}>{children}</div>
      </section>
    </div>
  );
}
