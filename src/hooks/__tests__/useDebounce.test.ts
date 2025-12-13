import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce Hook', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });

    // Value should still be initial (not debounced yet)
    expect(result.current).toBe('initial');

    // Fast-forward time and flush promises
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Now it should be updated
    expect(result.current).toBe('updated');

    vi.useRealTimers();
  });

  it('should cancel previous timeout on rapid changes', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Rapid updates
    rerender({ value: 'update1', delay: 500 });
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: 'update2', delay: 500 });
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: 'update3', delay: 500 });

    // Still showing initial
    expect(result.current).toBe('initial');

    // Complete the delay
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Should show only the last value
    expect(result.current).toBe('update3');

    vi.useRealTimers();
  });

  it('should use default delay of 300ms', async () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value), // No delay specified
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // 200ms - should not update
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('initial');

    // Additional 100ms (total 300ms) - should update
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('updated');

    vi.useRealTimers();
  });

  it('should work with different value types', async () => {
    vi.useFakeTimers();

    // Number
    const { result: numResult, rerender: numRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 0 } }
    );

    numRerender({ value: 42 });
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(numResult.current).toBe(42);

    // Boolean
    const { result: boolResult, rerender: boolRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: false } }
    );

    boolRerender({ value: true });
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(boolResult.current).toBe(true);

    // Object
    const { result: objResult, rerender: objRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: { a: 1 } } }
    );

    objRerender({ value: { a: 2 } });
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(objResult.current).toEqual({ a: 2 });

    vi.useRealTimers();
  });
});
