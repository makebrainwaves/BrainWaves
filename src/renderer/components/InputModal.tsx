import React, { useMemo, useEffect, useState } from 'react';
import { debounce } from 'lodash';
import { sanitizeTextInput } from '../utils/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

interface Props {
  open: boolean;
  onClose: (arg0: string) => void;
  onExit: () => void;
  header: string;
}

export default function InputModal(props: Props) {
  const [enteredText, setEnteredText] = useState('');
  const [isError, setIsError] = useState(false);

  const handleTextEntry = useMemo(
    () =>
      debounce((value: string) => {
        setEnteredText(value);
      }, 100),
    []
  );

  useEffect(() => () => {
    handleTextEntry.cancel();
  }, [handleTextEntry]);

  function handleClose() {
    if (enteredText.length >= 1) {
      props.onClose(sanitizeTextInput(enteredText));
    } else {
      setIsError(true);
    }
  }

  function handleExit() {
    props.onExit();
  }

  function handleEnterSubmit(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      handleClose();
    }
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) handleExit();
      }}
    >
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle>{props.header}</DialogTitle>
        </DialogHeader>
        <input
          className={[
            'w-full border rounded px-3 py-2',
            isError ? 'border-red-500' : 'border-gray-300',
          ].join(' ')}
          onChange={(e) => handleTextEntry(e.target.value)}
          onKeyDown={handleEnterSubmit}
          autoFocus
        />
        <div className="flex justify-end mt-4">
          <Button variant="default" onClick={handleClose}>
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}