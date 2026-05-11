import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils/cn';

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  /** Primary button style */
  variant?: 'default' | 'destructive';
  className?: string;
};

/**
 * Reusable confirmation modal (logout, destructive actions, etc.).
 * Controlled via `open` / `onOpenChange`; call `onConfirm` when the user confirms.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  className,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy && next === false) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className={cn('sm:max-w-md', className)} showClose={!busy}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description != null ? (
            typeof description === 'string' ? (
              <DialogDescription>{description}</DialogDescription>
            ) : (
              <div className="text-sm leading-relaxed text-[#64748b]">{description}</div>
            )
          ) : null}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            disabled={busy}
            onClick={() => void handleConfirm()}
          >
            {busy ? 'Please wait…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
