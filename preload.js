/**
 * Preload script for Electron
 * This runs in a sandboxed context with access to Node.js APIs
 * Use this to expose safe APIs to the renderer process
 */

const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// specific Node.js features in a controlled way
contextBridge.exposeInMainWorld('electron', {
  // Add any APIs you want to expose to the React app here
  // For now, we'll keep it minimal since the React app is self-contained

  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

// Log that preload script has loaded (for debugging)
console.log('Preload script loaded successfully');
