// Enhanced content.js with full-screen overlay protection
(function() {
  'use strict';

  let isInjected = false;
  let observer = null;
  let overlayElement = null;
  
  function createFullScreenOverlay() {
    if (overlayElement) return overlayElement;
    
    // Create overlay that covers entire browser window
    overlayElement = document.createElement('div');
    overlayElement.id = 'chrome-lock-overlay';
    overlayElement.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      z-index: 2147483647 !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      font-family: 'Segoe UI', sans-serif !important;
      color: white !important;
      overflow: hidden !important;
      user-select: none !important;
      pointer-events: all !important;
    `;
    
    overlayElement.innerHTML = `
      <div style="text-align: center; animation: pulse 2s infinite;">
        <div style="font-size: 5rem; margin-bottom: 30px;">🔒</div>
        <h1 style="font-size: 2.5rem; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
          Trình Duyệt Đã Được Khóa
        </h1>
        <p style="font-size: 1.2rem; opacity: 0.9; margin-bottom: 30px; line-height: 1.6;">
          Chrome hiện đang được bảo vệ bởi Chrome Lock Extension.<br>
          Bạn cần mở khóa để có thể truy cập các trang web.
        </p>
        <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 15px; margin: 20px 0;">
          <p style="margin-bottom: 15px;"><strong>🚫 Không thể gỡ bỏ extension khi đang khóa</strong></p>
          <p style="font-size: 0.9rem; opacity: 0.8;">
            Extension sẽ tự động khôi phục ngay cả khi bị vô hiệu hóa<br>
            Vui lòng nhập mật khẩu chính xác để tiếp tục
          </p>
        </div>
        <button id="redirectToLock" style="
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 15px 30px;
          font-size: 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 20px;
        ">
          📱 Đi đến trang khóa
        </button>
      </div>
      
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        #redirectToLock:hover {
          background: rgba(255, 255, 255, 0.3) !important;
          border-color: rgba(255, 255, 255, 0.5) !important;
          transform: translateY(-2px);
        }
      </style>
    `;
    
    // Add click handler for redirect button
    const redirectBtn = overlayElement.querySelector('#redirectToLock');
    redirectBtn.addEventListener('click', () => {
      window.location.href = chrome.runtime.getURL("lockscreen.html");
    });
    
    // Prevent any interaction with underlying page
    overlayElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
    
    overlayElement.addEventListener('keydown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
    
    overlayElement.addEventListener('click', (e) => {
      if (e.target !== redirectBtn) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    
    return overlayElement;
  }
  
  function injectFullScreenLock() {
    if (isInjected) return;
    isInjected = true;

    // First method: Replace entire page
    try {
      document.documentElement.innerHTML = '';
    } catch (e) {
      console.log('Cannot replace HTML, using overlay method');
    }
    
    // Second method: Create full-screen overlay
    const overlay = createFullScreenOverlay();
    
    // Try multiple insertion methods
    if (document.body) {
      document.body.appendChild(overlay);
    } else if (document.documentElement) {
      document.documentElement.appendChild(overlay);
    } else {
      // If neither exists, create them
      const html = document.createElement('html');
      const body = document.createElement('body');
      body.appendChild(overlay);
      html.appendChild(body);
      document.appendChild(html);
    }
    
    // Hide all other content
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.id !== 'chrome-lock-overlay' && !overlay.contains(el)) {
        el.style.display = 'none';
      }
    });
    
    // Override document styles
    const style = document.createElement('style');
    style.innerHTML = `
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
        background: #667eea !important;
      }
      * {
        user-select: none !important;
      }
      #chrome-lock-overlay * {
        user-select: auto !important;
      }
    `;
    document.head.appendChild(style);
    
    startDOMProtection();
  }
  
  function startDOMProtection() {
    // Monitor for any attempts to modify the DOM
    if (observer) observer.disconnect();
    
    observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        // If overlay is removed, recreate it immediately
        if (!document.getElementById('chrome-lock-overlay')) {
          const overlay = createFullScreenOverlay();
          document.body.appendChild(overlay);
        }
        
        // Hide any new elements that aren't part of our overlay
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && 
                node.id !== 'chrome-lock-overlay' && 
                !overlayElement?.contains(node)) {
              node.style.display = 'none';
            }
          });
        }
      });
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true
    });
  }
  
  // Enhanced protection against extension removal
  function protectExtension() {
    // Monitor extension management pages
    const protectedUrls = [
      'chrome://extensions/',
      'chrome://extensions-internals/',
      'chrome://settings/',
      'edge://extensions/',
      'edge://settings/'
    ];
    
    if (protectedUrls.some(url => window.location.href.includes(url.replace('chrome://', '').replace('edge://', '')))) {
      // Redirect away from extension management
      window.location.href = chrome.runtime.getURL("lockscreen.html");
      return;
    }
    
    // Continuous check for extension status
    setInterval(() => {
      chrome.storage.local.get(["accessGranted"], function(result) {
        if (chrome.runtime.lastError) {
          // Extension might be disabled, show warning
          document.body.innerHTML = `
            <div style="
              position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
              background: #dc3545; color: white; display: flex;
              justify-content: center; align-items: center; z-index: 9999999;
              font-family: Arial, sans-serif; text-align: center;
            ">
              <div>
                <h1>⚠️ CẢNH BÁO BẢO MẬT</h1>
                <p style="font-size: 18px; margin: 20px 0;">
                  Chrome Lock Extension đã bị vô hiệu hóa hoặc gỡ bỏ!<br>
                  Trình duyệt hiện không được bảo vệ.
                </p>
                <p style="font-size: 14px; opacity: 0.9;">
                  Vui lòng kích hoạt lại extension để tiếp tục bảo mật.
                </p>
              </div>
            </div>
          `;
          return;
        }
        
        if (!result.accessGranted) {
          // Make sure overlay is still present
          if (!document.getElementById('chrome-lock-overlay')) {
            injectFullScreenLock();
          }
        }
      });
    }, 1000);
  }
  
  // Check access status and inject lock screen if needed
  function checkAndLock() {
    chrome.storage.local.get(["accessGranted", "lockoutTime"], function(result) {
      if (chrome.runtime.lastError) {
        // Extension communication failed
        injectFullScreenLock();
        return;
      }
      
      const isLockedOut = result.lockoutTime && Date.now() < result.lockoutTime;
      
      if (!result.accessGranted || isLockedOut) {
        injectFullScreenLock();
      }
    });
  }
  
  // Initialize protection
  checkAndLock();
  protectExtension();
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndLock);
  }
  
  // Block attempts to navigate to extension management
  window.addEventListener('beforeunload', function(e) {
    chrome.storage.local.get(["accessGranted"], function(result) {
      if (!result.accessGranted) {
        e.preventDefault();
        e.returnValue = 'Trình duyệt đang bị khóa';
        return 'Trình duyệt đang bị khóa';
      }
    });
  });
  
  // Block developer tools more aggressively  
  let devtools = { open: false };
  const threshold = 160;
  
  setInterval(function() {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        window.location.href = chrome.runtime.getURL("lockscreen.html");
      }
    } else {
      devtools.open = false;
    }
  }, 100); // Check more frequently
  
  // Enhanced keyboard blocking
  document.addEventListener('keydown', function(e) {
    // Block more shortcuts
    const blockedShortcuts = [
      { key: 'F12' }, // Dev tools
      { ctrl: true, shift: true, key: 'I' }, // Dev tools
      { ctrl: true, shift: true, key: 'J' }, // Console
      { ctrl: true, key: 'U' }, // View source
      { ctrl: true, shift: true, key: 'C' }, // Inspect
      { ctrl: true, key: 'S' }, // Save
      { key: 'F5' }, // Refresh
      { ctrl: true, key: 'R' }, // Refresh
      { ctrl: true, shift: true, key: 'R' }, // Hard refresh
      { alt: true, key: 'F4' }, // Close window
      { ctrl: true, key: 'W' }, // Close tab
      { ctrl: true, shift: true, key: 'T' }, // Reopen tab
      { ctrl: true, key: 'T' }, // New tab
      { ctrl: true, key: 'N' }, // New window
      { ctrl: true, shift: true, key: 'N' }, // Incognito
      { ctrl: true, key: 'L' }, // Address bar
      { alt: true, key: 'D' }, // Address bar
      { ctrl: true, key: 'E' }, // Address bar
      { ctrl: true, key: 'K' }, // Search bar
    ];
    
    const isBlocked = blockedShortcuts.some(shortcut => {
      return (!shortcut.ctrl || e.ctrlKey) &&
             (!shortcut.shift || e.shiftKey) &&
             (!shortcut.alt || e.altKey) &&
             (e.key === shortcut.key || e.keyCode === shortcut.keyCode);
    });
    
    if (isBlocked) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  }, true);
  
  // Block right-click more aggressively
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  }, true);
  
  // Block text selection
  document.addEventListener('selectstart', function(e) {
    if (!e.target.closest('#chrome-lock-overlay')) {
      e.preventDefault();
      return false;
    }
  });
  
  // Monitor for extension changes
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'recheckLock') {
      checkAndLock();
    }
  });
  
})();