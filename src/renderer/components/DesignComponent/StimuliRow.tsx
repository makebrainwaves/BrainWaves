/* Breaking this component on its own is done mainly to increase performance. Text input is slow otherwise */

import React, { useState } from 'react';
import { isString } from 'lodash';
import { Button } from '../ui/button';
import { TableRow, TableCell } from '../ui/table';
import styles from '../styles/common.module.css';

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
  const [phaseMenuOpen, setPhaseMenuOpen] = useState(false);

  return (
    <TableRow className={styles.trialsRow}>
      <TableCell className={styles.conditionsNameRow}>
        <div style={{ alignSelf: 'center' }}>{num + 1}.</div>
        <div>{name}</div>
      </TableCell>

      <TableCell className={styles.experimentRowName}>
        <div>{condition}</div>
      </TableCell>

      <TableCell className={styles.experimentRowName}>
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
            <option key={o.key} value={o.value}>{o.text}</option>
          ))}
        </select>
      </TableCell>

      <TableCell className={styles.trialsTrialTypeRow}>
        <div className={styles.trialsTrialTypeSegment}>
          <div
            className={styles.trialsTrialTypeRowSelector}
            style={{ backgroundColor: phase === 'main' ? '#1AC4EF' : '#EB1B66' }}
          >
            {phase === 'main' ? 'Experimental' : 'Practice'}
          </div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              style={{ color: '#C4C4C4' }}
              onClick={() => setPhaseMenuOpen((o) => !o)}
            >
              ▾
            </button>
            {phaseMenuOpen && (
              <div style={{ position: 'absolute', right: 0, zIndex: 10, background: 'white', border: '1px solid #eee', borderRadius: 4 }}>
                <div className="px-3 py-1 cursor-pointer hover:bg-gray-100" onClick={() => { onChange(num, 'phase', 'main'); setPhaseMenuOpen(false); }}>Experimental</div>
                <div className="px-3 py-1 cursor-pointer hover:bg-gray-100" onClick={() => { onChange(num, 'phase', 'practice'); setPhaseMenuOpen(false); }}>Practice</div>
              </div>
            )}
          </div>
        </div>
        <Button variant="secondary" onClick={() => onDelete(num)}>
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );
};
