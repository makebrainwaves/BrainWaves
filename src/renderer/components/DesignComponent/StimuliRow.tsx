/* Breaking this component on its own is done mainly to increase performance. Text input is slow otherwise */

import React, { useState, useRef } from 'react';
import { isString } from 'lodash';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  return (
    <tr className={styles.trialsRow}>
      <td className={styles.conditionsNameRow}>
        <div style={{ alignSelf: 'center' }}>{num + 1}.</div>
        <div>{name}</div>
      </td>

      <td className={styles.experimentRowName}>
        <div>{condition}</div>
      </td>

      <td className={styles.experimentRowName}>
        <select
          value={response}
          onChange={(event) => {
            const val = event.target.value;
            onChange(num, 'response', isString(val) ? val : '');
          }}
          className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled>
            Response
          </option>
          {RESPONSE_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.value}>
              {opt.text}
            </option>
          ))}
        </select>
      </td>

      <td className={styles.trialsTrialTypeRow}>
        <div className="p-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            className={styles.trialsTrialTypeRowSelector}
            style={{
              backgroundColor: phase === 'main' ? '#1AC4EF' : '#EB1B66',
            }}
          >
            {phase === 'main' ? 'Experimental' : 'Practice'}
          </div>
          <div
            ref={dropdownRef}
            style={{ position: 'relative', display: 'grid', color: '#C4C4C4', justifyContent: 'end' }}
          >
            <button
              className="px-2 py-1 text-gray-400 hover:text-gray-600"
              onClick={() => setDropdownOpen((o) => !o)}
              type="button"
            >
              ▾
            </button>
            {dropdownOpen && (
              <div
                className="absolute right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10"
                style={{ top: '100%' }}
              >
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onChange(num, 'phase', 'main');
                    setDropdownOpen(false);
                  }}
                >
                  <div>Experimental</div>
                </div>
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onChange(num, 'phase', 'practice');
                    setDropdownOpen(false);
                  }}
                >
                  <div>Practice</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors font-medium"
          onClick={() => {
            onDelete(num);
          }}
        >
          Delete
        </button>
      </td>
    </tr>
  );
};
