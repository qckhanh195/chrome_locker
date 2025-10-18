document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const unlockBtn = document.getElementById("unlockBtn");
  const lockBtn = document.getElementById("lockBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const messageArea = document.getElementById("messageArea");
  const lockoutInfo = document.getElementById("lockoutInfo");

  let isProcessing = false;

  // Check current lock status
  function updateStatus() {
    chrome.storage.local.get(["accessGranted", "lockoutTime"], (result) => {
      const isLocked = !result.accessGranted;
      const isLockedOut = result.lockoutTime && Date.now() < result.lockoutTime;

      if (isLockedOut) {
        statusDot.className = "status-dot status-lockout";
        statusText.textContent = "Tài khoản tạm khóa";
        
        const remainingMs = result.lockoutTime - Date.now();
        const remainingMin = Math.ceil(remainingMs / 60000);
        lockoutInfo.textContent = `⏰ Thử lại sau ${remainingMin} phút`;
        lockoutInfo.classList.remove("hidden");
        
        passwordInput.disabled = true;
        unlockBtn.disabled = true;
      } else if (isLocked) {
        statusDot.className = "status-dot status-locked";
        statusText.textContent = "Trình duyệt đang bị khóa";
        lockoutInfo.classList.add("hidden");
        
        passwordInput.disabled = false;
        unlockBtn.disabled = false;
      } else {
        statusDot.className = "status-dot status-unlocked";
        statusText.textContent = "Trình duyệt đã mở khóa";
        lockoutInfo.classList.add("hidden");
        
        passwordInput.disabled = false;
        unlockBtn.disabled = false;
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

  // Clear messages
  function clearMessages() {
    messageArea.innerHTML = "";
  }

  // Unlock browser
  function unlockBrowser() {
    if (isProcessing) return;

    const enteredPassword = passwordInput.value.trim();

    if (!enteredPassword) {
      showMessage("⚠️ Vui lòng nhập mật khẩu");
      return;
    }

    isProcessing = true;
    unlockBtn.textContent = "🔄 Đang xử lý...";
    unlockBtn.disabled = true;
    clearMessages();

    chrome.storage.local.get(["lockerPassword", "failedAttempts"], (result) => {
      const correctPassword = result.lockerPassword || "123456";
      const currentAttempts = result.failedAttempts || 0;

      if (enteredPassword === correctPassword) {
        // Success
        chrome.storage.local.set({ 
          accessGranted: true, 
          failedAttempts: 0,
          lockoutTime: 0
        }, () => {
          showMessage("✅ Mở khóa thành công!", "success");
          unlockBtn.textContent = "✅ Thành công";
          unlockBtn.style.background = "linear-gradient(135deg, #2ed573, #17c0eb)";
          
          passwordInput.value = "";
          
          setTimeout(() => {
            updateStatus();
            unlockBtn.textContent = "🔓 Mở Khóa";
            unlockBtn.disabled = false;
            unlockBtn.style.background = "";
            isProcessing = false;
          }, 1500);
        });
      } else {
        // Failed
        const newAttempts = currentAttempts + 1;
        
        chrome.storage.local.set({ failedAttempts: newAttempts }, () => {
          showMessage(`❌ Mật khẩu không đúng (Đã thử ${newAttempts} lần)`);
          passwordInput.value = "";
          passwordInput.focus();
          
          unlockBtn.textContent = "🔓 Mở Khóa";
          unlockBtn.disabled = false;
          isProcessing = false;
        });
      }
    });
  }

  // Lock browser immediately
  function lockBrowser() {
    chrome.storage.local.set({ 
      accessGranted: false,
      failedAttempts: 0,
      lockoutTime: 0
    }, () => {
      showMessage("🔒 Đã khóa trình duyệt", "success");
      
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
  unlockBtn.addEventListener("click", unlockBrowser);
  lockBtn.addEventListener("click", lockBrowser);
  settingsBtn.addEventListener("click", openSettings);

  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      unlockBrowser();
    }
  });

  passwordInput.addEventListener("input", clearMessages);

  // Initial status check
  updateStatus();
  
  // Focus password input
  setTimeout(() => passwordInput.focus(), 100);

  // Update status every 2 seconds
  setInterval(updateStatus, 2000);
});