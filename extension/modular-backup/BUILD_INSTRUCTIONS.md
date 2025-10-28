# Build Instructions - Modular Extension

## ✅ What's Been Done

All modules have been created in the `src/` directory:

```
src/
├── config/
│   └── constants.js          ✅ All constants, selectors, messages
├── utils/
│   ├── dateHelpers.js         ✅ Date formatting & calculations
│   ├── domHelpers.js          ✅ DOM utilities
│   └── storageHelpers.js      ✅ Chrome storage wrapper
├── core/
│   ├── validation.js          ✅ Publish date detection
│   ├── navigation.js          ✅ Page navigation
│   └── extraction.js          ✅ Metrics extraction
├── ui/
│   ├── panel.js               ✅ Panel HTML & setup
│   └── eventHandlers.js       ✅ Event handlers
├── errorHandling.js           ✅ Global error handling
└── index.js                   ✅ Entry point
```

## 🚀 Build Steps

### Step 1: Install Dependencies

```bash
cd extension
npm install
```

This installs:
- `webpack` - Module bundler
- `webpack-cli` - CLI for webpack
- `rimraf` - Cross-platform rm -rf

### Step 2: Build the Extension

**For development (with watch mode):**
```bash
npm run dev
```
This will:
- Watch for file changes
- Rebuild automatically
- Generate source maps for debugging
- Output to `dist/content.js`

**For production:**
```bash
npm run build
```
This creates an optimized build in `dist/content.js`.

### Step 3: Update manifest.json

**IMPORTANT:** Before loading the extension, you need to update `manifest.json`:

**Change this:**
```json
{
  "content_scripts": [
    {
      "matches": ["https://studio.youtube.com/*"],
      "js": ["content.js"],
      "css": ["styles.css"],
      "run_at": "document_idle"
    }
  ]
}
```

**To this:**
```json
{
  "content_scripts": [
    {
      "matches": ["https://studio.youtube.com/*"],
      "js": ["dist/content.js"],
      "css": ["styles.css"],
      "run_at": "document_idle"
    }
  ]
}
```

### Step 4: Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `extension` folder
6. The extension should load successfully!

### Step 5: Test

1. Go to YouTube Studio
2. Open a video page
3. Click "Treatment Helper" button (top right)
4. Test all functionality:
   - Calculate dates
   - Extract metrics
   - Copy functions

## 🔍 Troubleshooting

### Build Errors

**Error: Cannot find module 'webpack'**
```bash
# Solution: Install dependencies
npm install
```

**Error: Module not found**
```bash
# Solution: Check import paths in your files
# All imports should use relative paths like:
import { formatDate } from '../utils/dateHelpers.js';
```

### Extension Errors

**Extension won't load:**
- Check that `dist/content.js` exists
- Verify manifest.json points to `dist/content.js`
- Check browser console for errors

**Functions not working:**
- Open browser DevTools (F12)
- Check Console tab for errors
- Verify all modules loaded correctly

### Debugging

**Source Maps:**
The build includes source maps (`dist/content.js.map`), so you can:
1. Open DevTools
2. Go to Sources tab
3. See original module files (not bundled code)
4. Set breakpoints in original code

## 📦 File Structure After Build

```
extension/
├── dist/
│   ├── content.js           ← Bundled output
│   └── content.js.map       ← Source map for debugging
├── src/
│   └── (all modules)
├── node_modules/
│   └── (dependencies)
├── content.js               ← OLD VERSION (backup)
├── styles.css
├── manifest.json            ← UPDATE THIS
├── package.json
├── webpack.config.js
└── .gitignore
```

## 🔄 Development Workflow

1. **Start watch mode:**
   ```bash
   npm run dev
   ```

2. **Make changes to any module** in `src/`

3. **Webpack rebuilds automatically**

4. **Reload extension** in Chrome:
   - Go to `chrome://extensions/`
   - Click reload icon on your extension
   - Refresh YouTube Studio page

5. **Test your changes**

6. **Repeat** as needed

## 🎯 Quick Commands

```bash
# Install dependencies
npm install

# Development build (watch mode)
npm run dev

# Production build
npm run build

# Clean build output
npm run clean
```

## ⚠️ Important Notes

1. **Keep old content.js**: The old `content.js` is kept as a backup. Don't delete it yet!

2. **Don't commit dist/**: The `dist/` folder is gitignored. Only commit source files in `src/`.

3. **Always build before testing**: After changing module files, you must rebuild.

4. **Source maps**: Leave source maps enabled for easier debugging.

## ✅ Success Checklist

After building, verify:
- [ ] `dist/content.js` exists and is not empty
- [ ] `manifest.json` points to `dist/content.js`
- [ ] Extension loads in Chrome without errors
- [ ] Treatment Helper button appears on YouTube Studio
- [ ] All features work (Calculate, Extract, Copy)
- [ ] No console errors

## 🎉 You're Done!

Your extension is now fully modular and ready for development!

**Benefits you now have:**
- ✅ Clean, organized code
- ✅ Easy to maintain and debug
- ✅ Can add unit tests easily
- ✅ Better separation of concerns
- ✅ Scalable architecture
