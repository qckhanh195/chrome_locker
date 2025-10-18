# Browser Locker Extension

## 📝 Description

Browser Locker is a simple Chrome Extension designed to protect your privacy by requiring a password for access. The extension acts as an additional security layer for your browser without interfering with normal web browsing activities.

## ✨ Features

  🔐 **Password Protection**: Requires password authentication for access  
  🎨 **Beautiful UI**: Modern design with smooth animations and particle effects  
  📊 **Attempt Tracking**: Display number of failed password attempts  
  🚫 **Shortcut Prevention**: Blocks F12, Ctrl+Shift+I, Ctrl+U in security popup  
  🖱️ **Right-click Protection**: Disables context menu in security popup only  
  ⚡ **Non-intrusive**: Doesn't interfere with normal website functionality  
  🔄 **Auto Focus**: Automatically focuses on password input field  
  🎯 **Unlimited Attempts**: No lockout mechanism - try as many times as needed  

## 🛠️ Installation

### Manual Installation (Developer Mode)

1. Download or clone this repository  
2. Open Chrome and navigate to `chrome://extensions/`  
3. Enable "Developer mode" in the top right corner  
4. Click "Load unpacked" and select the extension folder  
5. The extension will appear in your extensions list and toolbar  

## 📁 File Structure

```
chrome-lock-extension/
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

### Change Default Password

The default password is `123456`. To change it:

1. Open Chrome DevTools (F12)  
2. Go to Console tab  
3. Run the command:

```javascript
chrome.storage.local.set({ lockerPassword: "your_new_password" });
```

### Alternative Method via Options Page

1. Right-click the extension icon  
2. Select "Options"  
3. Enter your new password  
4. Click "Save"  

### Reset Extension

To reset to initial state:

```javascript
chrome.storage.local.clear();
```

## 🎮 Usage

1. **Activation**: Click the Browser Locker icon in your toolbar  
2. **Enter Password**: Type your password in the popup that appears  
3. **Access Granted**: After correct password entry, popup closes and normal browsing resumes  
4. **Security Features**: The popup blocks common shortcuts and right-click for enhanced security  

## 🔧 Customization

### Modify Interface

Edit `popup.css` and related files to customize:

- Color schemes and themes  
- Font families and sizes  
- Animation effects and transitions  
- Popup dimensions and layout  

### Add Features

Modify `popup.js` to:

- Add new authentication logic  
- Customize success/error messages  
- Change post-authentication behavior  
- Implement additional security measures  

## 🛡️ Security Features

✅ **Secure Storage**: Uses Chrome Storage API (not plain text)  
✅ **Local Only**: No data sent to external servers  
✅ **Limited Scope**: Only affects extension popup, not web pages  
✅ **Basic Bypass Protection**: Disables common developer shortcuts  
✅ **Right-click Protection**: Context menu disabled in security popup  
✅ **Focus Management**: Prevents easy navigation away from password field  

## ❗ Important Notes

- This extension is **NOT** a replacement for official security measures  
- Provides basic protection and can be bypassed by experienced users  
- Not intended for protecting sensitive or critical data  
- May not function properly in certain edge cases or browser configurations  

## 🐛 Troubleshooting

### Popup Not Displaying

- Check if extension is enabled in `chrome://extensions/`  
- Try disabling and re-enabling the extension  
- Check browser console for errors (F12)  

### Forgot Password

- Open DevTools and run:  
  `chrome.storage.local.get(['lockerPassword'], console.log)`  
- Or reset to default:  
  `chrome.storage.local.set({ lockerPassword: "123456" })`  

### Extension Not Working

- Verify Manifest V3 compatibility  
- Check Chrome Extensions page for errors  
- Try reloading the extension  
- Ensure all required permissions are granted  

### Lock Screen Issues

- Clear browser cache and cookies  
- Check if content script is properly injected  
- Verify storage permissions are granted  

## 🔒 Permissions Explained

- **storage**: Store password and settings locally  
- **tabs**: Manage browser tabs (if needed)  
- **activeTab**: Access current tab information  

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
> ✨ This extension was created with the companionship and efforts of my assistant — Claude :D 🤖
