// Background.js - Enhanced Security Version
// Prevents all bypass methods including chrome:// URLs and extension management

let lockscreenTabId = null;

chrome.runtime.onStartup.addListener(async () => {
  chrome.storage.local.set({ accessGranted: false });
  
  // Kiểm tra xem đã có mật khẩu chưa
  const result = await chrome.storage.local.get(['lockerPassword']);
  
  if (result.lockerPassword) {
    // Đã có mật khẩu → mở lockscreen
    redirectToLockscreen();
  } else {
    // Chưa có mật khẩu → mở trang cài đặt
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html?firstTime=true") });
  }
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Lần đầu cài đặt - không có mật khẩu
    // Đặt accessGranted = true để cho phép mở options page
    await chrome.storage.local.set({ 
      accessGranted: true, // Cho phép truy cập để mở options
      failedAttempts: 0,
      lockoutTime: 0
    });
    
    console.log('First install - opening options page');
    
    // Mở trang thiết lập mật khẩu
    chrome.tabs.create({ 
      url: chrome.runtime.getURL("options.html?firstTime=true"),
      active: true 
    });
  } else if (details.reason === 'update') {
    // Cập nhật extension - kiểm tra xem có mật khẩu không
    const result = await chrome.storage.local.get(['lockerPassword']);
    
    await chrome.storage.local.set({ 
      accessGranted: false,
      failedAttempts: 0,
      lockoutTime: 0
    });
    
    if (result.lockerPassword) {
      // Có mật khẩu → mở lockscreen
      redirectToLockscreen();
    } else {
      // Không có mật khẩu → mở trang cài đặt
      chrome.tabs.create({ url: chrome.runtime.getURL("options.html?firstTime=true") });
    }
  }
});

// Redirect to lockscreen and close all other tabs
async function redirectToLockscreen() {
  // Kiểm tra xem đã có mật khẩu chưa
  const result = await chrome.storage.local.get(['lockerPassword']);
  
  if (!result.lockerPassword) {
    // Chưa có mật khẩu, không redirect về lockscreen
    console.log('No password set, skipping lockscreen redirect');
    return;
  }
  
  chrome.tabs.query({}, function (tabs) {
    if (tabs.length > 0) {
      lockscreenTabId = tabs[0].id;
      chrome.tabs.update(tabs[0].id, { url: chrome.runtime.getURL("lockscreen.html") });
      // Close all other tabs
      for (let i = 1; i < tabs.length; i++) {
        chrome.tabs.remove(tabs[i].id);
      }
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL("lockscreen.html") }, (tab) => {
        lockscreenTabId = tab.id;
      });
    }
  });
}

// List of blocked URLs when locked
const BLOCKED_URLS = [
  'chrome://',
  'chrome-extension://',
  'edge://',
  'about:',
  'chrome.google.com/webstore',
  'microsoftedge.microsoft.com/addons'
];

// Check if URL should be blocked
function isBlockedUrl(url) {
  if (!url) return false;
  
  // Allow our own lockscreen
  if (url.includes('lockscreen.html')) return false;
  
  // Block all chrome:// and extension management URLs
  return BLOCKED_URLS.some(blocked => url.startsWith(blocked));
}

// Inject content script only when locked
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['assets/js/content.js']
    });
  } catch (e) {
    console.log('Cannot inject script:', e);
  }
}

// Check if tab needs protection
async function checkAndProtectTab(tabId, url) {
  const result = await chrome.storage.local.get(['accessGranted', 'lockerPassword']);
  
  // Cho phép mở options.html khi chưa có mật khẩu
  if (!result.lockerPassword && url && url.includes('options.html')) {
    return; // Không redirect, cho phép mở trang cài đặt
  }
  
  // If not granted access, block everything except lockscreen
  if (!result.accessGranted) {
    // If trying to access blocked URL, redirect to lockscreen
    if (isBlockedUrl(url)) {
      chrome.tabs.update(tabId, { url: chrome.runtime.getURL("lockscreen.html") });
      return;
    }
    
    // If not on lockscreen, redirect to lockscreen
    if (!url.includes('lockscreen.html')) {
      chrome.tabs.update(tabId, { url: chrome.runtime.getURL("lockscreen.html") });
      return;
    }
  }
}

// Monitor ALL navigation attempts - BEFORE they happen
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return; // Only main frame
  
  const result = await chrome.storage.local.get(['accessGranted', 'lockerPassword']);
  
  // Cho phép navigation đến options.html khi chưa có mật khẩu
  if (!result.lockerPassword && details.url && details.url.includes('options.html')) {
    return;
  }
  
  if (!result.accessGranted) {
    // Block navigation to any URL except lockscreen
    if (!details.url.includes('lockscreen.html')) {
      chrome.tabs.update(details.tabId, { url: chrome.runtime.getURL("lockscreen.html") });
    }
  }
});

