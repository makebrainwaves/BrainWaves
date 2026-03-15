import React, { Component } from 'react';
import { Button } from './ui/button';
import { storePyodideImage } from '../utils/filesystem/storage';

interface Props {
  title: string;
  imageTitle: string;
  plotMIMEBundle: { 'image/svg+xml': string } | null | undefined;
}

export default class PyodidePlotWidget extends Component<Props> {
  constructor(props: Props) {
    super(props);
    this.handleSave = this.handleSave.bind(this);
  }

  handleSave() {
    const svg = this.props.plotMIMEBundle?.['image/svg+xml'];
    if (!svg) return;
    const buf = Buffer.from(svg, 'utf8');
    storePyodideImage(this.props.title, this.props.imageTitle, buf.buffer as ArrayBuffer);
  }

  render() {
    const svg = this.props.plotMIMEBundle?.['image/svg+xml'];
    if (!svg) return <div className="p-2" />;
    return (
      <div className="p-2">
        <img
          className="w-full h-auto"
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
          alt={this.props.imageTitle}
        />
        <Button variant="default" size="sm" onClick={this.handleSave}>
          Save Image
        </Button>
      </div>
    );
  }
}
