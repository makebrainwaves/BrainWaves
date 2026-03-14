/* Breaking this component on its own is done mainly to increase performance. Text input is slow otherwise */

import React, { useState } from 'react';
import { isString } from 'lodash';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TableRow, TableCell } from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface Props {
  name: string;
  num: number;
  response: string;
  dir: string;
  condition: string;
  phase: string;
  onChange: (num: number, arg1: string, arg2: string) => void;
  onDelete: (num: number) => void;
}

const RESPONSE_OPTIONS = new Array(10).fill(0).map((_, i) => ({
  key: i.toString(),
  text: i.toString(),
  value: i.toString(),
}));

export const StimuliRow: React.FC<Props> = ({
  name,
  num,
  response,
  dir,
  condition,
  phase,
  onChange,
  onDelete,
}) => {
  return (
    <TableRow>
      <TableCell className="pl-6 pr-2.5">
        <div className="grid grid-cols-[50px_1fr] items-center gap-2">
          <span>{num + 1}.</span>
          <span>{name}</span>
        </div>
      </TableCell>

      <TableCell className="pl-6 pr-2.5">
        <div>{condition}</div>
      </TableCell>

      <TableCell className="pl-6 pr-2.5">
        <select
          className="w-full border border-gray-300 rounded px-2 py-1"
          value={response}
          onChange={(event) => {
            const val = event.target.value;
            onChange(num, 'response', isString(val) ? val : '');
          }}
        >
          <option value="">Response</option>
          {RESPONSE_OPTIONS.map((o) => (
            <option key={o.key} value={o.value}>
              {o.text}
            </option>
          ))}
        </select>
      </TableCell>

      <TableCell className="pl-6 pr-2.5">
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-[auto_1fr] items-center border-2 border-gray-300 rounded px-3 py-2 gap-2">
            <Badge variant={phase === 'main' ? 'experimental' : 'practice'}>
              {phase === 'main' ? 'Experimental' : 'Practice'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger className="text-gray-400 focus:outline-none">
                ▾
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => onChange(num, 'phase', 'main')}
                >
                  Experimental
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onChange(num, 'phase', 'practice')}
                >
                  Practice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button variant="secondary" onClick={() => onDelete(num)}>
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
