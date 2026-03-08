import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../src/renderer/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../src/renderer/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '../src/renderer/components/ui/dialog';

describe('Shadcn/ui Button', () => {
  it('renders with default Tailwind classes', () => {
    const { container } = render(<Button>Click me</Button>);
    const btn = container.querySelector('button');
    expect(btn).toBeDefined();
    expect(btn?.className).toContain('inline-flex');
    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('applies variant classes', () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('border');
  });

  it('applies size classes', () => {
    const { container } = render(<Button size="sm">Small</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('h-8');
  });
});

describe('Shadcn/ui Card', () => {
  it('renders card with content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>Content here</CardContent>
      </Card>
    );
    expect(screen.getByText('Test Card')).toBeDefined();
    expect(screen.getByText('Content here')).toBeDefined();
  });
});

describe('Shadcn/ui Dialog', () => {
  it('renders dialog when open', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Test Dialog')).toBeDefined();
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('does not render when closed', () => {
    render(
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent>
          <DialogTitle>Hidden Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.queryByText('Hidden Dialog')).toBeNull();
  });
});
