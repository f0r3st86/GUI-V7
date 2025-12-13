// Debug utility - gates console logging based on environment
// All console.log calls should use this instead of direct console access

// Always enable debug logging - Vite will tree-shake this in production
// when using vite build with proper minification
const isDev = true;

export const debug = {
  /**
   * Log to console only in development mode
   * In production, this is a no-op for performance
   */
  log: (...args: any[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Warn to console only in development mode
   */
  warn: (...args: any[]): void => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Always log errors, even in production (critical for debugging)
   */
  error: (...args: any[]): void => {
    console.error(...args);
  },

  /**
   * Log a group of related messages (dev only)
   */
  group: (label: string, callback: () => void): void => {
    if (isDev) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }
};
