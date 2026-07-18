/**
 * RelationshipBrowser Tests
 *
 * Portfolio-level view: groups loans by relationship with aggregates,
 * search, sorting, and click-to-select.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { RelationshipBrowser } from './RelationshipBrowser';

describe('RelationshipBrowser', () => {
  describe('Rendering', () => {
    it('should render the browser heading with portfolio totals', () => {
      render(<RelationshipBrowser />);

      expect(screen.getByText('Relationships')).toBeInTheDocument();
      expect(screen.getByText(/2 relationships/)).toBeInTheDocument();
      expect(screen.getByText(/Portfolio UPB/)).toBeInTheDocument();
    });

    it('should list every relationship from the loan data', () => {
      render(<RelationshipBrowser />);
      const table = screen.getByRole('table', { name: /relationships/i });

      expect(within(table).getByText('Haskell')).toBeInTheDocument();
      expect(within(table).getByText('Coastal')).toBeInTheDocument();
    });

    it('should show loan counts per relationship', () => {
      render(<RelationshipBrowser />);
      const table = screen.getByRole('table', { name: /relationships/i });

      // Haskell has 7 loans, Coastal has 2
      const haskellRow = within(table).getByText('Haskell').closest('tr')!;
      expect(within(haskellRow as HTMLElement).getByText('7')).toBeInTheDocument();

      const coastalRow = within(table).getByText('Coastal').closest('tr')!;
      expect(within(coastalRow as HTMLElement).getAllByText('2').length).toBeGreaterThanOrEqual(1);
    });

    it('should mark the current relationship', () => {
      render(<RelationshipBrowser />);

      // Default selected loan 7758 belongs to Haskell
      expect(screen.getByText('(current)')).toBeInTheDocument();
      const currentRow = screen.getByText('(current)').closest('tr')!;
      expect(within(currentRow as HTMLElement).getByText('Haskell')).toBeInTheDocument();
    });

    it('should show distress flags derived from loan statuses', () => {
      render(<RelationshipBrowser />);
      const table = screen.getByRole('table', { name: /relationships/i });

      // Haskell has FC/LT/FA/JG loans; Coastal has one FC loan
      const flags = within(table).getAllByText('Foreclosure');
      expect(flags.length).toBe(2);
      expect(within(table).getByText('Litigation')).toBeInTheDocument();
      expect(within(table).getByText('Judgment')).toBeInTheDocument();
      expect(within(table).getByText('Forbearance')).toBeInTheDocument();
    });

    it('should render a back button naming the current relationship', () => {
      render(<RelationshipBrowser />);
      expect(screen.getByText(/Back to Haskell/)).toBeInTheDocument();
    });
  });

  describe('Search', () => {
    it('should filter relationships by name', async () => {
      const user = userEvent.setup();
      render(<RelationshipBrowser />);

      // 'Coastal' matches only the Coastal relationship name
      // (note: bare 'Coast' would also match Haskell via its
      // 'Rocky Coast Real Estate' borrower — that's by design)
      await user.type(screen.getByLabelText('Search relationships'), 'Coastal');

      const table = screen.getByRole('table', { name: /relationships/i });
      expect(within(table).getByText('Coastal')).toBeInTheDocument();
      expect(within(table).queryByText('Haskell')).not.toBeInTheDocument();
    });

    it('should find relationships by borrower name', async () => {
      const user = userEvent.setup();
      render(<RelationshipBrowser />);

      await user.type(screen.getByLabelText('Search relationships'), 'Harbor View');

      const table = screen.getByRole('table', { name: /relationships/i });
      expect(within(table).getByText('Coastal')).toBeInTheDocument();
      expect(within(table).queryByText('Haskell')).not.toBeInTheDocument();
    });

    it('should find relationships by loan number', async () => {
      const user = userEvent.setup();
      render(<RelationshipBrowser />);

      await user.type(screen.getByLabelText('Search relationships'), '3685');

      const table = screen.getByRole('table', { name: /relationships/i });
      expect(within(table).getByText('Haskell')).toBeInTheDocument();
      expect(within(table).queryByText('Coastal')).not.toBeInTheDocument();
    });

    it('should show empty state when nothing matches', async () => {
      const user = userEvent.setup();
      render(<RelationshipBrowser />);

      await user.type(screen.getByLabelText('Search relationships'), 'zzz-no-match');

      expect(screen.getByText(/No relationships match/)).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by UPB descending by default (Haskell first)', () => {
      render(<RelationshipBrowser />);
      const table = screen.getByRole('table', { name: /relationships/i });
      const rows = within(table).getAllByRole('row').slice(1); // skip header

      expect(within(rows[0]).getByText('Haskell')).toBeInTheDocument();
      expect(within(rows[1]).getByText('Coastal')).toBeInTheDocument();
    });

    it('should re-sort when clicking a column header', async () => {
      const user = userEvent.setup();
      render(<RelationshipBrowser />);

      await user.click(screen.getByRole('columnheader', { name: /^Relationship$/ }));

      const table = screen.getByRole('table', { name: /relationships/i });
      const rows = within(table).getAllByRole('row').slice(1);
      // Name ascending: Coastal before Haskell
      expect(within(rows[0]).getByText('Coastal')).toBeInTheDocument();
      expect(within(rows[1]).getByText('Haskell')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should have clickable relationship rows', async () => {
      render(<RelationshipBrowser />);
      const table = screen.getByRole('table', { name: /relationships/i });

      const coastalRow = within(table).getByText('Coastal').closest('tr')!;
      expect(coastalRow).toHaveClass('cursor-pointer');
    });
  });
});
