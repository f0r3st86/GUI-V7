/**
 * Select Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import { Select } from './Select';

describe('Select', () => {
  const stringOptions = ['Option 1', 'Option 2', 'Option 3'];
  const objectOptions = [
    { value: 'opt1', label: 'Option One' },
    { value: 'opt2', label: 'Option Two' },
    { value: 'opt3', label: 'Option Three' }
  ];

  describe('Rendering', () => {
    it('should render select element', () => {
      render(<Select options={stringOptions} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Select options={stringOptions} label="Choose Option" />);

      expect(screen.getByText('Choose Option')).toBeInTheDocument();
    });

    it('should render without label when not provided', () => {
      render(<Select options={stringOptions} />);

      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });
  });

  describe('String Options', () => {
    it('should render all string options', () => {
      render(<Select options={stringOptions} />);

      const select = screen.getByRole('combobox');
      expect(select.querySelectorAll('option')).toHaveLength(3);
    });

    it('should display string options as both value and label', () => {
      render(<Select options={stringOptions} />);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('should have correct values for string options', () => {
      render(<Select options={stringOptions} />);

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveValue('Option 1');
      expect(options[1]).toHaveValue('Option 2');
    });
  });

  describe('Object Options', () => {
    it('should render all object options', () => {
      render(<Select options={objectOptions} />);

      const select = screen.getByRole('combobox');
      expect(select.querySelectorAll('option')).toHaveLength(3);
    });

    it('should display option labels', () => {
      render(<Select options={objectOptions} />);

      expect(screen.getByText('Option One')).toBeInTheDocument();
      expect(screen.getByText('Option Two')).toBeInTheDocument();
      expect(screen.getByText('Option Three')).toBeInTheDocument();
    });

    it('should have correct values for object options', () => {
      render(<Select options={objectOptions} />);

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveValue('opt1');
      expect(options[1]).toHaveValue('opt2');
      expect(options[2]).toHaveValue('opt3');
    });
  });

  describe('Interactions', () => {
    it('should call onChange when selection changes', () => {
      const handleChange = vi.fn();
      render(<Select options={stringOptions} onChange={handleChange} />);

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Option 2' } });

      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value when selection changes', () => {
      render(<Select options={objectOptions} defaultValue="opt1" />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('opt1');

      fireEvent.change(select, { target: { value: 'opt2' } });

      expect(select).toHaveValue('opt2');
    });
  });

  describe('Controlled Mode', () => {
    it('should display controlled value', () => {
      render(<Select options={objectOptions} value="opt2" onChange={() => {}} />);

      expect(screen.getByRole('combobox')).toHaveValue('opt2');
    });

    it('should call onChange with event in controlled mode', () => {
      const handleChange = vi.fn();
      render(<Select options={objectOptions} value="opt1" onChange={handleChange} />);

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'opt3' } });

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('HTML Attributes', () => {
    it('should support disabled attribute', () => {
      render(<Select options={stringOptions} disabled />);

      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('should support name attribute', () => {
      render(<Select options={stringOptions} name="mySelect" />);

      expect(screen.getByRole('combobox')).toHaveAttribute('name', 'mySelect');
    });

    it('should support required attribute', () => {
      render(<Select options={stringOptions} required />);

      expect(screen.getByRole('combobox')).toBeRequired();
    });

    it('should support custom className', () => {
      render(<Select options={stringOptions} className="custom-select" />);

      expect(screen.getByRole('combobox')).toHaveClass('custom-select');
    });

    it('should support aria-label', () => {
      render(<Select options={stringOptions} aria-label="Select an option" />);

      expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Select an option');
    });

    it('should support data-testid', () => {
      render(<Select options={stringOptions} data-testid="my-select" />);

      expect(screen.getByTestId('my-select')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have text-xs class', () => {
      render(<Select options={stringOptions} />);

      expect(screen.getByRole('combobox')).toHaveClass('text-xs');
    });

    it('should have rounded corners', () => {
      render(<Select options={stringOptions} />);

      expect(screen.getByRole('combobox')).toHaveClass('rounded');
    });

    it('should have full width', () => {
      render(<Select options={stringOptions} />);

      expect(screen.getByRole('combobox')).toHaveClass('w-full');
    });

    it('should have proper padding', () => {
      render(<Select options={stringOptions} />);

      expect(screen.getByRole('combobox')).toHaveClass('px-2', 'py-1');
    });
  });

  describe('Label Styling', () => {
    it('should have muted text for label', () => {
      render(<Select options={stringOptions} label="Test Label" />);

      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('text-xs');
    });

    it('should have margin below label', () => {
      render(<Select options={stringOptions} label="Test Label" />);

      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('mb-1');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', () => {
      render(<Select options={stringOptions} />);

      const select = screen.getByRole('combobox');
      select.focus();

      expect(select).toHaveFocus();
    });
  });

  describe('Empty Options', () => {
    it('should handle empty options array', () => {
      render(<Select options={[]} />);

      const select = screen.getByRole('combobox');
      expect(select.querySelectorAll('option')).toHaveLength(0);
    });
  });
});
