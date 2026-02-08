/**
 * PayHistTab Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { PayHistTab } from './PayHistTab';

describe('PayHistTab', () => {
  describe('Loan Header Info', () => {
    it('should display loan number label', () => {
      render(<PayHistTab />);

      expect(screen.getByText('Loan #:')).toBeInTheDocument();
    });

    it('should display borrower label', () => {
      render(<PayHistTab />);

      expect(screen.getByText('Borrower:')).toBeInTheDocument();
    });

    it('should display current balance label', () => {
      render(<PayHistTab />);

      expect(screen.getByText('Current Balance:')).toBeInTheDocument();
    });

    it('should display monthly payment label', () => {
      render(<PayHistTab />);

      expect(screen.getByText('Monthly Payment:')).toBeInTheDocument();
    });

    it('should display rate label', () => {
      render(<PayHistTab />);

      expect(screen.getByText('Rate:')).toBeInTheDocument();
    });

    it('should display Export History button', () => {
      render(<PayHistTab />);

      expect(screen.getByText('Export History')).toBeInTheDocument();
    });
  });

  describe('Payment Entry Section', () => {
    it('should render Payment Entry header', () => {
      render(<PayHistTab />);

      expect(screen.getByText(/Payment Entry for Loan/)).toBeInTheDocument();
    });

    it('should render Year column header', () => {
      render(<PayHistTab />);

      expect(screen.getByText('Year')).toBeInTheDocument();
    });

    it('should render Month column header', () => {
      render(<PayHistTab />);

      expect(screen.getByText('Month')).toBeInTheDocument();
    });

    it('should render Amount column header', () => {
      render(<PayHistTab />);

      expect(screen.getByText('Amount')).toBeInTheDocument();
    });
  });

  describe('Payment Grid', () => {
    it('should render payment grid header', () => {
      render(<PayHistTab />);

      expect(screen.getByText('Data will be displayed here')).toBeInTheDocument();
    });

    it('should render month headers', () => {
      render(<PayHistTab />);

      // PayHistTab uses full month names
      expect(screen.getByText('January')).toBeInTheDocument();
      expect(screen.getByText('February')).toBeInTheDocument();
      expect(screen.getByText('March')).toBeInTheDocument();
      expect(screen.getByText('April')).toBeInTheDocument();
      expect(screen.getByText('May')).toBeInTheDocument();
      expect(screen.getByText('June')).toBeInTheDocument();
      expect(screen.getByText('July')).toBeInTheDocument();
      expect(screen.getByText('August')).toBeInTheDocument();
      expect(screen.getByText('September')).toBeInTheDocument();
      expect(screen.getByText('October')).toBeInTheDocument();
      expect(screen.getByText('November')).toBeInTheDocument();
      expect(screen.getByText('December')).toBeInTheDocument();
    });

    it('should render Sum column', () => {
      render(<PayHistTab />);

      expect(screen.getByText('Sum')).toBeInTheDocument();
    });
  });

  describe('Trailing Payment Analytics', () => {
    it('should show trailing analytics headers', () => {
      render(<PayHistTab />);

      expect(screen.getByText('Trailing 12')).toBeInTheDocument();
      expect(screen.getByText('Trailing 6')).toBeInTheDocument();
      expect(screen.getByText('Trailing 3')).toBeInTheDocument();
    });

    it('should show metric rows in trailing analytics', () => {
      render(<PayHistTab />);

      // Each trailing card renders $/Mo, Actual, % Cont., Mo Pd
      expect(screen.getAllByText('$/Mo')).toHaveLength(3);
      expect(screen.getAllByText('Actual')).toHaveLength(3);
      expect(screen.getAllByText('% Cont.')).toHaveLength(3);
      expect(screen.getAllByText('Mo Pd')).toHaveLength(3);
    });
  });

  describe('SQL Connection Info', () => {
    it('should render SQL Connection Points', () => {
      render(<PayHistTab />);

      expect(screen.getByText('SQL Connection Points:')).toBeInTheDocument();
    });
  });

  describe('User Instructions', () => {
    it('should show editing instructions', () => {
      render(<PayHistTab />);

      expect(screen.getByText('Click any cell to edit')).toBeInTheDocument();
      expect(screen.getByText('Press Enter or Down to move down')).toBeInTheDocument();
      expect(screen.getByText('Press Tab to move right')).toBeInTheDocument();
      expect(screen.getByText('Amount supports calculations: 500+108.15')).toBeInTheDocument();
    });
  });

  describe('TOTAL Row', () => {
    it('should display TOTAL row', () => {
      render(<PayHistTab />);

      expect(screen.getByText('TOTAL')).toBeInTheDocument();
      expect(screen.getByText('Grand Total:')).toBeInTheDocument();
    });
  });

  describe('Input Placeholders', () => {
    it('should have year input placeholder', () => {
      render(<PayHistTab />);

      const yearInputs = screen.getAllByPlaceholderText('YYYY');
      expect(yearInputs.length).toBeGreaterThan(0);
    });

    it('should have month input placeholder', () => {
      render(<PayHistTab />);

      const monthInputs = screen.getAllByPlaceholderText('1-12');
      expect(monthInputs.length).toBeGreaterThan(0);
    });

    it('should have amount input placeholder', () => {
      render(<PayHistTab />);

      const amountInputs = screen.getAllByPlaceholderText('0.00');
      expect(amountInputs.length).toBeGreaterThan(0);
    });
  });
});
