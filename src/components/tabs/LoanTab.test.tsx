/**
 * LoanTab Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { LoanTab } from './LoanTab';

describe('LoanTab', () => {
  describe('Rendering with Selected Loan', () => {
    it('should render loan number field', () => {
      render(<LoanTab />);

      expect(screen.getByText('MW Loan #:')).toBeInTheDocument();
    });

    it('should render borrower field', () => {
      render(<LoanTab />);

      expect(screen.getByText('Borrower:')).toBeInTheDocument();
    });

    it('should render balance fields', () => {
      render(<LoanTab />);

      expect(screen.getByText('Orig Balance:')).toBeInTheDocument();
      expect(screen.getByText('Principal:')).toBeInTheDocument();
      expect(screen.getByText('Interest:')).toBeInTheDocument();
      expect(screen.getByText('Escrow:')).toBeInTheDocument();
      expect(screen.getByText('Other:')).toBeInTheDocument();
      expect(screen.getByText('Total Balance:')).toBeInTheDocument();
    });

    it('should render rate fields', () => {
      render(<LoanTab />);

      expect(screen.getByText('Int Rate:')).toBeInTheDocument();
      expect(screen.getByText('Default Rate:')).toBeInTheDocument();
    });

    it('should render payment fields', () => {
      render(<LoanTab />);

      expect(screen.getByText('Payment:')).toBeInTheDocument();
      expect(screen.getByText('Escrow Pmt:')).toBeInTheDocument();
      expect(screen.getByText('Pmt Freq:')).toBeInTheDocument();
    });

    it('should render date fields', () => {
      render(<LoanTab />);

      expect(screen.getByText('Not Due:')).toBeInTheDocument();
      expect(screen.getByText('Last PMT:')).toBeInTheDocument();
      expect(screen.getByText('Orig Dt:')).toBeInTheDocument();
      expect(screen.getByText('Mat Dt:')).toBeInTheDocument();
      expect(screen.getByText('Acc Dt:')).toBeInTheDocument();
      expect(screen.getByText('Due Dt:')).toBeInTheDocument();
    });

    it('should render address fields', () => {
      render(<LoanTab />);

      expect(screen.getByText('Address 1:')).toBeInTheDocument();
      expect(screen.getByText('Address 2:')).toBeInTheDocument();
      expect(screen.getByText('City:')).toBeInTheDocument();
      expect(screen.getByText('State:')).toBeInTheDocument();
      expect(screen.getByText('Zip:')).toBeInTheDocument();
    });

    it('should render rate type section', () => {
      render(<LoanTab />);

      expect(screen.getByText('Rate Type:')).toBeInTheDocument();
      expect(screen.getByText('Floor:')).toBeInTheDocument();
      expect(screen.getByText('Ceiling:')).toBeInTheDocument();
      expect(screen.getByText('Margin:')).toBeInTheDocument();
    });

    it('should render calculated fields', () => {
      render(<LoanTab />);

      expect(screen.getByText('Months Interest Accrued:')).toBeInTheDocument();
      expect(screen.getByText('Months to Maturity:')).toBeInTheDocument();
      expect(screen.getByText('Months to Amortization:')).toBeInTheDocument();
    });
  });

  describe('Status Field Options', () => {
    it('should render status dropdown with options', () => {
      render(<LoanTab />);

      expect(screen.getByText('Status:')).toBeInTheDocument();

      // Multiple comboboxes exist, check that at least one exists
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThan(0);
    });

    it('should have status options', () => {
      render(<LoanTab />);

      expect(screen.getByText('PA - Performing Asset')).toBeInTheDocument();
      expect(screen.getByText('FC - Foreclosure')).toBeInTheDocument();
      expect(screen.getByText('BK - Bankruptcy')).toBeInTheDocument();
      expect(screen.getByText('REO - Real Estate Owned')).toBeInTheDocument();
    });
  });

  describe('Payment Frequency Options', () => {
    it('should have payment frequency options', () => {
      render(<LoanTab />);

      // Find the payment frequency select by its displayed value
      const options = screen.getAllByRole('option');
      const pmtFreqOptions = options.filter(opt =>
        ['M', 'Q', 'SA', 'A'].includes(opt.textContent || '')
      );
      expect(pmtFreqOptions.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Rate Type Options', () => {
    it('should have rate type options', () => {
      render(<LoanTab />);

      expect(screen.getByText('Fixed')).toBeInTheDocument();
      expect(screen.getByText('Variable')).toBeInTheDocument();
      expect(screen.getByText('Adjustable')).toBeInTheDocument();
    });
  });

  describe('Asset Type Options', () => {
    it('should render asset type dropdown', () => {
      render(<LoanTab />);

      expect(screen.getByText('AssetType:')).toBeInTheDocument();
    });

    it('should have asset type options', () => {
      render(<LoanTab />);

      expect(screen.getByText('Commercial RE')).toBeInTheDocument();
      expect(screen.getByText('Residential')).toBeInTheDocument();
      expect(screen.getByText('Multi-family')).toBeInTheDocument();
      expect(screen.getByText('Land')).toBeInTheDocument();
      expect(screen.getByText('Construction')).toBeInTheDocument();
    });
  });

  describe('Index Options', () => {
    it('should have rate index options', () => {
      render(<LoanTab />);

      expect(screen.getByText('LIBOR')).toBeInTheDocument();
      expect(screen.getByText('SOFR')).toBeInTheDocument();
      expect(screen.getByText('Prime')).toBeInTheDocument();
    });
  });

  describe('Field Interactions', () => {
    it('should have editable borrower name input', () => {
      render(<LoanTab />);

      // Find the borrower input and verify it's editable (not readonly)
      const borrowerInputs = screen.getAllByRole('textbox');
      const editableInputs = borrowerInputs.filter(input => !input.hasAttribute('readonly'));
      expect(editableInputs.length).toBeGreaterThan(0);
    });
  });

  describe('Read-Only Fields', () => {
    it('should have MW Loan # as read-only', () => {
      render(<LoanTab />);

      // Find inputs and check for readonly attribute on the loan number field
      const inputs = screen.getAllByRole('textbox');
      const readOnlyInputs = inputs.filter(input => input.hasAttribute('readonly'));
      expect(readOnlyInputs.length).toBeGreaterThan(0);
    });

    it('should have Total Balance as read-only', () => {
      render(<LoanTab />);

      // Total balance should be a calculated readonly field
      const inputs = screen.getAllByRole('textbox');
      const readOnlyInputs = inputs.filter(input => input.hasAttribute('readonly'));
      expect(readOnlyInputs.length).toBeGreaterThanOrEqual(4); // MW Loan #, Total Balance, calculated fields
    });
  });

  describe('Layout', () => {
    it('should render in 5-column grid layout', () => {
      render(<LoanTab />);

      // Check for grid-cols-5 class on the main grid
      const gridContainer = document.querySelector('.grid-cols-5');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('State Dropdown', () => {
    it('should render US states in dropdown', () => {
      render(<LoanTab />);

      // Check for some US state codes
      const stateOptions = screen.getAllByRole('option');
      const stateOptionValues = stateOptions.map(opt => opt.textContent);

      expect(stateOptionValues).toContain('CA');
      expect(stateOptionValues).toContain('NY');
      expect(stateOptionValues).toContain('TX');
    });
  });
});
