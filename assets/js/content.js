// Enhanced content.js - Fixed random div IDs
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
    overlayElement.setAttribute('data-extension', 'chrome-lock'); // Đánh dấu rõ ràng
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
    
    // Tạo container với ID cố định
    const container = document.createElement('div');
    container.id = 'chrome-lock-content';
    container.setAttribute('data-extension', 'chrome-lock');
    container.style.cssText = 'text-align: center; animation: pulse 2s infinite;';
    
    // Tạo icon với ID cố định
    const icon = document.createElement('div');
    icon.id = 'chrome-lock-icon';
    icon.style.cssText = 'font-size: 5rem; margin-bottom: 30px;';
    icon.textContent = '🔒';
    
    // Tạo title với ID cố định
    const title = document.createElement('h1');
    title.id = 'chrome-lock-title';
    title.style.cssText = 'font-size: 2.5rem; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);';
    title.textContent = 'Trình Duyệt Đã Được Khóa';
    
    // Tạo description với ID cố định
    const description = document.createElement('p');
    description.id = 'chrome-lock-description';
    description.style.cssText = 'font-size: 1.2rem; opacity: 0.9; margin-bottom: 30px; line-height: 1.6;';
    description.innerHTML = 'Chrome hiện đang được bảo vệ bởi Chrome Lock Extension.<br>Bạn cần mở khóa để có thể truy cập các trang web.';
    
    // Tạo button với ID cố định
    const button = document.createElement('button');
    button.id = 'chrome-lock-redirect-btn';
    button.style.cssText = `
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 15px 30px;
      font-size: 16px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 20px;
    `;
    button.textContent = '📱 Đi đến trang khóa';
    
    button.addEventListener('click', () => {
      window.location.href = chrome.runtime.getURL("lockscreen.html");
    });
    
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(255, 255, 255, 0.3)';
      button.style.borderColor = 'rgba(255, 255, 255, 0.5)';
      button.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(255, 255, 255, 0.2)';
      button.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      button.style.transform = 'translateY(0)';
    });
    
    // Thêm CSS animation
    const style = document.createElement('style');
    style.id = 'chrome-lock-styles';
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
    
    // Ghép các element lại
    container.appendChild(icon);
    container.appendChild(title);
    container.appendChild(description);
    container.appendChild(button);
    
    overlayElement.appendChild(container);
    document.head.appendChild(style);
    
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

    // Xóa overlay cũ nếu có
    removeAllLockElements();
    
    const overlay = createFullScreenOverlay();
    
    if (document.body) {
      document.body.appendChild(overlay);
    } else if (document.documentElement) {
      document.documentElement.appendChild(overlay);
    }
    
    // Ẩn nội dung trang
    const allElements = document.querySelectorAll('body > *:not(#chrome-lock-overlay)');
    allElements.forEach(el => {
      if (el.id !== 'chrome-lock-overlay' && !el.hasAttribute('data-extension')) {
        el.style.setProperty('display', 'none', 'important');
      }
    });
    
    startDOMProtection();
  }
  
  function removeAllLockElements() {
    // Xóa tất cả element của extension
    const lockOverlay = document.getElementById('chrome-lock-overlay');
    if (lockOverlay) lockOverlay.remove();
    
    const lockStyles = document.getElementById('chrome-lock-styles');
    if (lockStyles) lockStyles.remove();
    
    // Xóa các div rác có thể còn sót lại
    document.querySelectorAll('[data-extension="chrome-lock"]').forEach(el => el.remove());
  }
  
  function removeLockOverlay() {
    removeAllLockElements();
    overlayElement = null;
    isInjected = false;
    
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    
    // Khôi phục hiển thị trang
    const allElements = document.querySelectorAll('body > *');
    allElements.forEach(el => {
      if (el.style.display === 'none') {
        el.style.removeProperty('display');
      }
    });
  }
  
  function startDOMProtection() {
    if (observer) observer.disconnect();
    
    observer = new MutationObserver(function(mutations) {
      checkAccessStatus((granted) => {
        if (!granted) {
          // Đảm bảo overlay vẫn tồn tại
          if (!document.getElementById('chrome-lock-overlay')) {
            const overlay = createFullScreenOverlay();
            if (document.body) {
              document.body.appendChild(overlay);
            }
          }
          
          // Xóa các element không phải của extension
          mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1 && 
                  !node.hasAttribute('data-extension') &&
                  node.id !== 'chrome-lock-overlay' &&
                  !document.getElementById('chrome-lock-overlay')?.contains(node)) {
                node.style.setProperty('display', 'none', 'important');
              }
            });
          });
        }
      });
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
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
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    removeAllLockElements();
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