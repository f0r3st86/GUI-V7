/**
 * ProjectionContext and ExitContext Tests
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { ProjectionProvider, useProjection } from '../ProjectionContext';
import { ExitProvider, useExit } from '../ExitContext';

describe('ProjectionContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ProjectionProvider>{children}</ProjectionProvider>
  );

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useProjection());
    }).toThrow('useProjection must be used within a ProjectionProvider');
  });

  it('should provide default projection settings', () => {
    const { result } = renderHook(() => useProjection(), { wrapper });

    expect(result.current.settings.paymentMethod).toBe('Contractual');
    expect(result.current.settings.rateMethod).toBe('Contractual');
    expect(result.current.settings.amortMonths).toBe('360');
    expect(result.current.settings.trailPeriod).toBe('12');
    expect(result.current.settings.trailPercentage).toBe('100');
    expect(result.current.settings.addBackPercentage).toBe('0');
    expect(result.current.settings.addBackBasis).toBe('Initial Only');
  });

  it('should update individual settings', () => {
    const { result } = renderHook(() => useProjection(), { wrapper });

    act(() => {
      result.current.updateSetting('paymentMethod', 'User Enter');
    });

    expect(result.current.settings.paymentMethod).toBe('User Enter');
    // Other settings unchanged
    expect(result.current.settings.rateMethod).toBe('Contractual');
  });

  it('should update multiple settings independently', () => {
    const { result } = renderHook(() => useProjection(), { wrapper });

    act(() => {
      result.current.updateSetting('userPayment', '500');
    });
    act(() => {
      result.current.updateSetting('userRate', '8.5');
    });

    expect(result.current.settings.userPayment).toBe('500');
    expect(result.current.settings.userRate).toBe('8.5');
  });

  it('should replace all settings with setSettings', () => {
    const { result } = renderHook(() => useProjection(), { wrapper });

    act(() => {
      result.current.setSettings(prev => ({
        ...prev,
        paymentMethod: 'Term Pmt',
        rateMethod: 'User Enter',
        userRate: '10',
      }));
    });

    expect(result.current.settings.paymentMethod).toBe('Term Pmt');
    expect(result.current.settings.rateMethod).toBe('User Enter');
    expect(result.current.settings.userRate).toBe('10');
  });
});

describe('ExitContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ExitProvider>{children}</ExitProvider>
  );

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useExit());
    }).toThrow('useExit must be used within an ExitProvider');
  });

  it('should provide default exit settings', () => {
    const { result } = renderHook(() => useExit(), { wrapper });

    expect(result.current.settings.method).toBe('Pay in Full');
    expect(result.current.settings.startMonth).toBe('1');
    expect(result.current.settings.endMonth).toBe('24');
    expect(result.current.settings.dpoPercentage).toBe('95');
    expect(result.current.settings.valueCapPercentage).toBe('90');
    expect(result.current.settings.ytmDesired).toBe('12');
    expect(result.current.settings.liquidationMonths).toBe('12');
    expect(result.current.settings.liquidationAddInterest).toBe(false);
  });

  it('should update individual settings', () => {
    const { result } = renderHook(() => useExit(), { wrapper });

    act(() => {
      result.current.updateSetting('method', 'DPO');
    });

    expect(result.current.settings.method).toBe('DPO');
    expect(result.current.settings.startMonth).toBe('1');
  });

  it('should update boolean settings', () => {
    const { result } = renderHook(() => useExit(), { wrapper });

    act(() => {
      result.current.updateSetting('liquidationAddInterest', true);
    });

    expect(result.current.settings.liquidationAddInterest).toBe(true);
  });

  it('should update numeric string settings', () => {
    const { result } = renderHook(() => useExit(), { wrapper });

    act(() => {
      result.current.updateSetting('endMonth', '36');
    });
    act(() => {
      result.current.updateSetting('dpoPercentage', '80');
    });

    expect(result.current.settings.endMonth).toBe('36');
    expect(result.current.settings.dpoPercentage).toBe('80');
  });

  it('should replace all settings with setSettings', () => {
    const { result } = renderHook(() => useExit(), { wrapper });

    act(() => {
      result.current.setSettings(prev => ({
        ...prev,
        method: 'Liquidation',
        liquidationMonths: '18',
        liquidationAddInterest: true,
      }));
    });

    expect(result.current.settings.method).toBe('Liquidation');
    expect(result.current.settings.liquidationMonths).toBe('18');
    expect(result.current.settings.liquidationAddInterest).toBe(true);
  });
});
