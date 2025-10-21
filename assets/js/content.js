// Enhanced content.js with conditional protection
(function() {
  'use strict';

  let isInjected = false;
  let observer = null;
  let overlayElement = null;
  let isAccessGranted = false;
  
  // Check access status from storage
  function checkAccessStatus(callback) {
    chrome.storage.local.get(["accessGranted"], function(result) {
      if (chrome.runtime.lastError) {
        callback(false);
        return;
      }
      callback(result.accessGranted || false);
    });
  }
  
  function createFullScreenOverlay() {
    if (overlayElement) return overlayElement;
    
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
    
    const redirectBtn = overlayElement.querySelector('#redirectToLock');
    redirectBtn.addEventListener('click', () => {
      window.location.href = chrome.runtime.getURL("lockscreen.html");
    });
    
    // Chặn chuột phải CHỈ trên overlay
    overlayElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);
    
    return overlayElement;
  }
  
  function injectFullScreenLock() {
    if (isInjected) return;
    isInjected = true;

    try {
      document.documentElement.innerHTML = '';
    } catch (e) {
      console.log('Cannot replace HTML, using overlay method');
    }
    
    const overlay = createFullScreenOverlay();
    
    if (document.body) {
      document.body.appendChild(overlay);
    } else if (document.documentElement) {
      document.documentElement.appendChild(overlay);
    }
    
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.id !== 'chrome-lock-overlay' && !overlay.contains(el)) {
        el.style.display = 'none';
      }
    });
    
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
    `;
    document.head.appendChild(style);
    
    startDOMProtection();
  }
  
  function removeLockOverlay() {
    if (overlayElement && overlayElement.parentNode) {
      overlayElement.parentNode.removeChild(overlayElement);
    }
    overlayElement = null;
    isInjected = false;
    
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    
    // Restore page visibility
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.style.display === 'none') {
        el.style.display = '';
      }
    });
  }
  
  function startDOMProtection() {
    if (observer) observer.disconnect();
    
    observer = new MutationObserver(function(mutations) {
      // Only protect if still locked
      checkAccessStatus((granted) => {
        if (!granted) {
          if (!document.getElementById('chrome-lock-overlay')) {
            const overlay = createFullScreenOverlay();
            document.body.appendChild(overlay);
          }
        }
      });
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true
    });
  }
  
  function checkAndLock() {
    checkAccessStatus((granted) => {
      isAccessGranted = granted;
      
      if (!granted) {
        injectFullScreenLock();
      } else {
        removeLockOverlay();
      }
    });
  }
  
  // CHỈ chặn phím tắt khi CHƯA mở khóa
  document.addEventListener('keydown', function(e) {
    checkAccessStatus((granted) => {
      if (!granted) {
        const blockedShortcuts = [
          { key: 'F12' },
          { ctrl: true, shift: true, key: 'I' },
          { ctrl: true, shift: true, key: 'J' },
          { ctrl: true, key: 'U' },
          { ctrl: true, shift: true, key: 'C' },
        ];
        
        const isBlocked = blockedShortcuts.some(shortcut => {
          return (!shortcut.ctrl || e.ctrlKey) &&
                 (!shortcut.shift || e.shiftKey) &&
                 (!shortcut.alt || e.altKey) &&
                 (e.key === shortcut.key);
        });
        
        if (isBlocked) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }
    });
  }, true);
  
  // CHỈ chặn chuột phải khi CHƯA mở khóa
  document.addEventListener('contextmenu', function(e) {
    checkAccessStatus((granted) => {
      if (!granted) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
      // Nếu đã mở khóa, CHO PHÉP chuột phải hoạt động bình thường
    });
  }, true);
  
  // CHỈ chặn select khi CHƯA mở khóa
  document.addEventListener('selectstart', function(e) {
    checkAccessStatus((granted) => {
      if (!granted && !e.target.closest('#chrome-lock-overlay')) {
        e.preventDefault();
        return false;
      }
    });
  });
  
  // Listen for access status changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.accessGranted) {
      isAccessGranted = changes.accessGranted.newValue;
      checkAndLock();
    }
  });
  
  // Monitor for extension changes
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'recheckLock') {
      checkAndLock();
    }
  });
  
  // Initial check
  checkAndLock();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndLock);
  }
  
  // Periodic check
  setInterval(() => {
    checkAndLock();
  }, 2000);
  
})();