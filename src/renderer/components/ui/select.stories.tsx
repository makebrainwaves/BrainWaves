import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

const meta: Meta<typeof Select> = {
  title: 'Primitives/Select',
  component: Select,
};
export default meta;
type Story = StoryObj<typeof Select>;

export const Basic: Story = {
  render: () => (
    <div className="p-4 w-64">
      <Select defaultValue="muse">
        <SelectTrigger>
          <SelectValue placeholder="Choose a device" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="muse">Muse 2</SelectItem>
          <SelectItem value="lsl">External LSL stream</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="p-4 w-64">
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="No devices found" />
        </SelectTrigger>
        <SelectContent />
      </Select>
    </div>
  ),
};

/** DESIGN.md rule: multi-selects are styled native elements — shadcn Select is single-select only. */
export const NativeMultiSelect: Story = {
  render: () => (
    <div className="p-4 w-64">
      <label
        className="block text-sm font-medium text-ink mb-1"
        htmlFor="channels"
      >
        Channels
      </label>
      <select
        id="channels"
        multiple
        size={5}
        defaultValue={['AF7', 'AF8']}
        className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-ink"
      >
        {['AF7', 'AF8', 'TP9', 'TP10', 'Fpz'].map((ch) => (
          <option key={ch} value={ch}>
            {ch}
          </option>
        ))}
      </select>
    </div>
  ),
};
