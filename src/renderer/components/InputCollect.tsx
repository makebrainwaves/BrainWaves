import React, { Component } from 'react';
import { sanitizeTextInput } from '../utils/ui';
import styles from './styles/common.module.css';
import { Dialog, DialogContent } from './ui/dialog';

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

  handleTextEntry(value: string, field: keyof InputData) {
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

  handleEnterSubmit(event: KeyboardEvent) {
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
          <div className="mb-4">
            <label className="block mb-1">Enter Subject ID</label>
            <input
              className={`border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500${this.state.isSubjectError ? ' border-red-500' : ' border-gray-300'}`}
              onChange={(e) => this.handleTextEntry(e.target.value, 'subject')}
              onKeyDown={this.handleEnterSubmit as any}
              value={this.state.subject}
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Enter group name (optional)</label>
            <input
              className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => this.handleTextEntry(e.target.value, 'group')}
              onKeyDown={this.handleEnterSubmit as any}
              value={this.state.group}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Enter session number</label>
            <input
              className={`border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500${this.state.isSessionError ? ' border-red-500' : ' border-gray-300'}`}
              onChange={(e) => this.handleTextEntry(e.target.value, 'session')}
              onKeyDown={this.handleEnterSubmit as any}
              value={this.state.session}
              type="number"
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
