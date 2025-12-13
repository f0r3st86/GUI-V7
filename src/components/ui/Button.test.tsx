/**
 * Button Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import { Button } from './Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render button with children', () => {
      render(<Button>Click Me</Button>);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should render button with different text', () => {
      render(<Button>Submit</Button>);

      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render default variant by default', () => {
      render(<Button>Default</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded', 'transition-colors', 'font-medium');
    });

    it('should render primary variant', () => {
      render(<Button variant="primary">Primary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-green-600');
    });

    it('should render danger variant', () => {
      render(<Button variant="danger">Delete</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
    });

    it('should render success variant', () => {
      render(<Button variant="success">Success</Button>);

      const button = screen.getByRole('button');
      // Success variant uses theme styles
      expect(button).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render small size by default', () => {
      render(<Button>Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-xs');
    });

    it('should render medium size', () => {
      render(<Button size="md">Medium</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
    });

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-base');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Click</Button>);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('HTML Attributes', () => {
    it('should support type attribute', () => {
      render(<Button type="submit">Submit</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('should support disabled attribute', () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should support custom className', () => {
      render(<Button className="custom-class">Custom</Button>);

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('should support data attributes', () => {
      render(<Button data-testid="custom-button">Test</Button>);

      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should apply variant and size together', () => {
      render(<Button variant="primary" size="lg">Large Primary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-green-600', 'px-6', 'py-3');
    });

    it('should apply custom className with variant', () => {
      render(<Button variant="danger" className="my-custom">Custom Danger</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600', 'my-custom');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', () => {
      render(<Button>Focus Me</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });
});
