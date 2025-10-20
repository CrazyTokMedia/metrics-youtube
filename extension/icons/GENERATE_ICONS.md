# How to Generate PNG Icons from SVG

## Option 1: ImageMagick (Command Line)

### Install ImageMagick for Windows

1. Download from: https://imagemagick.org/script/download.php#windows
2. Run the installer (ImageMagick-7.x.x-Q16-x64-dll.exe)
3. **Important:** Check "Add application directory to system path" during installation
4. Restart your terminal/PowerShell

### Generate Icons

Once installed, run these commands:

```bash
cd C:\Users\sidro\crazytok\yt_metrics_airtable\extension\icons

# Generate all three sizes
magick icon.svg -resize 128x128 icon128.png
magick icon.svg -resize 48x48 icon48.png
magick icon.svg -resize 16x16 icon16.png
```

## Option 2: Python Script (Easiest if you have Python)

### Install Dependencies

```bash
pip install cairosvg Pillow
```

### Run the Script

```bash
cd C:\Users\sidro\crazytok\yt_metrics_airtable\extension
python generate-icons.py
```

## Option 3: Online Converter (No Installation)

1. Go to https://svgtopng.com/ or https://cloudconvert.com/svg-to-png
2. Upload `icon.svg` from this folder
3. Convert to PNG with these sizes:
   - 128x128 pixels → Save as `icon128.png`
   - 48x48 pixels → Save as `icon48.png`
   - 16x16 pixels → Save as `icon16.png`
4. Download and save all three files to this folder

## Option 4: Use Inkscape (Free Desktop App)

1. Download Inkscape: https://inkscape.org/release/
2. Open `icon.svg` in Inkscape
3. File → Export PNG Image
4. Set width/height to 128, export as `icon128.png`
5. Repeat for 48x48 and 16x16

## Option 5: Simple Paint.NET or GIMP

1. Download Paint.NET (Windows) or GIMP (cross-platform)
2. Open `icon.svg`
3. Image → Resize to 128x128
4. Export as `icon128.png`
5. Repeat for other sizes

## Option 6: PowerShell with .NET (No Extra Install)

Save this as `generate-icons.ps1` and run it:

```powershell
# Load System.Drawing assembly
Add-Type -AssemblyName System.Drawing

$svgPath = ".\icon.svg"
$sizes = @(16, 48, 128)

foreach ($size in $sizes) {
    $outPath = ".\icon$size.png"

    # Note: PowerShell doesn't natively support SVG
    # This requires Inkscape or ImageMagick to be installed
    # Better to use Python script or online converter
    Write-Host "For SVG conversion, please use Python script or online converter"
}
```

## Verification

After generating, verify you have these files:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

Check file sizes:
```bash
dir icon*.png
```

All three should show up with proper dimensions.

## Quick Test

To verify the icons look correct, just double-click each PNG file to view it in Windows Photo Viewer or default image viewer.

---

**Recommended:** Use Python script (Option 2) or online converter (Option 3) for quickest results.
