// Enhanced background.js with improved security
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

// Enhanced navigation blocking
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  chrome.storage.local.get(["accessGranted", "lockoutTime"], (res) => {
    const url = details.url;
    const isInternal = url.startsWith("chrome-extension://");
    const isChromeUrl = url.startsWith("chrome://");
    const isBlocked = url.startsWith("chrome://extensions") || 
                     url.startsWith("chrome://settings") ||
                     url.startsWith("chrome://chrome-urls") ||
                     url.startsWith("chrome://flags");

    // Check if currently in lockout period
    if (res.lockoutTime && Date.now() < res.lockoutTime) {
      if (!url.startsWith(chrome.runtime.getURL(""))) {
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL("lockscreen.html")
        });
      }
      return;
    }

  });
});

chrome.tabs.onCreated.addListener((tab) => {
  chrome.storage.local.get(["accessGranted", "lockoutTime"], (res) => {
    if (res.lockoutTime && Date.now() < res.lockoutTime) {
      chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("lockscreen.html") });
    } else if (!res.accessGranted) {
      chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("lockscreen.html") });
    }
  });
});

// Block context menu when locked
chrome.storage.local.get("accessGranted", (res) => {
  if (!res.accessGranted) {
    chrome.contextMenus.removeAll();
  }
});

// Enhanced message handling
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "exitBrowser") {
//     chrome.tabs.query({}, (tabs) => {
//       tabs.forEach(tab => chrome.tabs.remove(tab.id));
//     });
//   } else if (message.action === "closeOptionsTab") {
//     // Close the options tab
//     chrome.tabs.query({ url: chrome.runtime.getURL("options.html") }, (tabs) => {
//       if (tabs.length > 0) {
//         chrome.tabs.remove(tabs[0].id);
//       }
//     });
//   } else if (message.action === "checkLockout") {
//     chrome.storage.local.get("lockoutTime", (res) => {
//       sendResponse({ 
//         isLocked: res.lockoutTime && Date.now() < res.lockoutTime,
//         remainingTime: res.lockoutTime ? Math.max(0, res.lockoutTime - Date.now()) : 0
//       });
//     });
//     return true; // Keep message channel open for async response
//   } else if (message.action === "incrementFailedAttempts") {
//     chrome.storage.local.get(["failedAttempts", "lockoutTime"], (res) => {
//       const attempts = (res.failedAttempts || 0) + 1;
//       let lockoutTime = res.lockoutTime || 0;
      
//       if (attempts >= 3) {
//         lockoutTime = Date.now() + (5 * 60 * 1000); // 5 minutes lockout
//         chrome.storage.local.set({ failedAttempts: 0, lockoutTime });
//       } else {
//         chrome.storage.local.set({ failedAttempts: attempts });
//       }
      
//       sendResponse({ attempts, lockoutTime });
//     });
//     return true;
//   } else if (message.action === "resetFailedAttempts") {
//     chrome.storage.local.set({ failedAttempts: 0, lockoutTime: 0 });
//   }
// });
// background.js - Đơn giản, không can thiệp trang web
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "resetFailedAttempts") {
    chrome.storage.local.set({ failedAttempts: 0 });
    sendResponse({ success: true });
  }
});

// Periodic check to ensure lock screen is active
setInterval(() => {
  chrome.storage.local.get(["accessGranted", "lockoutTime"], (res) => {
    if (!res.accessGranted || (res.lockoutTime && Date.now() < res.lockoutTime)) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (!tab.url.startsWith(chrome.runtime.getURL(""))) {
            chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("lockscreen.html") });
          }
        });
      });
    }
  });
}, 2000); // Check every 2 seconds