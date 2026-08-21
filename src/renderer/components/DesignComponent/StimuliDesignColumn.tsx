/* Breaking this component on its own is done mainly to increase performance. Text input is slow otherwise */

import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { TableRow, TableCell } from '../ui/table';
import { toast } from 'react-toastify';
import path from 'pathe';
import { isString } from 'lodash';
import { readImages, readAudioFiles } from '../../utils/filesystem/storage';
import { loadFromSystemDialog } from '../../utils/filesystem/select';
import { FILE_TYPES } from '../../constants/constants';

interface Props {
  num: number;
  title: string;
  response: string;
  dir: string;
  audioDir: string;
  numberImages?: number;
  onChange: (arg0: string, arg1: string, arg2: string) => void;
}

const RESPONSE_OPTIONS = new Array(10).fill(0).map((_, i) => ({
  key: i.toString(),
  text: i.toString(),
  value: i.toString(),
}));

const lastSegment = (dir: string) => dir.split(path.sep).slice(-1).join(' / ');

function StimuliDesignColumn(props: Props) {
  const [numberImages, setNumberImages] = useState<number | undefined>(
    undefined
  );
  const [numberSounds, setNumberSounds] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    void refreshSoundCount(props.audioDir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.audioDir]);

  async function refreshSoundCount(audioDir: string) {
    if (!audioDir) return;
    const sounds = await readAudioFiles(audioDir);
    setNumberSounds(sounds.length);
  }

  async function handleSelectFolder() {
    const dir = await loadFromSystemDialog(FILE_TYPES.STIMULUS_DIR);
    if (dir && isString(dir)) {
      const images = await readImages(dir);
      if (images.length < 1) {
        toast.error('No images in folder!');
      }
      setNumberImages(images.length);
      props.onChange('dir', dir, `stimulus${props.num}`);
    }
  }

  function handleRemoveFolder() {
    setNumberImages(0);
    props.onChange('dir', '', `stimulus${props.num}`);
  }

  async function handleSelectAudioFolder() {
    const dir = await loadFromSystemDialog(FILE_TYPES.AUDIO_DIR);
    if (dir && isString(dir)) {
      const sounds = await readAudioFiles(dir);
      if (sounds.length < 1) {
        toast.error('No audio files in folder!');
        return;
      }
      setNumberSounds(sounds.length);
      props.onChange('audioDir', dir, `stimulus${props.num}`);
    }
  }

  function handleRemoveAudioFolder() {
    setNumberSounds(0);
    props.onChange('audioDir', '', `stimulus${props.num}`);
  }

  return (
    <TableRow>
      <TableCell className="pl-[60px]">
        <div className="grid grid-cols-[50px_1fr] items-center gap-2">
          <span>{props.num}</span>
          <input
            className="border border-gray-300 rounded px-2 py-1 w-full"
            value={props.title}
            onChange={(event) =>
              props.onChange(
                'title',
                event.target.value,
                `stimulus${props.num}`
              )
            }
            placeholder="Enter condition name"
          />
        </div>
      </TableCell>

      <TableCell className="pl-6 pr-2.5">
        <select
          className="w-full border border-gray-300 rounded px-2 py-1"
          value={props.response}
          onChange={(event) => {
            const val = event.target.value;
            if (val && isString(val)) {
              props.onChange('response', val, `stimulus${props.num}`);
            }
          }}
        >
          <option value="">Select</option>
          {RESPONSE_OPTIONS.map((o) => (
            <option key={o.key} value={o.value}>
              {o.text}
            </option>
          ))}
        </select>
      </TableCell>

      <TableCell className="pl-6 pr-2.5">
        {props.dir ? (
          <div className="inline-grid grid-cols-[auto_auto_1fr] gap-2.5 border-2 border-gray-300 p-2 rounded w-fit items-center">
            <div>Folder {lastSegment(props.dir)}</div>
            <div>( {numberImages || props.numberImages} images )</div>
            <button onClick={handleRemoveFolder} aria-label="Remove">
              ✕
            </button>
          </div>
        ) : (
          <Button variant="secondary" onClick={handleSelectFolder}>
            Select folder
          </Button>
        )}
      </TableCell>

      <TableCell className="pl-6 pr-2.5">
        {props.audioDir ? (
          <div className="inline-grid grid-cols-[auto_auto_1fr] gap-2.5 border-2 border-gray-300 p-2 rounded w-fit items-center">
            <div>🔊 {lastSegment(props.audioDir)}</div>
            {numberSounds !== undefined && <div>( {numberSounds} sounds )</div>}
            <button
              onClick={handleRemoveAudioFolder}
              aria-label="Remove sounds"
            >
              ✕
            </button>
          </div>
        ) : (
          <Button variant="secondary" onClick={handleSelectAudioFolder}>
            Select sound folder
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export default React.memo(StimuliDesignColumn, (prev, next) => {
  return (
    prev.title === next.title &&
    prev.response === next.response &&
    prev.dir === next.dir &&
    prev.audioDir === next.audioDir &&
    prev.num === next.num &&
    prev.numberImages === next.numberImages
  );
});
