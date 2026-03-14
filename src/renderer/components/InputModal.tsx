import React, { Component } from 'react';
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

interface State {
  enteredText: string;
  isError: boolean;
}

export default class InputModal extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      enteredText: '',
      isError: false,
    };
    this.handleTextEntry = debounce(this.handleTextEntry, 100).bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleEnterSubmit = this.handleEnterSubmit.bind(this);
    this.handleExit = this.handleExit.bind(this);
  }

  handleTextEntry(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ enteredText: event.target.value });
  }

  handleClose() {
    if (this.state.enteredText.length >= 1) {
      this.props.onClose(sanitizeTextInput(this.state.enteredText));
    } else {
      this.setState({ isError: true });
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
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>{this.props.header}</DialogTitle>
          </DialogHeader>
          <input
            className={[
              'w-full border rounded px-3 py-2',
              this.state.isError ? 'border-red-500' : 'border-gray-300',
            ].join(' ')}
            onChange={this.handleTextEntry}
            onKeyDown={this.handleEnterSubmit}
            autoFocus
          />
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
