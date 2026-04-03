import React, { Component } from 'react';
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

interface State {
  subject: string;
  group: string;
  session: number;
  isSubjectError: boolean;
  isSessionError: boolean;
}

export default class InputCollect extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      subject: this.props.data && this.props.data.subject,
      group: this.props.data && this.props.data.group,
      session: this.props.data && this.props.data.session,
      isSubjectError: false,
      isSessionError: false,
    };
    this.handleTextEntry = this.handleTextEntry.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleEnterSubmit = this.handleEnterSubmit.bind(this);
    this.handleExit = this.handleExit.bind(this);
  }

  handleTextEntry(
    event: React.ChangeEvent<HTMLInputElement>,
    field: keyof InputData
  ) {
    const { value } = event.target;
    switch (field) {
      case 'session':
        this.setState({ [field]: parseInt(value, 10) });
        break;
      case 'group':
        this.setState({ [field]: value });
        break;
      case 'subject':
      default:
        this.setState({ subject: value });
    }
  }

  handleClose() {
    if (this.state.subject.length >= 1 && this.state.session) {
      this.props.onClose(
        sanitizeTextInput(this.state.subject),
        sanitizeTextInput(this.state.group),
        this.state.session
      );
    } else {
      if (this.state.subject.length < 1) {
        this.setState({ isSubjectError: true });
      }
      if (!this.state.session) {
        this.setState({ isSessionError: true });
      }
    }
  }

  handleExit() {
    this.props.onExit();
  }

  handleEnterSubmit(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      this.handleClose();
    }
  }

  render() {
    return (
      <Dialog
        open={this.props.open}
        onOpenChange={(open) => {
          if (!open) this.handleExit();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{this.props.header}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="input-subject" className="block text-sm mb-1">
                Enter Subject ID
              </label>
              <input
                id="input-subject"
                className={[
                  'w-full border rounded px-3 py-2',
                  this.state.isSubjectError
                    ? 'border-red-500'
                    : 'border-gray-300',
                ].join(' ')}
                onChange={(e) => this.handleTextEntry(e, 'subject')}
                onKeyDown={this.handleEnterSubmit}
                value={this.state.subject}
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
                onChange={(e) => this.handleTextEntry(e, 'group')}
                onKeyDown={this.handleEnterSubmit}
                value={this.state.group}
              />
            </div>
            <div>
              <label htmlFor="input-session" className="block text-sm mb-1">
                Enter session number
              </label>
              <input
                id="input-session"
                className={[
                  'w-full border rounded px-3 py-2',
                  this.state.isSessionError
                    ? 'border-red-500'
                    : 'border-gray-300',
                ].join(' ')}
                type="number"
                onChange={(e) => this.handleTextEntry(e, 'session')}
                onKeyDown={this.handleEnterSubmit}
                value={this.state.session}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="default" onClick={this.handleClose}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
}
