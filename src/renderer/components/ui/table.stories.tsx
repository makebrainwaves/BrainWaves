import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Badge } from './badge';

const meta: Meta<typeof Table> = {
  title: 'Primitives/Table',
  component: Table,
};
export default meta;
type Story = StoryObj<typeof Table>;

const rows = [
  ['subject-01', 'Session 1', 'Experimental', '324 epochs'],
  ['subject-02', 'Session 1', 'Practice', '12 epochs'],
  [
    'subject-03-with-an-unreasonably-long-identifier-from-a-classroom-import',
    'Session 2',
    'Experimental',
    '298 epochs',
  ],
];

export const Basic: Story = {
  render: () => (
    <div className="w-[720px] bg-white rounded-lg p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Epochs</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([subject, session, type, epochs]) => (
            <TableRow key={subject}>
              <TableCell className="max-w-56 truncate">{subject}</TableCell>
              <TableCell>{session}</TableCell>
              <TableCell>
                <Badge
                  variant={type === 'Practice' ? 'practice' : 'experimental'}
                >
                  {type}
                </Badge>
              </TableCell>
              <TableCell>{epochs}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

/** Wide content scrolls inside the table's own overflow container. */
export const Overflow: Story = {
  render: () => (
    <div className="w-96 bg-white rounded-lg p-2">
      <Table>
        <TableHeader>
          <TableRow>
            {[
              'Subject',
              'Session',
              'Group',
              'Device',
              'Sampling rate',
              'Channels',
              'Epochs',
            ].map((h) => (
              <TableHead key={h} className="whitespace-nowrap">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            {[
              'subject-01',
              '1',
              'morning-class',
              'Muse 2',
              '256 Hz',
              'AF7 AF8 TP9 TP10',
              '324',
            ].map((c) => (
              <TableCell key={c} className="whitespace-nowrap">
                {c}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="w-[720px] bg-white rounded-lg p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Epochs</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={3} className="py-10 text-center text-ink-muted">
              No recordings yet. Run &amp; record an experiment to see data
              here.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};
