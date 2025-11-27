# Building the Loan Underwriting System as a Standalone .exe

This guide will help you build the Loan Underwriting System as a standalone Windows executable (.exe) that can run without any browser or additional installation.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your Windows desktop:

1. **Node.js** (version 16 or higher)
   - Download from: https://nodejs.org/
   - Recommended: LTS (Long Term Support) version
   - Verify installation: Open Command Prompt and type `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git** (to clone the repository)
   - Download from: https://git-scm.com/

## 🚀 Quick Start - Building the .exe

### Step 1: Clone/Download the Repository

If you haven't already, get the code on your desktop:

```bash
git clone <your-repository-url>
cd Gui-V2
```

Or if you already have it, navigate to the project folder:

```bash
cd path/to/Gui-V2
```

### Step 2: Install Dependencies

Open Command Prompt or PowerShell in the project folder and run:

```bash
npm install
```

This will install all necessary packages including:
- React and related libraries
- Electron (for desktop app packaging)
- electron-builder (for creating the .exe)
- All other dependencies

**Note:** This step may take 5-10 minutes depending on your internet connection.

### Step 3: Build the Windows .exe

Once all dependencies are installed, run:

```bash
npm run electron:build:win
```

This command will:
1. Compile the TypeScript code
2. Build the React application
3. Package everything with Electron
4. Create a Windows installer (.exe)

**Build time:** Approximately 5-10 minutes

### Step 4: Find Your Application

After the build completes successfully, you'll find the installer in:

```
Gui-V2/dist/
```

Look for a file named:
- `Loan Underwriting System Setup <version>.exe` - The installer

## 📦 Installation

1. Navigate to the `dist` folder
2. Double-click the installer: `Loan Underwriting System Setup.exe`
3. Follow the installation wizard:
   - Choose installation directory
   - Select whether to create desktop shortcut
   - Click Install
4. Once installed, launch from:
   - Desktop shortcut (if created)
   - Start Menu → Loan Underwriting System
   - Installation directory

## 🔧 Development Mode (Optional)

If you want to test the app before building:

### Run in Development Mode

```bash
npm run electron:dev
```

This will:
- Start the development server
- Open the app in an Electron window
- Enable hot-reload (changes update automatically)
- Show developer tools for debugging

Press `Ctrl+C` to stop the development server.

## 📝 Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run React app in browser (development) |
| `npm run build` | Build React app only |
| `npm run electron:dev` | Run app in Electron (development mode) |
| `npm run electron:build:win` | Build Windows .exe installer |
| `npm run electron:build:mac` | Build macOS .dmg (requires macOS) |
| `npm run electron:build:linux` | Build Linux AppImage/deb |

## 🎨 Customization Options

### Change Application Name

Edit `package.json`:

```json
{
  "build": {
    "productName": "Your Custom Name Here"
  }
}
```

### Change Company/Publisher Name

Edit `package.json`:

```json
{
  "author": "Your Company Name",
  "build": {
    "win": {
      "publisherName": "Your Company Name"
    }
  }
}
```

### Add Application Icon

1. Create/obtain icons in these formats:
   - `icon.ico` (Windows) - 256x256 or larger
   - `icon.icns` (macOS) - multiple sizes
   - `icon.png` (Linux) - 512x512 or 1024x1024

2. Place them in the `public/` folder

3. Icons are already configured in `package.json` to use these files

**Online icon converters:**
- https://www.icoconverter.com/ (PNG to ICO)
- https://iconverticons.com/ (PNG to ICNS)

## ⚙️ Build Configuration

The build configuration is in `package.json` under the `"build"` section:

```json
{
  "build": {
    "appId": "com.loanmanagement.app",
    "productName": "Loan Underwriting System",
    "win": {
      "target": "nsis",        // Windows installer type
      "icon": "public/icon.ico"
    },
    "nsis": {
      "oneClick": false,       // Allow custom install location
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

## 🐛 Troubleshooting

### Build Fails - "electron-builder not found"

**Solution:** Run `npm install` again

### Build Fails - "Cannot find module"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Port 3000 already in use" during development

**Solution:**
- Close any other apps using port 3000
- Or change the port in `vite.config.ts`:
  ```typescript
  server: {
    port: 3001  // Change to different port
  }
  ```

### Icon not showing in built app

**Solution:**
- Ensure icon files exist in `public/` folder
- Icons must be proper format (.ico for Windows)
- Rebuild the app after adding icons

### App won't start after installation

**Solution:**
- Check Windows Defender/Antivirus (may block unsigned apps)
- Right-click .exe → Properties → Unblock
- Run as Administrator

## 📊 Build Output Details

### File Sizes (Approximate)

- Installer (.exe): ~150-200 MB
- Installed size: ~250-300 MB

**Why so large?**
The app includes:
- Chromium browser engine (~100 MB)
- Node.js runtime (~50 MB)
- Your application code and dependencies (~50-100 MB)

This is normal for Electron apps and allows them to run standalone without requiring Chrome or any other browser.

### Installation Location (Default)

```
C:\Users\<YourUsername>\AppData\Local\Programs\loan-underwriting-system\
```

## 🔒 Code Signing (Optional - For Production)

For production distribution, you should sign your app to avoid Windows security warnings.

**Requirements:**
- Windows Code Signing Certificate
- Certificate file (.pfx or .p12)

**Configuration:**
Add to `package.json`:

```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "your-password"
    }
  }
}
```

**Note:** Store certificate password in environment variable for security:

```bash
set CSC_KEY_PASSWORD=your-password
npm run electron:build:win
```

## 📤 Distributing Your Application

### Option 1: Direct Distribution

1. Share the installer file: `Loan Underwriting System Setup.exe`
2. Users download and run the installer
3. No additional setup required on user's machine

### Option 2: Portable Version

To create a portable version (no installer):

Edit `package.json`:

```json
{
  "build": {
    "win": {
      "target": ["portable"]
    }
  }
}
```

Then rebuild:

```bash
npm run electron:build:win
```

This creates a single .exe that can run from any location (USB drive, network share, etc.)

## 🆘 Getting Help

If you encounter issues:

1. Check the error message carefully
2. Ensure all prerequisites are installed
3. Try deleting `node_modules` and reinstalling
4. Check Electron Builder documentation: https://www.electron.build/

## 📚 Additional Resources

- **Electron Documentation:** https://www.electronjs.org/docs
- **Electron Builder:** https://www.electron.build/
- **Vite Documentation:** https://vitejs.dev/
- **React Documentation:** https://react.dev/

## ✅ Checklist

Before building for production:

- [ ] Update version number in `package.json`
- [ ] Update company/author information
- [ ] Add custom application icon
- [ ] Test in development mode (`npm run electron:dev`)
- [ ] Build the installer (`npm run electron:build:win`)
- [ ] Test the installer on a clean machine
- [ ] (Optional) Sign the application with code signing certificate

---

## 🎉 Success!

Once built, you have a professional, standalone desktop application that:
- ✅ Runs on Windows without any browser
- ✅ Can be installed like any other desktop app
- ✅ Works offline (no internet required)
- ✅ Has a familiar Windows interface
- ✅ Includes all your React components and functionality

Enjoy your new desktop application!
