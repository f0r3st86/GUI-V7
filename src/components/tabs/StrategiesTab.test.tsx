/**
 * StrategiesTab Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { StrategiesTab } from './StrategiesTab';

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

describe('StrategiesTab', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the Strategies header', () => {
      render(<StrategiesTab />);

      expect(screen.getByText('Strategies')).toBeInTheDocument();
    });

    it('should render textarea with placeholder', () => {
      render(<StrategiesTab />);

      expect(screen.getByPlaceholderText('Enter strategy notes...')).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('should update strategies on typing', async () => {
      const user = userEvent.setup();
      render(<StrategiesTab />);

      const textarea = screen.getByPlaceholderText('Enter strategy notes...');
      await user.type(textarea, 'Buy low sell high');
      expect(textarea).toHaveValue('Buy low sell high');
    });
  });

  describe('localStorage Persistence', () => {
    it('should save to localStorage on change', async () => {
      const user = userEvent.setup();
      render(<StrategiesTab />);

      const textarea = screen.getByPlaceholderText('Enter strategy notes...');
      await user.type(textarea, 'X');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'gui-v7-strategies',
        expect.stringContaining('X')
      );
    });

    it('should load saved data from localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce('Saved strategy notes');
      render(<StrategiesTab />);

      expect(screen.getByDisplayValue('Saved strategy notes')).toBeInTheDocument();
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementationOnce(() => { throw new Error('quota exceeded'); });
      render(<StrategiesTab />);

      // Should render with empty default
      expect(screen.getByPlaceholderText('Enter strategy notes...')).toHaveValue('');
    });
  });
});
