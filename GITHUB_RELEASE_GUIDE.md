# GitHub Release Distribution Guide

## Overview

This guide helps you distribute your Chrome extension to your team using GitHub Releases. No technical knowledge required from your team members!

---

## One-Time Setup (For You - 10 minutes)

### Step 1: Create GitHub Repository (if not already done)

1. Go to https://github.com
2. Click the "+" icon (top right) and select "New repository"
3. Fill in:
   - **Repository name**: `yt-metrics-airtable` (or your preferred name)
   - **Description**: "YouTube Treatment Comparison Helper - Chrome Extension"
   - **Private or Public**: Choose based on your needs
     - **Private**: Only invited team members can access (recommended for internal tools)
     - **Public**: Anyone can download
4. Click "Create repository"

### Step 2: Push Your Code to GitHub

If you haven't already connected this repo to GitHub:

```bash
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/yt-metrics-airtable.git

# Push your code
git branch -M master
git push -u origin master
```

### Step 3: Create Your First Release

1. **Package the extension**:
   - Run `package-extension.bat` (Windows) or `./package-extension.sh` (Mac/Linux)
   - This creates: `releases/youtube-treatment-helper-v1.0.0.zip`

2. **Go to your GitHub repository** in browser

3. **Click "Releases"** (right sidebar)

4. **Click "Create a new release"**

5. **Fill in the release form**:
   - **Tag**: `v1.0.0` (type this and click "Create new tag")
   - **Release title**: `v1.0.0 - Initial Release`
   - **Description**: Copy the changelog from CHANGELOG.md
   - **Attach files**: Drag and drop the zip file from `releases/` folder
   - Click "Publish release"

### Step 4: Get the Download Link

After publishing, you'll see your release page. The download link will be:

```
https://github.com/YOUR_USERNAME/yt-metrics-airtable/releases/latest
```

**This is the link you give to your team!**

---

## For Your Meeting Today

### What to Share with Your Team

1. **Send them the download link**:
   ```
   https://github.com/YOUR_USERNAME/yt-metrics-airtable/releases/latest
   ```

2. **Send them the INSTALLATION_GUIDE.md** (or walk through it together)

3. **Update the download link** in INSTALLATION_GUIDE.md:
   - Replace `[Download Latest Version](#)` with your actual link
   - Commit and push this change so the guide in the release is updated

### During the Meeting

**Share your screen and walk through**:
1. Downloading the zip from GitHub
2. Extracting to a permanent location
3. Loading in Chrome (chrome://extensions)
4. Testing it on YouTube Studio

**Answer questions** and help troubleshoot

**Remind them**:
- Keep the extension folder in the same location
- They'll need to reload after updates
- Contact you if they see any errors

---

## Publishing Updates (Future)

When you make changes and want to release an update:

### Step 1: Update Version Number

Edit `extension/manifest.json`:
```json
{
  "version": "1.0.1"  // Increment this
}
```

### Step 2: Update Changelog

Add changes to `CHANGELOG.md`:
```markdown
## [1.0.1] - 2024-10-29

### Fixed
- Fixed date picker issue in Advanced mode

### Added
- Improved error messages
```

### Step 3: Commit Changes

```bash
git add .
git commit -m "Bump version to 1.0.1 - Fix date picker issue"
git push
```

### Step 4: Create Release

1. Run packaging script: `package-extension.bat`
2. Go to GitHub → Releases → "Create a new release"
3. Tag: `v1.0.1`
4. Upload new zip file
5. Copy changelog into description
6. Publish

### Step 5: Notify Team

Send them a message:
```
New update available (v1.0.1)!

Download from the same link:
https://github.com/YOUR_USERNAME/yt-metrics-airtable/releases/latest

What's new:
- Fixed date picker issue
- Improved error messages

To update:
1. Download new zip
2. Extract to same location (replace files)
3. Go to chrome://extensions
4. Click reload icon on our extension
```

---

## Making It Even Easier (Optional - Future Enhancement)

### Add Auto-Update Check

You can add a feature to the extension that:
- Checks GitHub API for new versions
- Shows notification in popup
- Provides direct download link

This would make updates even more seamless!

### Move to Chrome Web Store (Recommended After Testing)

After your team has tested this for a week or two:

**Benefits**:
- Automatic updates (zero effort for users)
- Professional installation
- No "Developer mode" needed

**Process**:
1. Pay $5 one-time developer fee
2. Submit extension for review
3. Give team the Web Store link
4. All updates are automatic

---

## Troubleshooting

### Team member says: "I can't access the download link"

**If private repo**:
- Add them as collaborators:
  - Go to repo → Settings → Collaborators
  - Click "Add people"
  - Enter their GitHub username/email

**Alternative**: Download zip yourself and send via email/Slack (less ideal)

### Team member says: "Extension stopped working after Chrome restart"

This is normal for developer mode extensions:
- They just need to click reload in chrome://extensions
- Mention this is why Web Store is better long-term

### How do I test before releasing?

1. Run the packaging script locally
2. Extract the zip to a test folder
3. Load it in Chrome and test
4. If it works, publish to GitHub

---

## Quick Reference

### Create Release Checklist

- [ ] Update version in manifest.json
- [ ] Update CHANGELOG.md
- [ ] Commit and push changes
- [ ] Run packaging script
- [ ] Create GitHub release
- [ ] Upload zip file
- [ ] Copy changelog to release description
- [ ] Publish release
- [ ] Notify team

### Team Installation Checklist

- [ ] Download zip from GitHub
- [ ] Extract to permanent location
- [ ] Open chrome://extensions
- [ ] Enable Developer mode
- [ ] Load unpacked extension
- [ ] Select extension folder
- [ ] Test on YouTube Studio

---

## Questions?

This guide covers the GitHub Releases approach. If you want to explore:
- Chrome Web Store publishing
- Auto-update mechanisms
- Alternative distribution methods

Let me know and I can provide additional guidance!
