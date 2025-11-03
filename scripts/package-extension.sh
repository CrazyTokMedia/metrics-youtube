#!/bin/bash
# Package the Chrome extension for release

echo "========================================"
echo "Packaging YouTube Treatment Helper"
echo "========================================"
echo ""

# Get version from manifest.json
VERSION=$(grep -o '"version": "[^"]*' extension/manifest.json | grep -o '[^"]*$')

echo "Current version: $VERSION"
echo ""

# Create releases directory if it doesn't exist
mkdir -p releases

# Create a temporary packaging directory
PACKAGE_DIR="releases/temp_package"
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR/extension"

echo "Copying extension files..."

# Copy only necessary files
cp extension/*.js "$PACKAGE_DIR/extension/" 2>/dev/null
cp extension/*.html "$PACKAGE_DIR/extension/" 2>/dev/null
cp extension/*.css "$PACKAGE_DIR/extension/" 2>/dev/null
cp extension/*.json "$PACKAGE_DIR/extension/" 2>/dev/null
cp -r extension/icons "$PACKAGE_DIR/extension/" 2>/dev/null

# Copy documentation
cp INSTALLATION_GUIDE.md "$PACKAGE_DIR/" 2>/dev/null
cp extension/USER_GUIDE.md "$PACKAGE_DIR/" 2>/dev/null
cp README.md "$PACKAGE_DIR/" 2>/dev/null

echo "Creating zip file..."

# Create zip
ZIP_NAME="youtube-treatment-helper-v${VERSION}.zip"
ZIP_PATH="releases/${ZIP_NAME}"

# Remove old zip if exists
rm -f "$ZIP_PATH"

# Create zip (cross-platform compatible)
cd "$PACKAGE_DIR"
zip -r "../../${ZIP_PATH}" . > /dev/null
cd ../..

# Cleanup temp directory
rm -rf "$PACKAGE_DIR"

echo ""
echo "========================================"
echo "Package created successfully!"
echo "Location: $ZIP_PATH"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Go to GitHub repository"
echo "2. Click 'Releases' on the right side"
echo "3. Click 'Create a new release'"
echo "4. Tag version: v${VERSION}"
echo "5. Release title: v${VERSION}"
echo "6. Upload the zip file: ${ZIP_NAME}"
echo "7. Copy CHANGELOG below into description"
echo "8. Click 'Publish release'"
echo ""
echo "Ready to upload to GitHub Releases!"
echo ""
