#!/usr/bin/env python3
"""
GitHub Release Script for YouTube Treatment Comparison Helper
Creates a GitHub release with the extension ZIP file attached.

Usage:
  python create_release.py --token YOUR_TOKEN --version 1.0.3
  python create_release.py --token YOUR_TOKEN --auto  # Auto-detect version from manifest
  python create_release.py --help
"""

import argparse
import json
import os
import sys
import zipfile
import requests
from pathlib import Path
from datetime import datetime

# Try to load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, environment variables must be set manually


class GitHubReleaser:
    def __init__(self, token, repo_owner="CrazyTokMedia", repo_name="metrics-youtube"):
        self.token = token
        self.repo_owner = repo_owner
        self.repo_name = repo_name
        self.api_base = "https://api.github.com"
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }

    def get_manifest_version(self):
        """Read version from extension/manifest.json"""
        manifest_path = Path("extension/manifest.json")
        if not manifest_path.exists():
            raise FileNotFoundError("extension/manifest.json not found")

        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)

        return manifest.get("version")

    def create_zip(self, version, output_dir="."):
        """Create a ZIP file of the extension"""
        output_dir = Path(output_dir)
        output_dir.mkdir(exist_ok=True)

        zip_filename = f"youtube-treatment-helper-v{version}.zip"
        zip_path = output_dir / zip_filename

        # Files/dirs to exclude
        exclude_patterns = [
            ".git",
            ".gitignore",
            "node_modules",
            ".DS_Store",
            "modular-backup",
            "__pycache__",
            ".env",
            "*.pyc",
            "package-lock.json",
            "yarn.lock"
        ]

        print(f"Creating ZIP: {zip_path}")

        extension_dir = Path("extension")
        if not extension_dir.exists():
            raise FileNotFoundError("extension/ directory not found")

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in extension_dir.rglob("*"):
                if file_path.is_file():
                    # Check if file should be excluded
                    relative_path = file_path.relative_to(extension_dir)
                    should_exclude = False

                    for pattern in exclude_patterns:
                        if pattern in str(relative_path):
                            should_exclude = True
                            break

                    if not should_exclude:
                        arcname = relative_path
                        zipf.write(file_path, arcname)
                        print(f"  Added: {arcname}")

        zip_size = zip_path.stat().st_size / 1024  # KB
        print(f"✅ ZIP created: {zip_filename} ({zip_size:.1f} KB)")

        return zip_path

    def get_latest_commit_message(self):
        """Get the latest commit message from git"""
        import subprocess
        try:
            result = subprocess.run(
                ["git", "log", "-1", "--pretty=%B"],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except Exception as e:
            print(f"Warning: Could not get commit message: {e}")
            return None

    def format_release_body(self, version, custom_body=None, template="default"):
        """Format release body with nice markdown"""
        if custom_body:
            return custom_body

        # Get commit message for changelog
        commit_msg = self.get_latest_commit_message()

        if template == "default":
            body = f"## 🚀 Release v{version}\n\n"

            if commit_msg:
                # Extract key fixes from commit message
                lines = commit_msg.split('\n')
                body += "### Changes\n\n"

                in_list = False
                for line in lines:
                    line = line.strip()
                    if line.startswith('-') or line.startswith('•'):
                        body += f"{line}\n"
                        in_list = True
                    elif line and not in_list:
                        body += f"{line}\n\n"
                    elif line and in_list:
                        body += f"- {line}\n"

            body += "\n### 📦 Installation\n\n"
            body += f"1. Download `youtube-treatment-helper-v{version}.zip` from the assets below\n"
            body += "2. Extract the ZIP file\n"
            body += "3. Open Chrome and go to `chrome://extensions/`\n"
            body += "4. Enable \"Developer mode\"\n"
            body += "5. Click \"Load unpacked\" and select the extracted folder\n\n"

            body += "### 🔗 Links\n\n"
            body += f"- [Source Code](https://github.com/{self.repo_owner}/{self.repo_name})\n"
            body += f"- [Issues](https://github.com/{self.repo_owner}/{self.repo_name}/issues)\n"
            body += f"- [Documentation](https://github.com/{self.repo_owner}/{self.repo_name}#readme)\n"

            return body

        return commit_msg or f"Release v{version}"

    def update_readme(self, version, download_url):
        """Update README.md with latest release info"""
        readme_path = Path("README.md")

        if not readme_path.exists():
            print("⚠️ README.md not found, skipping update")
            return

        with open(readme_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Update version badge/link if it exists
        import re

        # Update download link pattern
        download_pattern = r'\[Download v[\d.]+\]\(https://github\.com/[^/]+/[^/]+/releases/download/[^)]+\)'
        new_download = f'[Download v{version}]({download_url})'

        if re.search(download_pattern, content):
            content = re.sub(download_pattern, new_download, content)
            print("✅ Updated download link in README")
        else:
            # Add download section if not present
            download_section = f"\n## 📥 Download\n\n{new_download}\n"
            # Try to add after title
            title_match = re.search(r'^#\s+.+$', content, re.MULTILINE)
            if title_match:
                insert_pos = title_match.end()
                content = content[:insert_pos] + download_section + content[insert_pos:]
                print("✅ Added download section to README")

        # Update version mentions
        version_pattern = r'v[\d.]+'
        # Only update in specific contexts to avoid breaking semantic versioning in package.json references

        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"📝 README.md updated with v{version}")

    def create_release(self, version, tag_name=None, release_name=None, body=None, draft=False, prerelease=False, template="default"):
        """Create a GitHub release"""
        if not tag_name:
            tag_name = f"v{version}"

        if not release_name:
            release_name = f"v{version}"

        if not body:
            # Format body with nice markdown
            body = self.format_release_body(version, custom_body=body, template=template)

        url = f"{self.api_base}/repos/{self.repo_owner}/{self.repo_name}/releases"

        payload = {
            "tag_name": tag_name,
            "target_commitish": "main",
            "name": release_name,
            "body": body,
            "draft": draft,
            "prerelease": prerelease
        }

        print(f"\nCreating GitHub release: {tag_name}")
        print(f"Repository: {self.repo_owner}/{self.repo_name}")

        response = requests.post(url, headers=self.headers, json=payload)

        if response.status_code == 201:
            release_data = response.json()
            print(f"✅ Release created: {release_data['html_url']}")
            return release_data
        else:
            print(f"❌ Failed to create release: {response.status_code}")
            print(f"Response: {response.text}")
            response.raise_for_status()

    def upload_asset(self, release_data, file_path, content_type="application/zip"):
        """Upload a file as a release asset"""
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"Asset file not found: {file_path}")

        filename = file_path.name

        # Use upload_url from release data (it's a template with {?name,label})
        upload_url_template = release_data.get('upload_url', '')
        # Remove the template part and add the filename
        upload_url = upload_url_template.replace('{?name,label}', f'?name={filename}')

        headers = self.headers.copy()
        headers["Content-Type"] = content_type

        print(f"\nUploading asset: {filename}")
        print(f"Upload URL: {upload_url}")

        with open(file_path, 'rb') as f:
            response = requests.post(upload_url, headers=headers, data=f)

        if response.status_code == 201:
            asset_data = response.json()
            print(f"✅ Asset uploaded: {asset_data['browser_download_url']}")
            return asset_data
        else:
            print(f"❌ Failed to upload asset: {response.status_code}")
            print(f"Response: {response.text}")
            response.raise_for_status()

    def create_release_with_asset(self, version, zip_path=None, update_readme_flag=False, **kwargs):
        """Create a release and upload the ZIP file"""
        # Create ZIP if not provided
        if not zip_path:
            zip_path = self.create_zip(version)

        # Create release
        release_data = self.create_release(version, **kwargs)

        # Upload asset
        asset_data = self.upload_asset(release_data, zip_path)

        # Update README if requested
        if update_readme_flag:
            self.update_readme(version, asset_data['browser_download_url'])

        print(f"\n🎉 Release complete!")
        print(f"Release URL: {release_data['html_url']}")
        print(f"Download URL: {asset_data['browser_download_url']}")

        return release_data, asset_data


