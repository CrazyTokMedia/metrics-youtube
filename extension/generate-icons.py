"""
Generate PNG icons from SVG source
Requires: pip install cairosvg Pillow
"""

try:
    import cairosvg
    from PIL import Image
    import io
    import os
except ImportError:
    print("ERROR: Missing dependencies")
    print("\nPlease install required packages:")
    print("  pip install cairosvg Pillow")
    print("\nOr use the online converter method described in INSTALL_GUIDE.md")
    exit(1)

def generate_icons():
    """Generate PNG icons at different sizes from SVG source"""

    svg_path = os.path.join(os.path.dirname(__file__), 'icons', 'icon.svg')
    icons_dir = os.path.join(os.path.dirname(__file__), 'icons')

    if not os.path.exists(svg_path):
        print(f"ERROR: SVG file not found at {svg_path}")
        exit(1)

    sizes = [16, 48, 128]

    print("Generating PNG icons from SVG...")

    for size in sizes:
        output_path = os.path.join(icons_dir, f'icon{size}.png')

        try:
            # Convert SVG to PNG at specified size
            png_data = cairosvg.svg2png(
                url=svg_path,
                output_width=size,
                output_height=size
            )

            # Save PNG
            with open(output_path, 'wb') as f:
                f.write(png_data)

            print(f"  Created: icon{size}.png ({size}x{size})")

        except Exception as e:
            print(f"  ERROR creating icon{size}.png: {e}")

    print("\nDone! Icons generated successfully.")
    print("\nNext step: Load extension in Chrome")
    print("  1. Go to chrome://extensions/")
    print("  2. Enable Developer Mode")
    print("  3. Click 'Load unpacked'")
    print("  4. Select the 'extension' folder")

if __name__ == '__main__':
    generate_icons()
