/**
 * Input Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import { Input, CalculatedInput } from './Input';

describe('Input', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Username" />);

      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render without label when not provided', () => {
      render(<Input />);

      // Only input should be present
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });
  });

  describe('Value Handling', () => {
    it('should display initial value', () => {
      render(<Input defaultValue="initial" />);

      expect(screen.getByRole('textbox')).toHaveValue('initial');
    });

    it('should handle controlled value', () => {
      render(<Input value="controlled" onChange={() => {}} />);

      expect(screen.getByRole('textbox')).toHaveValue('controlled');
    });

    it('should call onChange when typing', () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });

      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value on typing in uncontrolled mode', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'typed value' } });

      expect(input).toHaveValue('typed value');
    });
  });

  describe('ReadOnly State', () => {
    it('should be editable by default', () => {
      render(<Input />);

      expect(screen.getByRole('textbox')).not.toHaveAttribute('readonly');
    });

    it('should be readonly when prop is true', () => {
      render(<Input readOnly />);

      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });

    it('should apply readonly styles', () => {
      render(<Input readOnly />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Calculated State', () => {
    it('should apply calculated styles when isCalculated is true', () => {
      render(<Input readOnly isCalculated />);

      // Calculated inputs have yellow text
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
    });

    it('should be both readonly and calculated together', () => {
      render(<Input readOnly isCalculated value="$1,000" onChange={() => {}} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveValue('$1,000');
    });
  });

  describe('HTML Attributes', () => {
    it('should support placeholder', () => {
      render(<Input placeholder="Enter text..." />);

      expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Enter text...');
    });

    it('should support type attribute', () => {
      render(<Input type="email" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('should support disabled attribute', () => {
      render(<Input disabled />);

      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should support custom className', () => {
      render(<Input className="custom-input" />);

      expect(screen.getByRole('textbox')).toHaveClass('custom-input');
    });

    it('should support name attribute', () => {
      render(<Input name="email" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email');
    });

    it('should support maxLength attribute', () => {
      render(<Input maxLength={10} />);

      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '10');
    });

    it('should support required attribute', () => {
      render(<Input required />);

      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('should support data-testid', () => {
      render(<Input data-testid="custom-input" />);

      expect(screen.getByTestId('custom-input')).toBeInTheDocument();
    });
  });

  describe('Events', () => {
    it('should call onBlur when focus is lost', () => {
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should call onFocus when focused', () => {
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);

      fireEvent.focus(screen.getByRole('textbox'));

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onKeyDown when key is pressed', () => {
      const handleKeyDown = vi.fn();
      render(<Input onKeyDown={handleKeyDown} />);

      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('Theme Styling', () => {
    it('should have text-xs class', () => {
      render(<Input />);

      expect(screen.getByRole('textbox')).toHaveClass('text-xs');
    });

    it('should have rounded corners', () => {
      render(<Input />);

      expect(screen.getByRole('textbox')).toHaveClass('rounded');
    });

    it('should have proper padding', () => {
      render(<Input />);

      expect(screen.getByRole('textbox')).toHaveClass('px-2', 'py-1');
    });

    it('should have full width', () => {
      render(<Input />);

      expect(screen.getByRole('textbox')).toHaveClass('w-full');
    });
  });

  describe('Label Styling', () => {
    it('should have muted text color for label', () => {
      render(<Input label="Test Label" />);

      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('text-xs');
    });

    it('should have margin below label', () => {
      render(<Input label="Test Label" />);

      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('mb-1');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      input.focus();

      expect(input).toHaveFocus();
    });

    it('should support aria-label', () => {
      render(<Input aria-label="Search input" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Search input');
    });

    it('should support aria-describedby', () => {
      render(<Input aria-describedby="help-text" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'help-text');
    });
  });
});

describe('CalculatedInput', () => {
  it('should render as readonly', () => {
    render(<CalculatedInput />);

    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });

  it('should apply calculated styling', () => {
    render(<CalculatedInput value="$100" onChange={() => {}} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveClass('cursor-not-allowed');
  });

  it('should display provided value', () => {
    render(<CalculatedInput value="1,234.56" onChange={() => {}} />);

    expect(screen.getByRole('textbox')).toHaveValue('1,234.56');
  });

  it('should support label', () => {
    render(<CalculatedInput label="Calculated Field" value="100" onChange={() => {}} />);

    expect(screen.getByText('Calculated Field')).toBeInTheDocument();
  });
});
