/**
 * OverviewTab Component Tests
 *
 * Tests the relationship-level dashboard including:
 * - Relationship header with status flags
 * - Loan summary table with aggregates
 * - Collateral summary table
 * - Borrower summary table
 * - Narrative text areas with localStorage persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { OverviewTab } from './OverviewTab';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('OverviewTab', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Relationship Header', () => {
    it('should render the relationship name', () => {
      render(<OverviewTab />);
      expect(screen.getByText(/Relationship: Haskell/)).toBeInTheDocument();
    });

    it('should display entity counts', () => {
      render(<OverviewTab />);
      // Initial data: 7 Haskell loans, 3 borrowers, 2 collateral items
      // The counts appear in a single span in the header
      expect(screen.getByText(/7 loans.*3 borrowers.*2 collateral/)).toBeInTheDocument();
    });

    it('should render all five status flags', () => {
      render(<OverviewTab />);
      const flagGroup = screen.getByRole('group', { name: /status flags/i });
      expect(within(flagGroup).getByText('Bankruptcy')).toBeInTheDocument();
      expect(within(flagGroup).getByText('Foreclosure')).toBeInTheDocument();
      expect(within(flagGroup).getByText('Litigation')).toBeInTheDocument();
      expect(within(flagGroup).getByText('Forbearance')).toBeInTheDocument();
      expect(within(flagGroup).getByText('Judgment')).toBeInTheDocument();
    });

    it('should show active flags based on loan statuses', () => {
      render(<OverviewTab />);
      // Loan 7855=FC, 3205=LT, 5091=FA, 3685=JG -> these flags should be active (red)
      expect(screen.getByTestId('flag-foreclosure')).toHaveClass('bg-red-600');
      expect(screen.getByTestId('flag-litigation')).toHaveClass('bg-red-600');
      expect(screen.getByTestId('flag-forbearance')).toHaveClass('bg-red-600');
      expect(screen.getByTestId('flag-judgment')).toHaveClass('bg-red-600');
    });

    it('should show bankruptcy flag as inactive when no borrowers are in BK', () => {
      render(<OverviewTab />);
      // All borrowers have bkStatus 'none'
      const bkFlag = screen.getByTestId('flag-bankruptcy');
      expect(bkFlag).not.toHaveClass('bg-red-600');
    });

    it('should have accessible labels on flag elements', () => {
      render(<OverviewTab />);
      expect(screen.getByRole('status', { name: /Bankruptcy: No/ })).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /Foreclosure: Yes/ })).toBeInTheDocument();
    });
  });

  describe('Loan Summary Table', () => {
    it('should render the loan summary table', () => {
      render(<OverviewTab />);
      expect(screen.getByText('Loan Summary')).toBeInTheDocument();
      expect(screen.getByRole('table', { name: /loan summary/i })).toBeInTheDocument();
    });

    it('should show all loans in the relationship', () => {
      render(<OverviewTab />);
      const table = screen.getByRole('table', { name: /loan summary/i });
      expect(within(table).getByText('2461')).toBeInTheDocument();
      expect(within(table).getByText('5091')).toBeInTheDocument();
      expect(within(table).getByText('7855')).toBeInTheDocument();
      expect(within(table).getByText('3685')).toBeInTheDocument();
      expect(within(table).getByText('3205')).toBeInTheDocument();
      expect(within(table).getByText('6826')).toBeInTheDocument();
      expect(within(table).getByText('7758')).toBeInTheDocument();
    });

    it('should display borrower names', () => {
      render(<OverviewTab />);
      const table = screen.getByRole('table', { name: /loan summary/i });
      // Borrower names appear on multiple loan rows
      expect(within(table).getAllByText('Blaze Restaurant Group LLC').length).toBeGreaterThanOrEqual(1);
      expect(within(table).getAllByText('Rocky Coast Real Estate Group LLC').length).toBeGreaterThanOrEqual(1);
    });

    it('should show column headers', () => {
      render(<OverviewTab />);
      const table = screen.getByRole('table', { name: /loan summary/i });
      expect(within(table).getByText('Loan #')).toBeInTheDocument();
      expect(within(table).getByText('Borrower')).toBeInTheDocument();
      expect(within(table).getByText('Orig Bal')).toBeInTheDocument();
      expect(within(table).getByText('Principal')).toBeInTheDocument();
      expect(within(table).getByText('Interest')).toBeInTheDocument();
      expect(within(table).getByText('Total UPB')).toBeInTheDocument();
      expect(within(table).getByText('Rate')).toBeInTheDocument();
      expect(within(table).getByText('Payment')).toBeInTheDocument();
      expect(within(table).getByText('Status')).toBeInTheDocument();
    });

    it('should display status badges', () => {
      render(<OverviewTab />);
      const table = screen.getByRole('table', { name: /loan summary/i });
      expect(within(table).getByText('Performing')).toBeInTheDocument();
      expect(within(table).getByText('Foreclosure')).toBeInTheDocument();
      expect(within(table).getByText('Judgment')).toBeInTheDocument();
      expect(within(table).getByText('Litigation')).toBeInTheDocument();
      expect(within(table).getByText('Forbearance')).toBeInTheDocument();
    });

    it('should show totals row', () => {
      render(<OverviewTab />);
      expect(screen.getByText(/Totals \(7 loans\)/)).toBeInTheDocument();
    });
  });

  describe('Collateral Summary Table', () => {
    it('should render the collateral summary table', () => {
      render(<OverviewTab />);
      expect(screen.getByRole('table', { name: /collateral summary/i })).toBeInTheDocument();
    });

    it('should show collateral types', () => {
      render(<OverviewTab />);
      const table = screen.getByRole('table', { name: /collateral summary/i });
      expect(within(table).getByText('Commercial Property')).toBeInTheDocument();
      expect(within(table).getByText('Multi-Family')).toBeInTheDocument();
    });

    it('should show collateral descriptions', () => {
      render(<OverviewTab />);
      const table = screen.getByRole('table', { name: /collateral summary/i });
      expect(within(table).getByText('Commercial Building - Restaurant')).toBeInTheDocument();
      expect(within(table).getByText('12-Unit Apartment Building')).toBeInTheDocument();
    });

    it('should show collateral values', () => {
      render(<OverviewTab />);
      const table = screen.getByRole('table', { name: /collateral summary/i });
      expect(within(table).getByText('$525,000')).toBeInTheDocument();
      expect(within(table).getByText('$950,000')).toBeInTheDocument();
    });

    it('should show totals when multiple items exist', () => {
      render(<OverviewTab />);
      const table = screen.getByRole('table', { name: /collateral summary/i });
      expect(within(table).getByText(/Totals \(2 items\)/)).toBeInTheDocument();
    });

    it('should highlight delinquent taxes', () => {
      render(<OverviewTab />);
      const table = screen.getByRole('table', { name: /collateral summary/i });
      // Collateral 2 has delinquentTaxes '4,500' - appears in row and totals
      const dlqCells = within(table).getAllByText('$4,500');
      // At least one should have red highlight (the data row)
      const hasRed = dlqCells.some(el => el.classList.contains('text-red-500'));
      expect(hasRed).toBe(true);
    });
  });

  describe('Borrower Summary Table', () => {
    it('should render the borrower summary table', () => {
      render(<OverviewTab />);
      expect(screen.getByRole('table', { name: /borrower summary/i })).toBeInTheDocument();
    });

    it('should show borrower names', () => {
      render(<OverviewTab />);
      const table = screen.getByRole('table', { name: /borrower summary/i });
      expect(within(table).getByText('Blaze Restaurant Group LLC')).toBeInTheDocument();
      expect(within(table).getByText('Matthew Haskell')).toBeInTheDocument();
      expect(within(table).getByText('Rocky Coast Real Estate Group LLC')).toBeInTheDocument();
    });

    it('should show type badges', () => {
      render(<OverviewTab />);
      const table = screen.getByRole('table', { name: /borrower summary/i });
      const borrowerBadges = within(table).getAllByText('Borrower');
      const guarantorBadges = within(table).getAllByText('Guarantor');
      expect(borrowerBadges.length).toBe(2);
      expect(guarantorBadges.length).toBe(1);
    });

    it('should show color-coded credit scores', () => {
      render(<OverviewTab />);
      const table = screen.getByRole('table', { name: /borrower summary/i });
      expect(within(table).getByText('750')).toHaveClass('text-green-500');
      expect(within(table).getByText('720')).toHaveClass('text-green-500');
      expect(within(table).getByText('680')).toHaveClass('text-yellow-500');
    });

    it('should mask SSN/EIN values', () => {
      render(<OverviewTab />);
      const table = screen.getByRole('table', { name: /borrower summary/i });
      // EIN: 45-1234567 -> **-***4567
      expect(within(table).getByText('**-***4567')).toBeInTheDocument();
      // SSN: 123-45-6789 -> ***-**-6789
      expect(within(table).getByText('***-**-6789')).toBeInTheDocument();
    });

    it('should show BK status badges', () => {
      render(<OverviewTab />);
      const table = screen.getByRole('table', { name: /borrower summary/i });
      const noneStatuses = within(table).getAllByText('none');
      expect(noneStatuses.length).toBe(3);
    });

    it('should show column headers', () => {
      render(<OverviewTab />);
      const table = screen.getByRole('table', { name: /borrower summary/i });
      expect(within(table).getByText('Name')).toBeInTheDocument();
      expect(within(table).getByText('Type')).toBeInTheDocument();
      expect(within(table).getByText('Credit Score')).toBeInTheDocument();
      expect(within(table).getByText('BK Status')).toBeInTheDocument();
      expect(within(table).getByText('SSN/EIN')).toBeInTheDocument();
    });
  });

  describe('Narrative Sections', () => {
    it('should render all three narrative sections', () => {
      render(<OverviewTab />);
      expect(screen.getByText('Relationship Overview')).toBeInTheDocument();
      expect(screen.getByText('Collateral Overview')).toBeInTheDocument();
      expect(screen.getByText('Bid Conditions')).toBeInTheDocument();
    });

    it('should render textareas with placeholders', () => {
      render(<OverviewTab />);
      expect(screen.getByPlaceholderText('Enter relationship overview details...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter collateral overview details...')).toBeInTheDocument();
    });

    it('should render bid conditions input', () => {
      render(<OverviewTab />);
      expect(screen.getByPlaceholderText('Enter bid conditions...')).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('should update relationship overview on typing', async () => {
      const user = userEvent.setup();
      render(<OverviewTab />);

      const textarea = screen.getByPlaceholderText('Enter relationship overview details...');
      await user.type(textarea, 'Test overview');
      expect(textarea).toHaveValue('Test overview');
    });

    it('should update collateral overview on typing', async () => {
      const user = userEvent.setup();
      render(<OverviewTab />);

      const textarea = screen.getByPlaceholderText('Enter collateral overview details...');
      await user.type(textarea, 'Test collateral');
      expect(textarea).toHaveValue('Test collateral');
    });

    it('should update bid conditions on typing', async () => {
      const user = userEvent.setup();
      render(<OverviewTab />);

      const input = screen.getByPlaceholderText('Enter bid conditions...');
      await user.type(input, 'As-is');
      expect(input).toHaveValue('As-is');
    });
  });

  describe('localStorage Persistence', () => {
    it('should save to localStorage on change', async () => {
      const user = userEvent.setup();
      render(<OverviewTab />);

      const textarea = screen.getByPlaceholderText('Enter relationship overview details...');
      await user.type(textarea, 'X');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'gui-v7-overview',
        expect.stringContaining('X')
      );
    });

    it('should load saved data from localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce(
        JSON.stringify({
          relationshipOverview: 'Saved overview',
          collateralOverview: 'Saved collateral',
          bidConditions: 'Saved conditions'
        })
      );
      render(<OverviewTab />);

      expect(screen.getByDisplayValue('Saved overview')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Saved collateral')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Saved conditions')).toBeInTheDocument();
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('not valid json');
      render(<OverviewTab />);

      expect(screen.getByPlaceholderText('Enter relationship overview details...')).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels on all tables', () => {
      render(<OverviewTab />);
      expect(screen.getByRole('table', { name: /loan summary/i })).toBeInTheDocument();
      expect(screen.getByRole('table', { name: /collateral summary/i })).toBeInTheDocument();
      expect(screen.getByRole('table', { name: /borrower summary/i })).toBeInTheDocument();
    });

    it('should have aria labels on text inputs', () => {
      render(<OverviewTab />);
      expect(screen.getByLabelText('Relationship Overview')).toBeInTheDocument();
      expect(screen.getByLabelText('Collateral Overview')).toBeInTheDocument();
      expect(screen.getByLabelText('Bid Conditions')).toBeInTheDocument();
    });

    it('should have a labeled flag group', () => {
      render(<OverviewTab />);
      expect(screen.getByRole('group', { name: /status flags/i })).toBeInTheDocument();
    });
  });
});
