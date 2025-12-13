/**
 * ProjectionsTab Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { ProjectionsTab } from './ProjectionsTab';

describe('ProjectionsTab', () => {
  describe('Loan Header Info', () => {
    it('should display loan number', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Loan #:')).toBeInTheDocument();
    });

    it('should display UPB', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('UPB:')).toBeInTheDocument();
    });

    it('should display Contractual Rate', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Contractual Rate:')).toBeInTheDocument();
    });

    it('should display Contractual Pmt', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Contractual Pmt:')).toBeInTheDocument();
    });
  });

  describe('Projection Settings Section', () => {
    it('should render Projection Settings header', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Projection Settings')).toBeInTheDocument();
    });

    it('should render Payment Method section', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Payment Method')).toBeInTheDocument();
    });

    it('should render Rate Method section', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Rate Method')).toBeInTheDocument();
    });

    it('should render Payment Type dropdown', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Payment Type:')).toBeInTheDocument();
    });

    it('should render Rate Type dropdown', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Rate Type:')).toBeInTheDocument();
    });
  });

  describe('Payment Method Options', () => {
    it('should have payment method options', () => {
      render(<ProjectionsTab />);

      // Contractual appears multiple times (payment and rate), so use getAllByText
      expect(screen.getAllByText('Contractual').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Interest Payment')).toBeInTheDocument();
      expect(screen.getByText('Term Pmt')).toBeInTheDocument();
    });
  });

  describe('Expense Assumptions Section', () => {
    it('should render Expense Assumptions header', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Expense Assumptions')).toBeInTheDocument();
    });

    it('should render Initial Legal field', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Initial Legal ($):')).toBeInTheDocument();
    });

    it('should render Start Month field', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Start Month:')).toBeInTheDocument();
    });

    it('should render Holding Costs field', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Holding Costs ($/mo):')).toBeInTheDocument();
    });

    it('should render Through Month field', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Through Month:')).toBeInTheDocument();
    });
  });

  describe('Exit Scenario Settings', () => {
    it('should render Exit Scenario Settings header', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Exit Scenario Settings')).toBeInTheDocument();
    });

    it('should render Cash Flow Start Month field', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Cash Flow Start Month:')).toBeInTheDocument();
    });

    it('should render Exit Month field', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Exit Month:')).toBeInTheDocument();
    });

    it('should render Exit Method header', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Exit Method')).toBeInTheDocument();
    });

    it('should render Exit Type dropdown', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Exit Type:')).toBeInTheDocument();
    });
  });

  describe('Exit Method Options', () => {
    it('should have exit method options', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Pay in Full')).toBeInTheDocument();
      expect(screen.getByText('DPO')).toBeInTheDocument();
      expect(screen.getByText('Value Cap')).toBeInTheDocument();
      expect(screen.getByText('YTM Sell Solve')).toBeInTheDocument();
      expect(screen.getByText('Liquidation')).toBeInTheDocument();
    });
  });

  describe('Exit Value Summary', () => {
    it('should render Exit Value label', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Exit Value')).toBeInTheDocument();
    });

    it('should render Add Back Recovery label', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Add Back Recovery')).toBeInTheDocument();
    });

    it('should render Total Exit Proceeds label', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Total Exit Proceeds')).toBeInTheDocument();
    });
  });

  describe('Projection Tables', () => {
    it('should render Projected Income header', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Projected Income')).toBeInTheDocument();
    });

    it('should render Net Cash Flow header', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
    });

    it('should render short month headers', () => {
      render(<ProjectionsTab />);

      // Check for short month names in projection tables
      expect(screen.getAllByText('Jan').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Feb').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Dec').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Calculated Values Display', () => {
    it('should show calculated payment', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Calculated:')).toBeInTheDocument();
    });

    it('should show effective rate', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Effective Rate:')).toBeInTheDocument();
    });

    it('should show exit value label', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText('Exit Value:')).toBeInTheDocument();
    });
  });

  describe('Cash Flow Duration', () => {
    it('should display months of cash flow', () => {
      render(<ProjectionsTab />);

      expect(screen.getByText(/months of cash flow/)).toBeInTheDocument();
    });
  });
});
