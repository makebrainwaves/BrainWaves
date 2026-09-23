import React from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../ui/dialog';
import { HOME_DIALOG_CLASSES } from './WorkspaceNameDialog';

interface Props {
  open: boolean;
  workspaceName: string;
  recordingCount: number;
  cleanedCount: number;
  onConfirm(): void;
  onCancel(): void;
}

/** States exactly what deleting a workspace folder removes. Cancel gets focus. */
export default function DeleteWorkspaceDialog({
  open,
  workspaceName,
  recordingCount,
  cleanedCount,
  onConfirm,
  onCancel,
}: Props) {
  const contents = [
    recordingCount > 0 &&
      `${recordingCount} recording${recordingCount === 1 ? '' : 's'}`,
    cleanedCount > 0 &&
      `${cleanedCount} cleaned file${cleanedCount === 1 ? '' : 's'}`,
  ].filter(Boolean);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent
        overlayClassName={HOME_DIALOG_CLASSES.overlay}
        className={HOME_DIALOG_CLASSES.content}
      >
        <div className="flex flex-col gap-[8px] pr-[32px]">
          <DialogTitle className={HOME_DIALOG_CLASSES.title}>
            Delete {workspaceName}?
          </DialogTitle>
          <DialogDescription className={HOME_DIALOG_CLASSES.description}>
            This removes the workspace folder and everything in it
            {contents.length > 0 ? `: ${contents.join(' and ')}` : ''}. You
            can’t undo this.
          </DialogDescription>
        </div>
        <div className="flex justify-end gap-[12px]">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete workspace
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
