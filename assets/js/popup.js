document.addEventListener("DOMContentLoaded", () => {
  const lockBtn = document.getElementById("lockBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const messageArea = document.getElementById("messageArea");

  // Check current lock status
  function updateStatus() {
    chrome.storage.local.get(["accessGranted"], (result) => {
      const isLocked = !result.accessGranted;

      if (isLocked) {
        statusDot.className = "status-dot status-locked";
        statusText.textContent = "Browser is locked";
      } else {
        statusDot.className = "status-dot status-unlocked";
        statusText.textContent = "Browser is unlocked";
      }
    });
  }

  // Show message
  function showMessage(text, type = "error") {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = text;
    
    messageArea.innerHTML = "";
    messageArea.appendChild(messageDiv);
    
    if (type === "success") {
      setTimeout(() => {
        messageArea.innerHTML = "";
      }, 3000);
    }
  }

  // Lock browser immediately
  function lockBrowser() {
    chrome.storage.local.set({ 
      accessGranted: false
    }, () => {
      showMessage("🔒 Browser locked", "success");
      
      // Redirect all tabs to lockscreen
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.update(tab.id, { 
            url: chrome.runtime.getURL("lockscreen.html") 
          });
        });
      });
      
      setTimeout(() => {
        updateStatus();
        window.close(); // Close popup
      }, 1000);
    });
  }

  // Open settings
  function openSettings() {
    chrome.tabs.create({ 
      url: chrome.runtime.getURL("options.html") 
    });
    window.close();
  }

  // Event listeners
  lockBtn.addEventListener("click", lockBrowser);
  settingsBtn.addEventListener("click", openSettings);

  // Initial status check
  updateStatus();

  // Update status every 2 seconds
  setInterval(updateStatus, 2000);
});