import React, { useState } from 'react';
import { sanitizeTextInput } from '../utils/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

interface InputData {
  subject: string;
  group: string;
  session: number;
}
interface Props {
  open: boolean;
  data: InputData;
  onClose: (subject: string, group: string, session: number) => void;
  onExit: () => void;
  header: string;
}

export default function InputCollect(props: Props) {
  const [subject, setSubject] = useState(props.data.subject);
  const [group, setGroup] = useState(props.data.group);
  const [session, setSession] = useState(props.data.session);
  const [isSubjectError, setIsSubjectError] = useState(false);
  const [isSessionError, setIsSessionError] = useState(false);

  function handleTextEntry(
    event: React.ChangeEvent<HTMLInputElement>,
    field: keyof InputData
  ) {
    const value = event.target.value;
    switch (field) {
      case 'session':
        setSession(parseInt(value, 10));
        break;
      case 'group':
        setGroup(value);
        break;
      case 'subject':
      default:
        setSubject(value);
    }
  }

  function handleClose() {
    if (subject.length >= 1 && session) {
      props.onClose(
        sanitizeTextInput(subject),
        sanitizeTextInput(group),
        session
      );
    } else {
      if (subject.length < 1) {
        setIsSubjectError(true);
      }
      if (!session) {
        setIsSessionError(true);
      }
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{props.header}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="input-subject" className="block text-sm mb-1">Enter Subject ID</label>
            <input
              id="input-subject"
              className={[
                'w-full border rounded px-3 py-2',
                isSubjectError
                  ? 'border-red-500'
                  : 'border-gray-300',
              ].join(' ')}
              onChange={(e) => handleTextEntry(e, 'subject')}
              onKeyDown={handleEnterSubmit}
              value={subject}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="input-group" className="block text-sm mb-1">
              Enter group name (optional)
            </label>
            <input
              id="input-group"
              className="w-full border border-gray-300 rounded px-3 py-2"
              onChange={(e) => handleTextEntry(e, 'group')}
              onKeyDown={handleEnterSubmit}
              value={group}
            />
          </div>
          <div>
            <label htmlFor="input-session" className="block text-sm mb-1">Enter session number</label>
            <input
              id="input-session"
              className={[
                'w-full border rounded px-3 py-2',
                isSessionError
                  ? 'border-red-500'
                  : 'border-gray-300',
              ].join(' ')}
              type="number"
              onChange={(e) => handleTextEntry(e, 'session')}
              onKeyDown={handleEnterSubmit}
              value={session}
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="default" onClick={handleClose}>
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}