// Content.js - Enhanced security with immediate blocking
(function() {
  'use strict';

  let overlayElement = null;
  let isCurrentlyLocked = false;
  let rightClickHandler = null;
  let keydownHandler = null;
  let selectHandler = null;
  
  // Check if we should run at all
  function shouldActivate() {
    // Don't activate on extension pages
    const url = window.location.href;
    if (url.startsWith('chrome-extension://') || 
        url.startsWith('chrome://') ||
        url.startsWith('about:')) {
      // If we're on a blocked page and locked, redirect immediately
      checkAccessStatus((granted) => {
        if (!granted && !url.includes('src/html/lockscreen.html')) {
          window.location.href = chrome.runtime.getURL("src/html/lockscreen.html");
        }
      });
      return false;
    }
    return true;
  }
  
  // Check access status
  function checkAccessStatus(callback) {
    try {
      chrome.storage.local.get(["accessGranted"], function(result) {
        if (chrome.runtime.lastError) {
          callback(false);
          return;
        }
        callback(result.accessGranted || false);
      });
    } catch (e) {
      callback(false);
    }
  }
  
  // Create overlay
  function createOverlay() {
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
    `;
    
    overlayElement.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 5rem; margin-bottom: 30px;">🔒</div>
        <h1 style="font-size: 2.5rem; margin-bottom: 20px;">Trình Duyệt Đã Được Khóa</h1>
        <p style="font-size: 1.2rem; opacity: 0.9; margin-bottom: 30px;">
          Chrome hiện đang được bảo vệ.<br>Bạn cần mở khóa để truy cập.
        </p>
        <button id="lockRedirectBtn" style="
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 15px 30px;
          font-size: 16px;
          border-radius: 10px;
          cursor: pointer;
        ">📱 Đi đến trang khóa</button>
      </div>
    `;
    
    const btn = overlayElement.querySelector('#lockRedirectBtn');
    if (btn) {
      btn.onclick = () => {
        window.location.href = chrome.runtime.getURL("src/html/lockscreen.html");
      };
    }
    
    return overlayElement;
  }
  
  // Activate lock mode
  function activateLockMode() {
    if (isCurrentlyLocked) return;
    isCurrentlyLocked = true;
    
    // Create and show overlay
    const overlay = createOverlay();
    if (!document.body) {
      setTimeout(() => activateLockMode(), 100);
      return;
    }
    document.body.appendChild(overlay);
    
    // Block right-click
    rightClickHandler = function(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    document.addEventListener('contextmenu', rightClickHandler, true);
    
    // Block keyboard shortcuts
    keydownHandler = function(e) {
      const blocked = [
        { key: 'F12' },
        { ctrl: true, shift: true, key: 'I' },
        { ctrl: true, shift: true, key: 'J' },
        { ctrl: true, key: 'U' },
        { ctrl: true, key: 'T' }, // New tab
        { ctrl: true, key: 'N' }, // New window
        { ctrl: true, key: 'W' }, // Close tab
        { alt: true, key: 'F4' }, // Close window
        { alt: true, key: 'Home' }, // Home
        { ctrl: true, key: 'L' }, // Address bar
        { ctrl: true, key: 'K' }, // Address bar (alternate)
      ];
      
      const isBlocked = blocked.some(s => {
        return (!s.ctrl || e.ctrlKey) &&
               (!s.shift || e.shiftKey) &&
               (!s.alt || e.altKey) &&
               (e.key === s.key || e.key === s.key.toLowerCase());
      });
      
      if (isBlocked) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    document.addEventListener('keydown', keydownHandler, true);
    
    // Block text selection
    selectHandler = function(e) {
      e.preventDefault();
      return false;
    };
    document.addEventListener('selectstart', selectHandler);
    
    // Prevent navigation
    window.addEventListener('beforeunload', function(e) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    });
  }
  
  // Deactivate lock mode - RESTORE EVERYTHING
  function deactivateLockMode() {
    if (!isCurrentlyLocked) return;
    isCurrentlyLocked = false;
    
    // Remove overlay
    if (overlayElement && overlayElement.parentNode) {
      overlayElement.parentNode.removeChild(overlayElement);
    }
    overlayElement = null;
    
    // Remove ALL event listeners
    if (rightClickHandler) {
      document.removeEventListener('contextmenu', rightClickHandler, true);
      rightClickHandler = null;
    }
    
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler, true);
      keydownHandler = null;
    }
    
    if (selectHandler) {
      document.removeEventListener('selectstart', selectHandler);
      selectHandler = null;
    }
    
    // Clean up any remaining elements
    const lockElements = document.querySelectorAll('[id^="chrome-lock"]');
    lockElements.forEach(el => el.remove());
  }
  
  // Main check function
  function checkAndApply() {
    if (!shouldActivate()) return;
    
    checkAccessStatus((granted) => {
      if (granted) {
        // UNLOCKED - Deactivate everything
        deactivateLockMode();
      } else {
        // LOCKED - Activate protection
        activateLockMode();
      }
    });
  }
  
  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.accessGranted) {
      checkAndApply();
    }
  });
  
  // Listen for messages
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'recheckLock') {
      checkAndApply();
    }
  });
  
  // Initial check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndApply);
  } else {
    checkAndApply();
  }
  
  // Periodic check (less frequent)
  setInterval(checkAndApply, 3000);
  
})();