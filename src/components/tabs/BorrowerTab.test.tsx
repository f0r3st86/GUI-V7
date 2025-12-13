/**
 * BorrowerTab Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { BorrowerTab } from './BorrowerTab';

describe('BorrowerTab', () => {
  describe('Rendering', () => {
    it('should render Borrowers & Guarantors header', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Borrowers & Guarantors')).toBeInTheDocument();
    });

    it('should render Add New button', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('+ Add New')).toBeInTheDocument();
    });

    it('should render borrower table headers', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('City, State')).toBeInTheDocument();
      expect(screen.getByText('SSN/EIN')).toBeInTheDocument();
      expect(screen.getByText('Credit Score')).toBeInTheDocument();
      expect(screen.getByText('BK Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should show relationship info', () => {
      render(<BorrowerTab />);

      // Should show "Relationship:" label
      expect(screen.getByText(/Relationship:/)).toBeInTheDocument();
    });
  });

  describe('Borrower Details Section', () => {
    it('should render Borrower/Guarantor Details header', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Borrower/Guarantor Details')).toBeInTheDocument();
    });

    it('should render Contact Information section', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Contact Information')).toBeInTheDocument();
    });

    it('should render Identity Verification section', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Identity Verification')).toBeInTheDocument();
    });

    it('should render Credit Information section', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Credit Information')).toBeInTheDocument();
    });

    it('should render Bankruptcy Information section', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Bankruptcy Information')).toBeInTheDocument();
    });
  });

  describe('Bankruptcy Status Options', () => {
    it('should have bankruptcy status options', () => {
      render(<BorrowerTab />);

      // None appears multiple times, use getAllByText
      expect(screen.getAllByText('None').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Dismissed')).toBeInTheDocument();
      expect(screen.getByText('Discharged')).toBeInTheDocument();
    });
  });

  describe('Bankruptcy Chapter Options', () => {
    it('should have bankruptcy chapter options', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Chapter 7')).toBeInTheDocument();
      expect(screen.getByText('Chapter 11')).toBeInTheDocument();
      expect(screen.getByText('Chapter 12')).toBeInTheDocument();
      expect(screen.getByText('Chapter 13')).toBeInTheDocument();
      expect(screen.getByText('Chapter 15')).toBeInTheDocument();
    });
  });

  describe('Related Loans Section', () => {
    it('should render Related Loans header', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Related Loans')).toBeInTheDocument();
    });

    it('should show instruction text', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Select loans and specify role for this borrower:')).toBeInTheDocument();
    });

    it('should show Selected Loans count', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Selected Loans:')).toBeInTheDocument();
    });

    it('should show Total Exposure', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Total Exposure:')).toBeInTheDocument();
    });
  });

  describe('Loan Role Options', () => {
    it('should have borrower and guarantor role options', () => {
      render(<BorrowerTab />);

      const options = screen.getAllByRole('option');
      const roleOptions = options.filter(opt =>
        ['Borrower', 'Guarantor'].includes(opt.textContent || '')
      );
      expect(roleOptions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('SQL Connection Info', () => {
    it('should render SQL Connection Points', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('SQL Connection Points:')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should have name input field', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Name:')).toBeInTheDocument();
    });

    it('should have phone input field', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Phone:')).toBeInTheDocument();
    });

    it('should have SSN/EIN input field', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('SSN/EIN:')).toBeInTheDocument();
    });

    it('should have date of birth input field', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Date of Birth:')).toBeInTheDocument();
    });

    it('should have credit score input field', () => {
      render(<BorrowerTab />);

      expect(screen.getByText('Credit Score:')).toBeInTheDocument();
    });
  });
});
