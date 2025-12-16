# Chrome Locker Extension

**Chrome Locker Extension v2** - Protect your browser privacy with password authentication

## 📝 Description

Chrome Locker is a Chrome Extension designed to protect your privacy by requiring a password when starting the browser. The extension acts as an additional security layer without interfering with normal web browsing activities.

## ✨ Features

🔐 **Password Protection**: Requires password authentication on browser startup  
🎨 **Beautiful UI**: Modern design with smooth animations  
⏱️ **Smart Cooldown**: 5-second wait after each wrong attempt (unlimited tries)  
🚫 **Shortcut Prevention**: Disables F12, Ctrl+Shift+I, Ctrl+U in lockscreen  
🖱️ **Right-click Protection**: Disables context menu in lockscreen  
⚡ **Non-intrusive**: Doesn't interfere with normal website functionality  
🔄 **Auto Focus**: Automatically focuses on password input field  
✅ **First-time Setup**: Automatically opens settings page on first install

## ⚠️ Important Warnings

### Security Limitations
- This extension is **NOT** a professional security solution
- Can be bypassed by experienced users (e.g., removing extension via `chrome://extensions`)
- **DO NOT** use to protect sensitive or critical data
- Only suitable for personal self-control purposes

### Pinned Tabs Will Be Lost
> **⚠️ WARNING**: When using this extension, **ALL PINNED TABS WILL BE LOST** when reopening the browser!
> 
> The extension closes all tabs and only displays the lockscreen on startup. If you frequently use pinned tabs, please consider carefully before installing.

### Cannot Completely Block Extension Removal
Due to Chrome's security policies, the extension **CANNOT** prevent users from removing it via:
- Chrome Menu → Extensions → Manage Extensions
- Right-click extension icon → Manage Extensions
- Direct access to `chrome://extensions` (blocked but other methods exist)

## 🛠️ Installation

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in the list and automatically open the password setup page

## 📁 File Structure

```
chrome-locker/
├── manifest.json
├── popup.html
├── lockscreen.html
├── options.html
├── assets/
│   ├── css/
│   │   ├── popup.css
│   │   ├── lockscreen.css
│   │   └── options.css
│   ├── js/
│   │   ├── popup.js
│   │   ├── lockscreen.js
│   │   ├── options.js
│   │   ├── background.js
│   │   └── content.js
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
└── README.md
```

## ⚙️ Configuration

### First-time Password Setup

When installing the extension for the first time:
1. The settings page will automatically open
2. Enter your new password and confirm
3. Click "Save Changes"
4. Browser will automatically exit after 3 seconds
5. Reopen browser → Enter password to use

### Change Password

**Method 1: Via Options Page**
1. Right-click the extension icon
2. Select "Options"
3. Enter current password
4. Enter new password and confirm
5. Click "Save Changes"

**Method 2: Via Console (if password forgotten)**
1. Open DevTools (F12)
2. Go to Console tab
3. Run command:

```javascript
chrome.storage.local.set({ lockerPassword: "new_password" });
```

### Reset Extension

To reset to initial state (clear password):

```javascript
chrome.storage.local.clear();
```

## 🎮 Usage

1. **Browser Startup**: Lockscreen will automatically display
2. **Enter Password**: Type your password
3. **Access Granted**: After correct entry, redirects to new tab
4. **Wrong Entry**: Must wait 5 seconds before trying again

## 🛡️ Security Features

✅ **Secure Storage**: Uses Chrome Storage API (not plain text)  
✅ **Local Only**: No data sent to external servers  
✅ **Limited Scope**: Only affects extension, not web pages  
✅ **Basic Bypass Protection**: Disables common developer shortcuts  
✅ **Right-click Protection**: Context menu disabled in lockscreen  
✅ **Focus Management**: Prevents easy navigation away from password field

## 🐛 Troubleshooting

### Forgot Password

**Method 1: View current password**
```javascript
chrome.storage.local.get(['lockerPassword'], console.log)
```

**Method 2: Set new password**
```javascript
chrome.storage.local.set({ lockerPassword: "new_password" });
```

### Extension Not Working

- Check if extension is enabled in `chrome://extensions/`
- Try disabling and re-enabling the extension
- Check console for errors (F12)
- Reload the extension

### Lockscreen Not Showing

- Clear browser cache and cookies
- Check if content script is properly injected
- Verify storage permissions are granted

## 🔒 Permissions Explained

- **storage**: Store password and settings locally
- **tabs**: Manage browser tabs
- **activeTab**: Access current tab information
- **webNavigation**: Monitor navigation events
- **scripting**: Inject content scripts

## 🤝 Contributing

All contributions are welcome!

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Test thoroughly across different Chrome versions
- Update documentation for new features
- Ensure backward compatibility when possible

## 📞 Contact

- **Email**: qckhanh205@gmail.com
- **Issues**: [GitHub Issues](https://github.com/qckhanh195)
- **Website**: [https://qckhanh.id.vn/](https://qckhanh.id.vn/)

## 📚 Technical Details

### Browser Compatibility

- Chrome 88+ (Manifest V3 support required)
- Chromium-based browsers (Edge, Brave, etc.)

### Performance

- Lightweight footprint (~50KB total)
- Minimal CPU usage
- No background network activity
- Fast startup time

### Architecture

- Manifest V3 service worker
- Modern ES6+ JavaScript
- CSS3 animations and transitions
- Local storage only (no external dependencies)

---

> 😄 Thank you for your interest and support. 💖
>
> ✨ This extension was created with the companionship and efforts of my AI assistant — claude.ai :D

<p align="center">
  🚀 <b>Built with Vibe Code</b> 🤖
</p>
