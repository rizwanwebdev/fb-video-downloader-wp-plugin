# All in One Facebook Video Downloader (WordPress)

A powerful, minimalist WordPress plugin to download public Facebook videos and Reels directly. No external APIs required. Includes ad monetization features, custom appearance settings, and a restricted-mode custom player.

## 🚀 Key Features
- **Direct Scraping**: Downloads videos (HD/SD) without relying on paid 3rd-party APIs.
- **Minimalist Header-less UI**: Clean, centered design (90% width on Desktop, 100% on Mobile).
- **Ad Monetization**:
  - Separate ad toggles for HD and SD qualities.
  - Configurable Ad Popup Delay (e.g., show ad for 5 seconds before allowing download).
  - "Close" button stays hidden until the timer expires.
- **Custom Appearance Settings**:
  - Dedicated Sidebar Menu (**FB Downloader**).
  - Customize: Input Border Color, Button Background, and Button Text Color.
  - Edit: Placeholder text and Fetch button labels.
- **Pro Video Player**:
  - Hidden native browser controls to prevent bypass.
  - Custom JS-based Play/Pause overlay.
  - Right-click/Context menu disabled on preview and buttons.
- **Smart Filenaming**: Automatically names downloaded files based on the video title.

## 🛠️ Installation
1.  **Download the ZIP**: Grab the latest release `Facebook Video Downloader V.1.0.0.zip`.
2.  **Upload to WordPress**: Go to **Plugins > Add New > Upload Plugin**.
3.  **Activate**: Once activated, locate the **"FB Downloader"** menu in your WordPress sidebar.

## 📖 How to Use
1.  **Placement**: Use the shortcode `[video_downloader]` on any Page or Post.
2.  **Configuration**:
    - Go to **FB Downloader** > Settings.
    - Paste your Ad code if you want to monetize.
    - Set the **Ad Popup Delay** (default is 2 seconds).
    - Customize the colors to match your theme.
3.  **Download Flow**:
    - Paste a public Facebook video URL.
    - View the custom preview.
    - Click "Download HD" or "Download SD".
    - If ads are enabled, a popup appears; once closed (after the delay), the download starts automatically via JS Blobs.

## 🔒 Requirements
- WordPress 5.0+
- PHP 7.4+
- `wp_remote_get` support enabled on your server.

## 👨‍💻 Author
Developed by **Rizwan** - [rizwan.one](https://rizwan.one)

---
*Disclaimer: This plugin is intended for downloading public content with the creator's permission. Ensure compliance with Facebook's TOS.*
