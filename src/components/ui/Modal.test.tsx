/**
 * Modal Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import { Modal, DeleteModal } from './Modal';

describe('Modal', () => {
  const defaultProps = {
    show: true,
    title: 'Test Modal',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    children: <p>Modal content</p>
  };

  describe('Visibility', () => {
    it('should render when show is true', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render when show is false', () => {
      render(<Modal {...defaultProps} show={false} />);

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should render title', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(
        <Modal {...defaultProps}>
          <div data-testid="custom-content">Custom Content</div>
        </Modal>
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });

    it('should render complex children', () => {
      render(
        <Modal {...defaultProps}>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        </Modal>
      );

      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
    });
  });

  describe('Buttons', () => {
    it('should render confirm button with default text', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('should render cancel button with default text', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should render custom confirm text', () => {
      render(<Modal {...defaultProps} confirmText="Yes, Do It" />);

      expect(screen.getByRole('button', { name: 'Yes, Do It' })).toBeInTheDocument();
    });

    it('should render custom cancel text', () => {
      render(<Modal {...defaultProps} cancelText="No, Go Back" />);

      expect(screen.getByRole('button', { name: 'No, Go Back' })).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn();
      render(<Modal {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn();
      render(<Modal {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Variants', () => {
    it('should apply danger variant to confirm button by default', () => {
      render(<Modal {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveClass('bg-red-600');
    });

    it('should apply primary variant when specified', () => {
      render(<Modal {...defaultProps} confirmVariant="primary" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveClass('bg-green-600');
    });

    it('should apply success variant when specified', () => {
      render(<Modal {...defaultProps} confirmVariant="success" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have fixed position overlay', () => {
      render(<Modal {...defaultProps} />);

      const overlay = screen.getByText('Test Modal').parentElement?.parentElement;
      expect(overlay).toHaveClass('fixed', 'inset-0');
    });

    it('should have backdrop', () => {
      render(<Modal {...defaultProps} />);

      const overlay = screen.getByText('Test Modal').parentElement?.parentElement;
      expect(overlay).toHaveClass('bg-black', 'bg-opacity-50');
    });

    it('should center modal content', () => {
      render(<Modal {...defaultProps} />);

      const overlay = screen.getByText('Test Modal').parentElement?.parentElement;
      expect(overlay).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should have z-index for layering', () => {
      render(<Modal {...defaultProps} />);

      const overlay = screen.getByText('Test Modal').parentElement?.parentElement;
      expect(overlay).toHaveClass('z-50');
    });

    it('should have max-width on modal content', () => {
      render(<Modal {...defaultProps} />);

      const modalContent = screen.getByText('Test Modal').parentElement;
      expect(modalContent).toHaveClass('max-w-md');
    });

    it('should have rounded corners on modal content', () => {
      render(<Modal {...defaultProps} />);

      const modalContent = screen.getByText('Test Modal').parentElement;
      expect(modalContent).toHaveClass('rounded-lg');
    });
  });

  describe('Button Layout', () => {
    it('should render buttons in flex container', () => {
      render(<Modal {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });
  });
});

describe('DeleteModal', () => {
  const defaultProps = {
    show: true,
    itemName: 'Test Item',
    onConfirm: vi.fn(),
    onCancel: vi.fn()
  };

  describe('Rendering', () => {
    it('should render when show is true', () => {
      render(<DeleteModal {...defaultProps} />);

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });

    it('should not render when show is false', () => {
      render(<DeleteModal {...defaultProps} show={false} />);

      expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should have "Confirm Delete" title', () => {
      render(<DeleteModal {...defaultProps} />);

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });

    it('should display item name', () => {
      render(<DeleteModal {...defaultProps} />);

      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('should show "(New)" for empty item name', () => {
      render(<DeleteModal {...defaultProps} itemName="" />);

      expect(screen.getByText('(New)')).toBeInTheDocument();
    });

    it('should display warning message', () => {
      render(<DeleteModal {...defaultProps} />);

      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });
  });

  describe('Buttons', () => {
    it('should have "Delete" as confirm button text', () => {
      render(<DeleteModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('should have "Cancel" as cancel button text', () => {
      render(<DeleteModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should use danger variant for delete button', () => {
      render(<DeleteModal {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      expect(deleteButton).toHaveClass('bg-red-600');
    });
  });

  describe('Interactions', () => {
    it('should call onConfirm when Delete is clicked', () => {
      const onConfirm = vi.fn();
      render(<DeleteModal {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when Cancel is clicked', () => {
      const onCancel = vi.fn();
      render(<DeleteModal {...defaultProps} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
