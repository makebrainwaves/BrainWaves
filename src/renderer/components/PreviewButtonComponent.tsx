import React from 'react';
import { Button } from './ui/button';

interface Props {
  isPreviewing: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function PreviewButton(props: Props) {
  if (!props.isPreviewing) {
    return (
      <Button variant="secondary" onClick={props.onClick}>
        Preview Experiment
      </Button>
    );
  }
  return (
    <Button variant="destructive" onClick={props.onClick}>
      Stop Preview
    </Button>
  );
}