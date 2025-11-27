# Electron Desktop App Setup - Quick Reference

## ✅ What's Been Added

Your React application is now configured to build as a standalone desktop application (.exe for Windows, .dmg for macOS, etc.)

### Files Added

1. **electron.js** - Main Electron process (creates app window)
2. **preload.js** - Security layer between Electron and React
3. **vite.config.ts** - Build configuration for Electron compatibility
4. **.gitignore** - Excludes build artifacts from Git
5. **BUILD_INSTRUCTIONS.md** - Comprehensive build guide

### Files Modified

1. **package.json** - Added:
   - Electron dependencies
   - Build scripts (`electron:build:win`, `electron:dev`, etc.)
   - electron-builder configuration
   - Windows installer settings

## 🚀 Quick Start Commands

### On Your Desktop (with npm installed):

```bash
# 1. Install all dependencies (do this first!)
npm install

# 2. Test in development mode (optional)
npm run electron:dev

# 3. Build the Windows .exe
npm run electron:build:win
```

### Output

The .exe installer will be in:
```
Gui-V2/dist/Loan Underwriting System Setup <version>.exe
```

## 📋 What You Need on Your Desktop

1. **Node.js** (v16+): https://nodejs.org/
2. **npm** (comes with Node.js)
3. **Good internet connection** (first install downloads ~200MB)

## ⏱️ Time Estimates

- **First time setup:** 10-15 minutes
  - `npm install`: 5-10 minutes
  - `npm run electron:build:win`: 5-10 minutes

- **Subsequent builds:** 5-10 minutes
  - Dependencies already installed
  - Only build step needed

## 🎯 What You Get

A professional Windows desktop application that:
- Installs like any Windows program
- Runs without a browser
- Works completely offline
- Has a desktop shortcut
- Appears in Start Menu
- Can be uninstalled normally

## 📦 Application Details

- **Name:** Loan Underwriting System
- **Installer Type:** NSIS (standard Windows installer)
- **Default Install Location:** `C:\Users\<You>\AppData\Local\Programs\loan-underwriting-system\`
- **Size:** ~150-200 MB installer, ~250-300 MB installed
- **Platform:** Windows 64-bit

## 🎨 Customization (Optional)

### Change App Name

In `package.json`, find:
```json
"productName": "Loan Underwriting System"
```

Change to your preferred name.

### Add Custom Icon

1. Get a 256x256 (or larger) icon image
2. Convert to .ico format: https://www.icoconverter.com/
3. Save as `public/icon.ico`
4. Rebuild the app

### Change Company Name

In `package.json`, find:
```json
"author": "Your Company Name"
```

Update to your company name.

## 🔍 Development vs Production

### Development Mode (`npm run electron:dev`)
- Fast startup
- Live reload (changes update instantly)
- Developer tools enabled
- Connects to local server

### Production Build (`npm run electron:build:win`)
- Creates standalone installer
- No developer tools
- Optimized for performance
- Can distribute to users

## 📁 Project Structure (Electron Files)

```
Gui-V2/
├── electron.js          # Main Electron process
├── preload.js          # Security preload script
├── vite.config.ts      # Build configuration
├── package.json        # Dependencies & scripts
├── BUILD_INSTRUCTIONS.md  # Detailed guide
├── ELECTRON_SETUP.md   # This file
│
├── src/                # Your React app (unchanged)
├── public/             # Static assets & icons
│
└── dist/               # Build output (after build)
    └── Loan Underwriting System Setup.exe
```

## ⚠️ Important Notes

1. **First Install:** The first `npm install` downloads Electron (~100MB) and other dependencies. This is normal.

2. **Build Time:** Building the .exe takes time because it packages your entire app with Chromium and Node.js.

3. **File Size:** Desktop apps are larger than web apps because they include everything needed to run standalone.

4. **Windows Defender:** May show warning for unsigned apps. Right-click → Properties → Unblock, or get a code signing certificate for production.

5. **Updates:** When you update your React code, rebuild the .exe to include changes.

## 🐛 Common Issues

### "npm command not found"
→ Install Node.js from https://nodejs.org/

### "electron-builder not found"
→ Run `npm install` first

### Port 3000 already in use
→ Close other apps using port 3000, or change port in `vite.config.ts`

### Build fails with network error
→ Check internet connection, try again

## 📖 Full Documentation

For detailed instructions, troubleshooting, and advanced options, see:
**BUILD_INSTRUCTIONS.md**

## 🎉 You're Ready!

Everything is configured. Just run on your desktop:

```bash
npm install
npm run electron:build:win
```

Wait 10-15 minutes, and you'll have a professional Windows installer!

---

**Questions?** Check BUILD_INSTRUCTIONS.md for comprehensive details.
