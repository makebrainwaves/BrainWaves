import React, { ReactNode } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

/**
 * Clean screen body: a fixed-width controls rail on the left and the working
 * area on the right, sized so both fit the window without page scroll — the
 * Analyze layout, so Clean and Analyze read as one family.
 */
export function CleanLayout({
  title,
  rail,
  children,
}: {
  /** Screen-reader heading for the screen. */
  title: string;
  rail: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 gap-[20px] px-[24px] py-[20px]">
      <h1 className="sr-only">{title}</h1>
      <aside
        aria-label="Cleaning controls"
        className="flex w-[300px] flex-none flex-col gap-[12px] overflow-y-auto rounded-lg border border-gray-200 bg-white p-[16px]"
      >
        {rail}
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[12px]">
        {children}
      </div>
    </div>
  );
}

/**
 * One confirmation dialog for the whole screen family. Restyles the native
 * `showMessageBox` confirmations of `CleanComponent` as in-app dialogs, so the
 * wording and the two-button contract stay the same.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  /** The effect-bearing action, rightmost. `Cancel` is always the left button. */
  confirmLabel: string;
  /** Red for actions that leave nothing behind (rejecting every trial, deleting). */
  destructive?: boolean;
  onConfirm(): void;
  onCancel(): void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-[15px] leading-[1.5] text-ink-muted">
            {body}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-end gap-[8px]">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