// Monitor navigation commits
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return; // Only main frame
  
  const result = await chrome.storage.local.get(['lockerPassword']);
  // Cho phép navigation đến options.html khi chưa có mật khẩu
  if (!result.lockerPassword && details.url && details.url.includes('options.html')) {
    return;
  }
  
  await checkAndProtectTab(details.tabId, details.url);
});

// Monitor new tabs - IMMEDIATELY redirect to lockscreen
chrome.tabs.onCreated.addListener(async (tab) => {
  const result = await chrome.storage.local.get(['accessGranted', 'lockerPassword']);
  
  // Cho phép mở options.html khi chưa có mật khẩu
  if (!result.lockerPassword && tab.url && tab.url.includes('options.html')) {
    return; // Không redirect, cho phép mở trang cài đặt
  }
  
  if (!result.accessGranted) {
    // Immediately redirect any new tab to lockscreen
    chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("lockscreen.html") });
  }
});

// Monitor tab updates - Block any URL changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const result = await chrome.storage.local.get(['accessGranted', 'lockerPassword']);
  
  // Cho phép mở options.html khi chưa có mật khẩu
  if (!result.lockerPassword && changeInfo.url && changeInfo.url.includes('options.html')) {
    return; // Không redirect, cho phép mở trang cài đặt
  }
  
  if (!result.accessGranted) {
    // If URL is changing, check if it should be blocked
    if (changeInfo.url) {
      if (isBlockedUrl(changeInfo.url) || !changeInfo.url.includes('lockscreen.html')) {
        chrome.tabs.update(tabId, { url: chrome.runtime.getURL("lockscreen.html") });
      }
    }
  }
});

// Prevent closing the lockscreen tab
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const result = await chrome.storage.local.get(['accessGranted', 'lockerPassword']);
  
  if (!result.accessGranted) {
    // Nếu chưa có mật khẩu, không tạo lại lockscreen
    if (!result.lockerPassword) {
      return;
    }
    
    // If lockscreen tab was closed, create a new one
    if (tabId === lockscreenTabId) {
      chrome.tabs.create({ url: chrome.runtime.getURL("lockscreen.html") }, (tab) => {
        lockscreenTabId = tab.id;
      });
    }
    
    // Check if there are any tabs left
    chrome.tabs.query({}, (tabs) => {
      if (tabs.length === 0) {
        // No tabs left, create lockscreen
        chrome.tabs.create({ url: chrome.runtime.getURL("lockscreen.html") }, (tab) => {
          lockscreenTabId = tab.id;
        });
      }
    });
  }
});

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "resetFailedAttempts") {
    chrome.storage.local.set({ failedAttempts: 0 });
    sendResponse({ success: true });
  }
  return true;
});

// Aggressive periodic check - Ensure lockscreen is always active
setInterval(async () => {
  const result = await chrome.storage.local.get(['accessGranted', 'lockerPassword']);
  
  if (!result.accessGranted) {
    const tabs = await chrome.tabs.query({});
    
    // Nếu chưa có mật khẩu, không tạo lockscreen
    if (!result.lockerPassword) {
      return;
    }
    
    // If no tabs exist, create lockscreen
    if (tabs.length === 0) {
      chrome.tabs.create({ url: chrome.runtime.getURL("lockscreen.html") }, (tab) => {
        lockscreenTabId = tab.id;
      });
      return;
    }
    
    // Check all tabs
    let hasLockscreen = false;
    let hasOptionsPage = false;
    
    for (const tab of tabs) {
      if (tab.url && tab.url.includes('lockscreen.html')) {
        hasLockscreen = true;
        lockscreenTabId = tab.id;
      } else if (tab.url && tab.url.includes('options.html')) {
        // Nếu chưa có mật khẩu, cho phép giữ trang options
        if (!result.lockerPassword) {
          hasOptionsPage = true;
        } else {
          // Đã có mật khẩu, redirect về lockscreen
          chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("lockscreen.html") });
        }
      } else if (tab.url) {
        // Any tab that's not lockscreen or options should be redirected
        chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("lockscreen.html") });
      }
    }
    
    // If no lockscreen tab exists and not first time, create one
    if (!hasLockscreen && !hasOptionsPage) {
      chrome.tabs.create({ url: chrome.runtime.getURL("lockscreen.html") }, (tab) => {
        lockscreenTabId = tab.id;
      });
    }
  }
}, 2000); // Check every 2 seconds