/**
 * OverviewTab Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
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

  describe('Rendering', () => {
    it('should render all three sections', () => {
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

      // Should render with empty defaults
      expect(screen.getByPlaceholderText('Enter relationship overview details...')).toHaveValue('');
    });
  });
});