def main():
    parser = argparse.ArgumentParser(
        description="Create a GitHub release for YouTube Treatment Comparison Helper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create release with specific version
  python create_release.py --token ghp_xxx --version 1.0.3

  # Auto-detect version from manifest.json
  python create_release.py --token ghp_xxx --auto

  # Create draft release
  python create_release.py --token ghp_xxx --auto --draft

  # Custom release body
  python create_release.py --token ghp_xxx --auto --body "Bug fixes and improvements"

  # Use environment variable for token
  export GITHUB_TOKEN=ghp_xxx
  python create_release.py --auto
        """
    )

    parser.add_argument(
        "--token",
        help="GitHub personal access token (or set GITHUB_TOKEN env var)",
        default=os.environ.get("GITHUB_TOKEN")
    )

    version_group = parser.add_mutually_exclusive_group(required=True)
    version_group.add_argument(
        "--version",
        help="Version number (e.g., 1.0.3)"
    )
    version_group.add_argument(
        "--auto",
        action="store_true",
        help="Auto-detect version from extension/manifest.json"
    )

    parser.add_argument(
        "--tag",
        help="Git tag name (default: v{version})"
    )

    parser.add_argument(
        "--name",
        help="Release name (default: v{version})"
    )

    parser.add_argument(
        "--body",
        help="Release description (default: latest commit message)"
    )

    parser.add_argument(
        "--draft",
        action="store_true",
        help="Create as draft release"
    )

    parser.add_argument(
        "--prerelease",
        action="store_true",
        help="Mark as pre-release"
    )

    parser.add_argument(
        "--repo-owner",
        default="CrazyTokMedia",
        help="GitHub repository owner (default: CrazyTokMedia)"
    )

    parser.add_argument(
        "--repo-name",
        default="metrics-youtube",
        help="GitHub repository name (default: metrics-youtube)"
    )

    parser.add_argument(
        "--zip-only",
        action="store_true",
        help="Only create ZIP file, don't create GitHub release"
    )

    parser.add_argument(
        "--update-readme",
        action="store_true",
        help="Update README.md with download link after creating release"
    )

    parser.add_argument(
        "--template",
        choices=["default", "simple"],
        default="default",
        help="Release body template style (default: default)"
    )

    args = parser.parse_args()

    # Validate token
    if not args.zip_only and not args.token:
        print("❌ Error: GitHub token required. Use --token or set GITHUB_TOKEN environment variable")
        sys.exit(1)

    try:
        # Get version
        releaser = GitHubReleaser(args.token, args.repo_owner, args.repo_name)

        if args.auto:
            version = releaser.get_manifest_version()
            print(f"Auto-detected version: {version}")
        else:
            version = args.version

        if not version:
            print("❌ Error: Could not determine version")
            sys.exit(1)

        # Create ZIP
        zip_path = releaser.create_zip(version)

        if args.zip_only:
            print(f"\n✅ ZIP created: {zip_path}")
            return

        # Create release
        releaser.create_release_with_asset(
            version=version,
            zip_path=zip_path,
            tag_name=args.tag,
            release_name=args.name,
            body=args.body,
            draft=args.draft,
            prerelease=args.prerelease,
            template=args.template,
            update_readme_flag=args.update_readme
        )

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
