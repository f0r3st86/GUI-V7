/**
 * CollateralTab Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { CollateralTab } from './CollateralTab';

describe('CollateralTab', () => {
  describe('Rendering', () => {
    it('should render Collateral Items header', () => {
      render(<CollateralTab />);

      expect(screen.getByText('Collateral Items')).toBeInTheDocument();
    });

    it('should render Add New button', () => {
      render(<CollateralTab />);

      expect(screen.getByText('+ Add New')).toBeInTheDocument();
    });

    it('should show loan number in subtitle', () => {
      render(<CollateralTab />);

      // Should show "Loan: #" pattern
      expect(screen.getByText(/Loan: #/)).toBeInTheDocument();
    });
  });

  describe('Collateral Table', () => {
    it('should render table headers', () => {
      render(<CollateralTab />);

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getAllByText('Address').length).toBeGreaterThan(0);
      expect(screen.getByText('City, State')).toBeInTheDocument();
      // Our Value appears multiple times
      expect(screen.getAllByText('Our Value').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Appraised').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('Property Information Section', () => {
    it('should render Property Information header', () => {
      render(<CollateralTab />);

      expect(screen.getByText('Property Information')).toBeInTheDocument();
    });

    it('should render property fields', () => {
      render(<CollateralTab />);

      expect(screen.getByText('Description:')).toBeInTheDocument();
      expect(screen.getByText('County:')).toBeInTheDocument();
      expect(screen.getByText('Parcel ID:')).toBeInTheDocument();
    });

    it('should render property detail fields', () => {
      render(<CollateralTab />);

      expect(screen.getByText('SqFt:')).toBeInTheDocument();
      expect(screen.getByText('Acres:')).toBeInTheDocument();
      expect(screen.getByText('Year Built:')).toBeInTheDocument();
      expect(screen.getByText('Units:')).toBeInTheDocument();
    });
  });

  describe('Values Section', () => {
    it('should render Values header', () => {
      render(<CollateralTab />);

      expect(screen.getByText('Values')).toBeInTheDocument();
    });

    it('should render value type headers', () => {
      render(<CollateralTab />);

      expect(screen.getByText('List Price')).toBeInTheDocument();
      expect(screen.getByText('BPO')).toBeInTheDocument();
    });

    it('should render calculated $/SF fields', () => {
      render(<CollateralTab />);

      const sfLabels = screen.getAllByText('$/SF:');
      expect(sfLabels.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Related Loans Section', () => {
    it('should render Related Loans header', () => {
      render(<CollateralTab />);

      expect(screen.getByText('Related Loans')).toBeInTheDocument();
    });

    it('should show instruction text', () => {
      render(<CollateralTab />);

      expect(screen.getByText('Select which loans this collateral secures:')).toBeInTheDocument();
    });

    it('should show Securing Loans count', () => {
      render(<CollateralTab />);

      expect(screen.getByText('Securing Loans:')).toBeInTheDocument();
    });

    it('should show Total Secured amount', () => {
      render(<CollateralTab />);

      expect(screen.getByText('Total Secured:')).toBeInTheDocument();
    });
  });

  describe('SQL Connection Info', () => {
    it('should render SQL Connection Points', () => {
      render(<CollateralTab />);

      expect(screen.getByText('SQL Connection Points:')).toBeInTheDocument();
    });
  });

  describe('State Dropdown', () => {
    it('should render US states in dropdown', () => {
      render(<CollateralTab />);

      const options = screen.getAllByRole('option');
      const stateOptions = options.map(opt => opt.textContent);

      expect(stateOptions).toContain('CA');
      expect(stateOptions).toContain('NY');
      expect(stateOptions).toContain('TX');
    });
  });

  describe('Calculated Fields', () => {
    it('should have read-only calculated fields', () => {
      render(<CollateralTab />);

      const readOnlyInputs = document.querySelectorAll('.cursor-not-allowed');
      expect(readOnlyInputs.length).toBeGreaterThan(0);
    });
  });
});
