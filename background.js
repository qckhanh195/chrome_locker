chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.set({ accessGranted: false });

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
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ lockerPassword: "123456", accessGranted: false });
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  chrome.storage.local.get("accessGranted", (res) => {
    const url = details.url;
    const isInternal = url.startsWith("chrome-extension://") || url.startsWith("chrome://");

    if (!res.accessGranted && !isInternal) {
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL("lockscreen.html"),
      });
    }
  });
});

chrome.tabs.onCreated.addListener((tab) => {
  chrome.storage.local.get("accessGranted", (res) => {
    if (!res.accessGranted) {
      chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("lockscreen.html") });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "exitBrowser") {
    // Đóng tất cả tab để mô phỏng thoát trình duyệt
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => chrome.tabs.remove(tab.id));
    });
  }
});


