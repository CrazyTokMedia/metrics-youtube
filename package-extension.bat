@echo off
REM Package the Chrome extension for release

echo ========================================
echo Packaging YouTube Treatment Helper
echo ========================================
echo.

REM Get version from manifest.json (simple approach)
for /f "tokens=2 delims=:, " %%a in ('findstr "version" extension\manifest.json') do (
    set VERSION=%%a
)
REM Remove quotes
set VERSION=%VERSION:"=%

echo Current version: %VERSION%
echo.

REM Create releases directory if it doesn't exist
if not exist "releases" mkdir releases

REM Create a temporary packaging directory
set PACKAGE_DIR=releases\temp_package
if exist "%PACKAGE_DIR%" rd /s /q "%PACKAGE_DIR%"
mkdir "%PACKAGE_DIR%"
mkdir "%PACKAGE_DIR%\extension"

echo Copying extension files...

REM Copy only necessary files
xcopy /E /I /Y "extension\*.js" "%PACKAGE_DIR%\extension\" > nul
xcopy /E /I /Y "extension\*.html" "%PACKAGE_DIR%\extension\" > nul
xcopy /E /I /Y "extension\*.css" "%PACKAGE_DIR%\extension\" > nul
xcopy /E /I /Y "extension\*.json" "%PACKAGE_DIR%\extension\" > nul
xcopy /E /I /Y "extension\icons" "%PACKAGE_DIR%\extension\icons\" > nul

REM Copy documentation
copy "INSTALLATION_GUIDE.md" "%PACKAGE_DIR%\" > nul
copy "extension\USER_GUIDE.md" "%PACKAGE_DIR%\" > nul
copy "README.md" "%PACKAGE_DIR%\" > nul

echo Creating zip file...

REM Use PowerShell to create zip (works on Windows 10+)
set ZIP_NAME=youtube-treatment-helper-v%VERSION%.zip
set ZIP_PATH=releases\%ZIP_NAME%

REM Remove old zip if exists
if exist "%ZIP_PATH%" del "%ZIP_PATH%"

REM Create zip using PowerShell
powershell -Command "Compress-Archive -Path '%PACKAGE_DIR%\*' -DestinationPath '%ZIP_PATH%'"

REM Cleanup temp directory
rd /s /q "%PACKAGE_DIR%"

echo.
echo ========================================
echo Package created successfully!
echo Location: %ZIP_PATH%
echo ========================================
echo.
echo Next steps:
echo 1. Go to GitHub repository
echo 2. Click "Releases" on the right side
echo 3. Click "Create a new release"
echo 4. Tag version: v%VERSION%
echo 5. Release title: v%VERSION%
echo 6. Upload the zip file: %ZIP_NAME%
echo 7. Copy CHANGELOG below into description
echo 8. Click "Publish release"
echo.
echo Ready to upload to GitHub Releases!
echo.
pause
