import React, { useId, useState } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../ui/dialog';
import { suggestWorkspaceName, workspaceNameProblem } from './workspaceName';

interface Props {
  /** Display name of the chosen template, e.g. `Faces/Houses`. */
  templateName: string;
  /** Folder-safe stem the suggestion is built from, e.g. `Faces_Houses`. */
  baseName: string;
  existingNames: string[];
  onCreate(name: string): void;
  onCancel(): void;
}

/** Shared shell for Home's confirm dialogs. */
export const HOME_DIALOG_CLASSES = {
  overlay: 'bg-[rgba(26,26,26,0.45)]',
  content:
    'flex max-w-[520px] flex-col gap-[20px] px-[32px] pb-[24px] pt-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)]',
  title:
    'm-0 text-[26px] font-light leading-tight tracking-[0.3px] [overflow-wrap:anywhere]',
  description:
    'm-0 !text-[16px] leading-normal !tracking-normal text-ink [text-wrap:pretty]',
};

/**
 * Names a new workspace from a template; prefilled with a unique name.
 * Callers mount it per open, so the field starts from a fresh suggestion.
 */
export default function WorkspaceNameDialog({
  templateName,
  baseName,
  existingNames,
  onCreate,
  onCancel,
}: Props) {
  const suggestion = suggestWorkspaceName(baseName, existingNames);
  const [value, setValue] = useState(suggestion.name);
  const problem = workspaceNameProblem(value, existingNames);
  const inputId = useId();
  const helpId = useId();

  const error =
    problem &&
    {
      empty: 'Give your workspace a name.',
      illegal: 'Names can’t include symbols like / . , ( ) or &.',
      taken: `You already have a workspace called ${value.trim()}.`,
    }[problem];
  const help =
    suggestion.taken.length > 0 &&
    `${new Intl.ListFormat('en').format(suggestion.taken)} already ${
      suggestion.taken.length === 1 ? 'exists' : 'exist'
    }, so we picked the next free name. You can change it.`;

  return (
    <Dialog open onOpenChange={(next) => !next && onCancel()}>
      <DialogContent
        overlayClassName={HOME_DIALOG_CLASSES.overlay}
        className={HOME_DIALOG_CLASSES.content}
      >
        <form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            if (!problem) onCreate(value.trim());
          }}
        >
          <div className="flex flex-col gap-[8px] pr-[32px]">
            <DialogTitle className={HOME_DIALOG_CLASSES.title}>
              Name your workspace
            </DialogTitle>
            <DialogDescription className={HOME_DIALOG_CLASSES.description}>
              You’re starting from the {templateName} template. Your recordings
              and results will be saved under this name.
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-[8px]">
            <label htmlFor={inputId} className="text-[14px] font-bold">
              Workspace name
            </label>
            <input
              id={inputId}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              aria-invalid={problem ? true : undefined}
              aria-describedby={problem || help ? helpId : undefined}
              className={
                problem
                  ? 'h-[40px] rounded-[4px] border-2 border-[#dc2626] px-[12px] text-[16px] text-ink focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:ring-offset-2'
                  : 'h-[40px] rounded-[4px] border border-[#bdbdbd] px-[12px] text-[16px] text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2'
              }
            />
            {problem ? (
              <div
                id={helpId}
                role="alert"
                className="flex flex-wrap items-center gap-[6px] text-[14px] leading-[1.45] text-[#b91c1c]"
              >
                <span aria-hidden className="font-bold">
                  !
                </span>
                <span>{error}</span>
                {problem === 'taken' && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setValue(suggestion.name)}
                  >
                    Use {suggestion.name}
                  </Button>
                )}
              </div>
            ) : (
              help && (
                <span
                  id={helpId}
                  className="text-[14px] leading-[1.45] text-ink-muted"
                >
                  {help}
                </span>
              )
            )}
          </div>
          <div className="flex justify-end gap-[12px]">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!!problem}>
              Create workspace
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
