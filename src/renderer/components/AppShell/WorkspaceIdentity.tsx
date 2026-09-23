import React from 'react';
import { cn } from '../ui/utils';
import { ShellWorkspace, workspaceTypeLabel } from './types';

/** Static name + type of the open workspace. Deliberately not a switcher. */
export default function WorkspaceIdentity({
  workspace,
  className,
}: {
  workspace: ShellWorkspace;
  className?: string;
}) {
  const type = workspaceTypeLabel(workspace);
  return (
    <div
      role="group"
      aria-label={`Workspace: ${workspace.name}, ${type}`}
      className={cn(
        'flex min-w-0 flex-col justify-center gap-[2px]',
        className
      )}
    >
      <span className="truncate text-[16px] leading-[20px]">
        {workspace.name}
      </span>
      <span className="whitespace-nowrap text-[12px] leading-[16px] text-ink-muted">
        {type}
      </span>
    </div>
  );
}
