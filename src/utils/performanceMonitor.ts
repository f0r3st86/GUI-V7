// Performance monitoring utility for measuring frame rates and render times

/**
 * FPS Monitor - Tracks actual frame rate in production
 * Usage: Call start() to begin monitoring, stop() to end
 */
export class FPSMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private rafId: number | null = null;
  private callback: ((fps: number) => void) | null = null;

  constructor(callback?: (fps: number) => void) {
    this.callback = callback || null;
  }

  private measureFrame = (currentTime: number) => {
    this.frameCount++;
    const elapsed = currentTime - this.lastTime;

    // Update FPS every second
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);

      if (this.callback) {
        this.callback(this.fps);
      }

      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    this.rafId = requestAnimationFrame(this.measureFrame);
  };

  start(): void {
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.rafId = requestAnimationFrame(this.measureFrame);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getCurrentFPS(): number {
    return this.fps;
  }
}

/**
 * React Component Performance Tracker
 * Measures actual render times using React Profiler API
 */
export const createProfilerCallback = (componentName: string) => {
  return (
    _id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    _baseDuration: number,
    _startTime: number,
    _commitTime: number
  ) => {
    const fps120Budget = 8.33;
    const fps60Budget = 16.67;

    let status = '✓ Excellent';
    if (actualDuration > fps120Budget && actualDuration <= fps60Budget) {
      status = '✓ Good (60fps)';
    } else if (actualDuration > fps60Budget) {
      status = '⚠️ Slow';
    }

    console.log(`[Profiler] ${componentName}`, {
      phase,
      actualDuration: `${actualDuration.toFixed(2)}ms`,
      status,
      fps120: actualDuration <= fps120Budget,
      fps60: actualDuration <= fps60Budget
    });
  };
};

/**
 * Performance marks for measuring specific operations
 */
export const perf = {
  mark: (name: string): void => {
    performance.mark(name);
  },

  measure: (name: string, startMark: string, endMark?: string): number => {
    const endMarkName = endMark || `${startMark}-end`;
    performance.mark(endMarkName);

    const measure = performance.measure(name, startMark, endMarkName);
    return measure.duration;
  },

  clear: (): void => {
    performance.clearMarks();
    performance.clearMeasures();
  }
};

/**
 * Enable high-refresh-rate optimizations
 * Call this once at app initialization
 */
export const enableHighRefreshRate = (): void => {
  // Enable CSS containment for layout optimization
  const style = document.createElement('style');
  style.textContent = `
    /* GPU-accelerated properties for 120fps */
    * {
      /* Enable hardware acceleration for transforms */
      transform: translateZ(0);
      backface-visibility: hidden;
      perspective: 1000px;
    }

    /* Optimize scrolling for high refresh rates */
    * {
      scroll-behavior: auto; /* Disable smooth scroll for 120fps */
    }

    /* Contain layout calculations */
    [role="tabpanel"],
    .tab-content {
      contain: layout style paint;
    }

    /* Optimize table rendering */
    table {
      contain: layout style;
    }

    /* Optimize input fields for typing */
    input, select, textarea {
      contain: layout style;
      will-change: value;
    }

    /* Optimize animations */
    .transition,
    [class*="transition"] {
      will-change: transform, opacity;
      transform: translateZ(0);
    }
  `;
  document.head.appendChild(style);

  console.log('[Performance] High refresh rate optimizations enabled');
  console.log('[Performance] Target: 120fps (8.33ms budget per frame)');
};

/**
 * Debounce with requestAnimationFrame for smooth 120fps updates
 * Use this instead of setTimeout for visual updates
 */
export const rafDebounce = <T extends (...args: any[]) => void>(
  callback: T
): ((...args: Parameters<T>) => void) => {
  let rafId: number | null = null;

  return (...args: Parameters<T>) => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      callback(...args);
      rafId = null;
    });
  };
};

/**
 * Check if browser supports high refresh rates
 */
export const supportsHighRefreshRate = (): boolean => {
  // Check if screen refresh rate is above 60Hz
  // @ts-ignore - experimental API
  const refreshRate = window.screen?.refreshRate || 60;
  return refreshRate > 60;
};

/**
 * Get optimal frame budget based on display
 */
export const getFrameBudget = (): { fps: number; budget: number } => {
  const isHighRefresh = supportsHighRefreshRate();
  return isHighRefresh
    ? { fps: 120, budget: 8.33 }
    : { fps: 60, budget: 16.67 };
};
