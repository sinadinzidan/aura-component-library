import { Button } from '@cognite/aura/components/button';
import { useRef } from 'react';
import type { ComponentProps, ReactNode } from 'react';

type FilePickerButtonProps = {
  /** Verb + object: "Upload file", "Replace file". */
  children: ReactNode;
  /** Called with the picked files. Never called with an empty list. */
  onFiles: (files: File[]) => void;
  /** Passed to the file dialog, for example ".pdf,.dwg". Still validate after picking. */
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
  /** Accessible name of the hidden file input. */
  inputLabel?: string;
};

/**
 * A button that opens the system file dialog. The real file input stays hidden, so the control
 * looks and focuses like every other button; picking the same file twice in a row works because
 * the input is cleared after each pick.
 */
export function FilePickerButton({
  children,
  onFiles,
  accept,
  multiple = false,
  disabled = false,
  variant = 'secondary',
  size = 'default',
  inputLabel = 'Choose files',
}: FilePickerButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Button variant={variant} size={size} disabled={disabled} onClick={() => inputRef.current?.click()}>
        {children}
      </Button>
      <input
        ref={inputRef}
        type="file"
        hidden
        tabIndex={-1}
        aria-label={inputLabel}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          if (files.length > 0) onFiles(files);
        }}
      />
    </>
  );
}
