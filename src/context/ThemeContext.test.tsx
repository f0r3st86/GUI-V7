/**
 * ThemeContext Integration Tests
 * Tests for dark/light theme state management
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme, getStatusColor } from './ThemeContext';

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ThemeContext', () => {
  describe('useTheme hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });

    it('should provide theme state when used within provider', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBeDefined();
      expect(result.current.styles).toBeDefined();
      expect(typeof result.current.toggleTheme).toBe('function');
      expect(typeof result.current.setTheme).toBe('function');
    });
  });

  describe('Theme State', () => {
    it('should default to dark theme', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('dark');
    });

    it('should toggle theme from dark to light', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
    });

    it('should toggle theme from light back to dark', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Toggle to light
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.theme).toBe('light');

      // Toggle back to dark
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.theme).toBe('dark');
    });

    it('should allow setting theme directly', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
    });
  });

  describe('Theme Styles', () => {
    it('should provide dark theme styles by default', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Check dark theme specific styles
      expect(result.current.styles.mainBg).toBe('bg-black');
      expect(result.current.styles.headerBg).toBe('bg-zinc-900');
      expect(result.current.styles.textPrimary).toBe('text-white');
    });

    it('should provide light theme styles when toggled', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.toggleTheme();
      });

      // Check light theme specific styles
      expect(result.current.styles.mainBg).toBe('bg-gray-50');
      expect(result.current.styles.headerBg).toBe('bg-white');
      expect(result.current.styles.textPrimary).toBe('text-gray-900');
    });

    it('should update styles when theme changes', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      const darkStyles = { ...result.current.styles };

      act(() => {
        result.current.toggleTheme();
      });

      const lightStyles = result.current.styles;

      // Styles should be different
      expect(lightStyles.mainBg).not.toBe(darkStyles.mainBg);
      expect(lightStyles.textPrimary).not.toBe(darkStyles.textPrimary);
    });

    it('should provide all required style properties', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      const requiredStyles = [
        'mainBg', 'headerBg', 'sectionBg', 'cardBg', 'inputBg', 'readOnlyBg',
        'borderColor', 'inputBorder', 'focusBorder',
        'textPrimary', 'textSecondary', 'textMuted', 'textGreen', 'textYellow',
        'hoverBg', 'hoverText', 'buttonHover',
        'selectedBg', 'selectedHoverBg', 'activeBg', 'activeTabBg', 'inactiveTabBg',
        'alertBg', 'alertBorder', 'alertText',
        'tableHeaderBg', 'menuBg'
      ];

      requiredStyles.forEach(style => {
        expect(result.current.styles[style as keyof typeof result.current.styles]).toBeDefined();
      });
    });
  });

  describe('Style Values', () => {
    it('should have Tailwind classes for dark theme backgrounds', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.styles.cardBg).toContain('bg-zinc');
      expect(result.current.styles.inputBg).toContain('bg-zinc');
    });

    it('should have Tailwind classes for light theme backgrounds', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.styles.cardBg).toContain('bg-gray');
      expect(result.current.styles.inputBg).toContain('bg-white');
    });

    it('should have proper border classes', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.styles.borderColor).toContain('border-');
      expect(result.current.styles.inputBorder).toContain('border-');
      expect(result.current.styles.focusBorder).toContain('focus:border-');
    });

    it('should have proper text classes', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.styles.textPrimary).toContain('text-');
      expect(result.current.styles.textSecondary).toContain('text-');
      expect(result.current.styles.textMuted).toContain('text-');
      expect(result.current.styles.textGreen).toContain('text-green');
      expect(result.current.styles.textYellow).toContain('text-yellow');
    });

    it('should have proper hover classes', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.styles.hoverBg).toContain('hover:');
      expect(result.current.styles.hoverText).toContain('hover:');
      expect(result.current.styles.buttonHover).toContain('hover:');
    });
  });
});

describe('getStatusColor', () => {
  describe('Dark theme status colors', () => {
    it('should return green for PA (Performing Asset)', () => {
      expect(getStatusColor('PA', 'dark')).toBe('text-green-400');
    });

    it('should return green for FA (Fully Performing)', () => {
      expect(getStatusColor('FA', 'dark')).toBe('text-green-400');
    });

    it('should return yellow for FC (Foreclosure)', () => {
      expect(getStatusColor('FC', 'dark')).toBe('text-yellow-400');
    });

    it('should return orange for JG (Judgment)', () => {
      expect(getStatusColor('JG', 'dark')).toBe('text-orange-400');
    });

    it('should return red for LT (Litigation)', () => {
      expect(getStatusColor('LT', 'dark')).toBe('text-red-400');
    });

    it('should return gray for unknown status', () => {
      expect(getStatusColor('UNKNOWN', 'dark')).toBe('text-gray-400');
    });
  });

  describe('Light theme status colors', () => {
    it('should return green-600 for PA (Performing Asset)', () => {
      expect(getStatusColor('PA', 'light')).toBe('text-green-600');
    });

    it('should return green-600 for FA (Fully Performing)', () => {
      expect(getStatusColor('FA', 'light')).toBe('text-green-600');
    });

    it('should return yellow-600 for FC (Foreclosure)', () => {
      expect(getStatusColor('FC', 'light')).toBe('text-yellow-600');
    });

    it('should return orange-600 for JG (Judgment)', () => {
      expect(getStatusColor('JG', 'light')).toBe('text-orange-600');
    });

    it('should return red-600 for LT (Litigation)', () => {
      expect(getStatusColor('LT', 'light')).toBe('text-red-600');
    });

    it('should return gray-600 for unknown status', () => {
      expect(getStatusColor('UNKNOWN', 'light')).toBe('text-gray-600');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string status', () => {
      expect(getStatusColor('', 'dark')).toBe('text-gray-400');
      expect(getStatusColor('', 'light')).toBe('text-gray-600');
    });
  });
});
