// Background.js - Inject content script only when needed
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.set({ accessGranted: false });
  redirectToLockscreen();
});

chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.local.set({ 
    lockerPassword: "123456", 
    accessGranted: false,
    failedAttempts: 0,
    lockoutTime: 0
  });
  
  if (details.reason === 'install') {
    redirectToLockscreen();
  }
});

function redirectToLockscreen() {
  chrome.tabs.query({}, function (tabs) {
    if (tabs.length > 0) {
      chrome.tabs.update(tabs[0].id, { url: chrome.runtime.getURL("lockscreen.html") });
      for (let i = 1; i < tabs.length; i++) {
        chrome.tabs.remove(tabs[i].id);
      }
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL("lockscreen.html") });
    }
  });
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
  // Skip extension pages and chrome:// URLs
  if (!url || 
      url.startsWith('chrome://') || 
      url.startsWith('chrome-extension://') ||
      url.startsWith('about:')) {
    return;
  }
  
  const result = await chrome.storage.local.get(['accessGranted']);
  
  if (!result.accessGranted) {
    // Only inject if not already on lockscreen
    if (!url.includes('lockscreen.html')) {
      await injectContentScript(tabId);
    }
  }
}

// Monitor navigation
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return; // Only main frame
  
  await checkAndProtectTab(details.tabId, details.url);
});

// Monitor new tabs
chrome.tabs.onCreated.addListener(async (tab) => {
  const result = await chrome.storage.local.get(['accessGranted']);
  
  if (!result.accessGranted) {
    chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("lockscreen.html") });
  }
});

// Monitor tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && changeInfo.url) {
    await checkAndProtectTab(tabId, changeInfo.url);
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

// Periodic check - Less aggressive
setInterval(async () => {
  const result = await chrome.storage.local.get(['accessGranted']);
  
  if (!result.accessGranted) {
    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
      if (tab.url && 
          !tab.url.startsWith('chrome://') &&
          !tab.url.startsWith('chrome-extension://') &&
          !tab.url.includes('lockscreen.html')) {
        
        // Send message to existing content scripts
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'recheckLock' });
        } catch (e) {
          // If no content script, inject it
          await injectContentScript(tab.id);
        }
      }
    }
  }
}, 5000); // Check every 5 seconds instead of 2