# Quick Start - Modular Extension

Your extension has been fully modularized! Follow these 5 simple steps to build and test it.

## Step 1: Navigate to Extension Directory

```bash
cd C:\Users\sidro\crazytok\yt_metrics_airtable\extension
```

## Step 2: Install Dependencies

```bash
npm install
```

This installs webpack and build tools. Should take about 30 seconds.

## Step 3: Build the Extension

**For development (with auto-rebuild on file changes):**
```bash
npm run dev
```

**For production (one-time build):**
```bash
npm run build
```

This creates `dist/content.js` from all your modules in `src/`.

## Step 4: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `extension` folder
5. If extension is already loaded, click the reload icon instead

## Step 5: Test on YouTube Studio

1. Go to https://studio.youtube.com
2. Open any video page
3. Look for "Treatment Helper" button in top-right corner
4. Click it and test all features:
   - Calculate dates
   - Extract metrics
   - Copy functions

## What Changed?

### Old Structure
```
extension/
└── content.js (2,290 lines - everything in one file)
```

### New Structure
```
extension/
├── src/                    ← All source code (11 modules)
│   ├── config/
│   │   └── constants.js
│   ├── utils/
│   │   ├── dateHelpers.js
│   │   ├── domHelpers.js
│   │   └── storageHelpers.js
│   ├── core/
│   │   ├── validation.js
│   │   ├── navigation.js
│   │   └── extraction.js
│   ├── ui/
│   │   ├── panel.js
│   │   └── eventHandlers.js
│   ├── errorHandling.js
│   └── index.js
└── dist/
    └── content.js          ← Webpack builds everything here
```

### Benefits
- Clean, organized code (each file has one clear purpose)
- Easy to find and fix bugs
- Simple to add new features
- Better performance with webpack optimization
- Source maps for debugging original code

## Development Workflow

1. **Start watch mode:**
   ```bash
   npm run dev
   ```

2. **Make changes** to any file in `src/`

3. **Webpack auto-rebuilds** `dist/content.js`

4. **Reload extension** in Chrome:
   - Go to `chrome://extensions/`
   - Click reload icon on your extension
   - Refresh YouTube Studio page

5. **Test your changes**

## Troubleshooting

### "Cannot find module 'webpack'"
```bash
npm install
```

### "dist/content.js not found"
```bash
npm run build
```

### Extension won't load
- Verify `dist/content.js` exists
- Check `manifest.json` points to `dist/content.js` (already updated ✓)
- Open browser console (F12) for errors

### Functions not working
- Open DevTools (F12)
- Check Console tab for errors
- Look at Sources tab to see your original module files (not bundled code)

## Need More Details?

See `BUILD_INSTRUCTIONS.md` for comprehensive documentation.

## Success Checklist

After building, verify:
- [ ] `dist/content.js` exists and is not empty
- [ ] Extension loads in Chrome without errors
- [ ] Treatment Helper button appears on YouTube Studio
- [ ] Calculate dates works correctly
- [ ] Extract metrics works correctly
- [ ] Copy functions work correctly
- [ ] No console errors

## You're Ready!

Your extension is now fully modular and production-ready. Happy coding!
