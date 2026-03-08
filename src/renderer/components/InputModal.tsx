import React, { Component } from 'react';
import { debounce } from 'lodash';
import { sanitizeTextInput } from '../utils/ui';
import styles from './styles/common.module.css';
import { Dialog, DialogContent } from './ui/dialog';

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

  handleEnterSubmit(event: Record<string, any>) {
    if (event.key === 'Enter') {
      this.handleClose();
    }
  }

  render() {
    return (
      <Dialog
        open={this.props.open}
        onOpenChange={(open) => { if (!open) this.handleExit(); }}
      >
        <DialogContent className={styles.inputModal}>
          <div className="mb-4">{this.props.header}</div>
          <div className="mb-4">
            <input
              className={`border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500${this.state.isError ? ' border-red-500' : ' border-gray-300'}`}
              onChange={this.handleTextEntry}
              onKeyDown={this.handleEnterSubmit as any}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium"
              onClick={this.handleClose}
            >
              OK
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
}
