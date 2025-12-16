document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const unlockBtn = document.getElementById("unlockBtn");
  const exitBtn = document.getElementById("exitBtn");
  const errorMessage = document.getElementById("errorMessage");
  const lockoutMessage = document.getElementById("lockoutMessage");
  const attemptsCounter = document.getElementById("attemptsCounter");
  const lockContainer = document.getElementById("lockContainer");

  let isProcessing = false;
  const MAX_ATTEMPTS = 5; // Đặt giới hạn 5 lần

  // Create animated background particles
  function createParticles() {
    const particles = document.getElementById("particles");
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.top = Math.random() * 100 + "%";
      particle.style.width = (Math.random() * 4 + 2) + "px";
      particle.style.height = particle.style.width;
      particle.style.animationDelay = Math.random() * 8 + "s";
      particle.style.animationDuration = (Math.random() * 3 + 5) + "s";
      particles.appendChild(particle);
    }
  }

  // Initialize particles
  createParticles();

  // Check for lockout status
  function checkLockoutStatus() {
    chrome.runtime.sendMessage({ action: "checkLockout" }, (response) => {
      if (response && response.isLocked) {
        showLockoutMessage(response.remainingTime);
        passwordInput.disabled = true;
        unlockBtn.disabled = true;
      } else {
        hideLockoutMessage();
        passwordInput.disabled = false;
        unlockBtn.disabled = false;
      }
    });
  }

  function showLockoutMessage(remainingTime = null) {
    // Nếu không có remainingTime, lấy từ storage
    if (remainingTime === null) {
      chrome.storage.local.get(["lockoutTime"], (result) => {
        const now = Date.now();
        const lockoutTime = result.lockoutTime || now;
        const fiveMinutes = 5 * 60 * 1000;
        const timeRemaining = fiveMinutes - (now - lockoutTime);
        
        if (timeRemaining > 0) {
          displayLockoutCountdown(Math.ceil(timeRemaining / 60000)); // Hiển thị phút còn lại
        } else {
          // Hết thời gian khóa, reset
          chrome.storage.local.set({ failedAttempts: 0, lockoutTime: 0 }, () => {
            hideLockoutMessage();
          });
        }
      });
    } else {
      displayLockoutCountdown(Math.ceil(remainingTime / 60000));
    }
  }

  function displayLockoutCountdown(minutesRemaining) {
    // Hiển thị thông báo khóa với thời gian còn lại
    lockoutMessage.innerHTML = `
      <strong>⏰ Tài khoản tạm khóa</strong><br>
      Bạn đã nhập sai mật khẩu quá nhiều lần.<br>
      Vui lòng thử lại sau <span id="lockCountdown">${minutesRemaining}</span> phút.
    `;
    lockoutMessage.style.display = "block";
    errorMessage.style.display = "none";
    passwordInput.disabled = true;
    unlockBtn.disabled = true;

    // Cập nhật thời gian còn lại mỗi giây
    const countdownInterval = setInterval(() => {
      chrome.storage.local.get(["lockoutTime"], (result) => {
        const now = Date.now();
        const lockoutTime = result.lockoutTime || 0;
        const fiveMinutes = 5 * 60 * 1000;
        const timeRemaining = fiveMinutes - (now - lockoutTime);
        
        if (timeRemaining <= 0) {
          // Hết thời gian khóa
          clearInterval(countdownInterval);
          chrome.storage.local.set({ failedAttempts: 0, lockoutTime: 0 }, () => {
            hideLockoutMessage();
          });
        } else {
          // Cập nhật thời gian hiển thị
          const minutesLeft = Math.ceil(timeRemaining / 60000);
          const secondsLeft = Math.ceil((timeRemaining % 60000) / 1000);
          const lockCountdownElement = document.getElementById("lockCountdown");
          if (lockCountdownElement) {
            if (minutesLeft > 1) {
              lockCountdownElement.textContent = `${minutesLeft}`;
            } else {
              lockCountdownElement.textContent = `${secondsLeft} giây`;
            }
          }
        }
      });
    }, 1000);
  }

  function exitBrowser() {
    try {
      // Đối với Chrome Extension
      if (chrome && chrome.runtime) {
        // Đóng tất cả tab
        chrome.tabs.query({}, (tabs) => {
          const tabIds = tabs.map(tab => tab.id);
          chrome.tabs.remove(tabIds, () => {
            // Sau khi đóng tất cả tab, đóng cửa sổ
            chrome.windows.getCurrent((window) => {
              chrome.windows.remove(window.id);
            });
          });
        });
      }

      // Backup methods nếu chrome API không hoạt động
      // Thử đóng cửa sổ hiện tại
      window.close();

      // Nếu không thể đóng, chuyển hướng đến trang trống
      window.location.href = "about:blank";

    } catch (error) {
      console.error("Không thể thoát trình duyệt:", error);
      // Fallback: chuyển về trang trống
      window.location.href = "about:blank";
    }
  }

  // Hide lockout message
  function hideLockoutMessage() {
    lockoutMessage.style.display = "none";
    passwordInput.disabled = false;
    unlockBtn.disabled = false;
    passwordInput.focus();
  }

  // Show error message
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    passwordInput.value = "";
    passwordInput.focus();

    // Add shake animation
    lockContainer.style.animation = "none";
    setTimeout(() => {
      lockContainer.style.animation = "shake 0.5s ease-in-out";
    }, 10);
  }

  // Hide error message
  function hideError() {
    errorMessage.style.display = "none";
  }

  // Update attempts counter
  function updateAttemptsCounter(attempts) {
    if (attempts > 0) {
      const remaining = MAX_ATTEMPTS - attempts;
      attemptsCounter.textContent = `⚠️ Còn ${remaining} lần thử`;
      attemptsCounter.style.color = remaining <= 2 ? "#dc3545" : "#856404";
    } else {
      attemptsCounter.textContent = "";
    }
  }

  // Show success popup
  function showSuccessPopup() {
    // Create success popup overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease-out;
    `;

    const popup = document.createElement('div');
    popup.style.cssText = `
      background: white;
      padding: 40px;
      border-radius: 20px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.4s ease-out;
    `;

    popup.innerHTML = `
      <div style="font-size: 4rem; color: #2ed573; margin-bottom: 20px;">✅</div>
      <h2 style="color: #333; margin-bottom: 15px; font-size: 1.5rem;">Thành Công!</h2>
      <p style="color: #666; margin-bottom: 30px;">Mật khẩu chính xác. Đang mở khóa trình duyệt...</p>
      <div style="width: 100%; height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden;">
        <div id="progressBar" style="height: 100%; background: linear-gradient(90deg, #2ed573, #17c0eb); width: 0%; transition: width 2s ease-out;"></div>
      </div>
    `;

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-30px) scale(0.9); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
    `;
    document.head.appendChild(style);

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Start progress bar animation
    setTimeout(() => {
      const progressBar = document.getElementById('progressBar');
      progressBar.style.width = '100%';
    }, 100);

    // Remove popup and redirect after animation
    setTimeout(() => {
      document.body.removeChild(overlay);
      chrome.tabs.update({ url: "chrome://newtab" });
    }, 2500);
  }

  // Verify password
  function verifyPassword() {
    if (isProcessing) return;

    const enteredPassword = passwordInput.value.trim();

    if (!enteredPassword) {
      showError("Vui lòng nhập mật khẩu");
      return;
    }

    isProcessing = true;
    lockContainer.classList.add("loading");
    hideError();

    chrome.storage.local.get(["lockerPassword", "failedAttempts"], (result) => {
      const correctPassword = result.lockerPassword;
      const currentAttempts = result.failedAttempts || 0;

      // Kiểm tra nếu chưa có mật khẩu (lần đầu cài đặt)
      if (!correctPassword) {
        showError("Vui lòng thiết lập mật khẩu lần đầu trong trang Cài đặt");
        isProcessing = false;
        lockContainer.classList.remove("loading");
        return;
      }

      if (enteredPassword === correctPassword) {
        // Success - popup.js style animation
        chrome.storage.local.set({ accessGranted: true }, () => {
          // Change button style like popup.js
          unlockBtn.innerHTML = "✅ Thành công!";
          unlockBtn.style.background = "linear-gradient(135deg, #2ed573, #17c0eb)";
          unlockBtn.style.transform = "scale(1.05)";
          unlockBtn.style.transition = "all 0.3s ease";
          
          passwordInput.value = "";
          errorMessage.style.display = "none";
          
          // Show success message
          const successMsg = document.createElement('div');
          successMsg.style.cssText = `
            color: #2ed573;
            font-size: 1rem;
            margin-top: 15px;
            font-weight: 500;
          `;
          successMsg.textContent = "✅ Mở khóa thành công!";
          lockContainer.appendChild(successMsg);
          
          // Redirect after 1.5 seconds
          setTimeout(() => {
            chrome.tabs.update({ url: "chrome://newtab" });
          }, 1500);
        });
      } else {
        // Failed attempt - apply 5 second cooldown
        showError("Mật khẩu không chính xác. Vui lòng đợi 5 giây...");
        
        // Disable input and button for 5 seconds
        passwordInput.disabled = true;
        unlockBtn.disabled = true;
        isProcessing = true;
        
        let countdown = 5;
        attemptsCounter.textContent = `⏱️ Đợi ${countdown} giây...`;
        attemptsCounter.style.color = "#dc3545";
        
        const countdownInterval = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            attemptsCounter.textContent = `⏱️ Đợi ${countdown} giây...`;
          } else {
            clearInterval(countdownInterval);
            attemptsCounter.textContent = "";
            passwordInput.disabled = false;
            unlockBtn.disabled = false;
            passwordInput.value = "";
            passwordInput.focus();
            isProcessing = false;
            lockContainer.classList.remove("loading");
          }
        }, 1000);
      }
    });
  }

  // Event listeners
  unlockBtn.addEventListener("click", verifyPassword);

  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      verifyPassword();
    }
  });

  passwordInput.addEventListener("input", () => {
    hideError();
  });

  // Initial setup - Reset failed attempts khi khởi động
  chrome.storage.local.set({ failedAttempts: 0, lockoutTime: 0 }, () => {
    checkLockoutStatus();
    
    // Reset attempts counter
    updateAttemptsCounter(0);
    
    // Focus vào password input
    setTimeout(() => forceFocusPassword(), 100);
  });

  // Aggressive focus management for password field
  function forceFocusPassword() {
    if (!passwordInput.disabled && document.activeElement !== passwordInput) {
      passwordInput.focus();
      passwordInput.click();
    }
  }

  // Multiple focus strategies
  // 1. Immediate focus when page loads
  setTimeout(() => forceFocusPassword(), 100);
  setTimeout(() => forceFocusPassword(), 300);
  setTimeout(() => forceFocusPassword(), 500);

  // 2. Focus when document becomes visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(() => forceFocusPassword(), 50);
    }
  });

  // 3. Focus when window gains focus
  window.addEventListener('focus', () => {
    setTimeout(() => forceFocusPassword(), 50);
  });

  // 4. Focus when mouse moves (user is active)
  let mouseMoveTimeout;
  document.addEventListener('mousemove', () => {
    clearTimeout(mouseMoveTimeout);
    mouseMoveTimeout = setTimeout(() => {
      if (document.activeElement !== passwordInput) {
        forceFocusPassword();
      }
    }, 100);
  });

  // 5. Continuous focus check (more frequent)
  const focusInterval = setInterval(() => {
    forceFocusPassword();
  }, 500);

  // 6. Focus on any user interaction
  document.addEventListener('click', (e) => {
    if (e.target !== passwordInput) {
      setTimeout(() => forceFocusPassword(), 10);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (document.activeElement !== passwordInput && !passwordInput.disabled) {
      // If user presses any key, redirect to password input
      if (e.key.length === 1 || e.key === 'Backspace') {
        forceFocusPassword();
        // Don't prevent default to allow typing
      }
    }
  });

  // Prevent common bypass attempts
  document.addEventListener("keydown", (e) => {
    // Block F12, Ctrl+Shift+I, Ctrl+U, etc.
    if (e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
      (e.ctrlKey && e.key === "U")) {
      e.preventDefault();
      showError("Chức năng này đã bị vô hiệu hóa");
    }
  });

  // Prevent right-click context menu
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showError("Menu chuột phải đã bị vô hiệu hóa");
  });

  // Re-focus after any click outside
  document.addEventListener("click", (e) => {
    if (e.target !== passwordInput && !passwordInput.disabled) {
      setTimeout(() => passwordInput.focus(), 100);
    }
  });

  // Prevent drag and drop
  document.addEventListener("dragover", (e) => e.preventDefault());
  document.addEventListener("drop", (e) => e.preventDefault());

  // ========== ENHANCED SECURITY: PREVENT NAVIGATION ==========
  
  // Prevent back/forward navigation
  window.history.pushState(null, null, window.location.href);
  window.addEventListener('popstate', function(event) {
    window.history.pushState(null, null, window.location.href);
  });

  // Prevent navigation (removed alert to allow smooth exit)
  // window.addEventListener('beforeunload', function(e) {
  //   e.preventDefault();
  //   e.returnValue = '';
  //   return '';
  // });

  // Block ALL navigation attempts via keyboard
  document.addEventListener('keydown', function(e) {
    // Block Alt+Left (Back), Alt+Right (Forward)
    if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      e.stopPropagation();
      showError("Không thể điều hướng khi trình duyệt đang bị khóa");
      return false;
    }
    
    // Block Backspace (Back navigation when not in input)
    if (e.key === 'Backspace' && document.activeElement !== passwordInput) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    
    // Block Alt+Home
    if (e.altKey && e.key === 'Home') {
      e.preventDefault();
      e.stopPropagation();
      showError("Không thể truy cập trang chủ khi trình duyệt đang bị khóa");
      return false;
    }
    
    // Block Ctrl+L, Ctrl+K (Address bar)
    if (e.ctrlKey && (e.key === 'l' || e.key === 'L' || e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      e.stopPropagation();
      showError("Thanh địa chỉ đã bị vô hiệu hóa");
      return false;
    }
    
    // Block Ctrl+T (New tab)
    if (e.ctrlKey && (e.key === 't' || e.key === 'T')) {
      e.preventDefault();
      e.stopPropagation();
      showError("Không thể mở tab mới khi trình duyệt đang bị khóa");
      return false;
    }
    
    // Block Ctrl+N (New window)
    if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault();
      e.stopPropagation();
      showError("Không thể mở cửa sổ mới khi trình duyệt đang bị khóa");
      return false;
    }
    
    // Block Ctrl+W, Ctrl+F4 (Close tab)
    if ((e.ctrlKey && (e.key === 'w' || e.key === 'W')) || 
        (e.ctrlKey && e.key === 'F4')) {
      e.preventDefault();
      e.stopPropagation();
      showError("Không thể đóng tab khi trình duyệt đang bị khóa");
      return false;
    }
    
    // Block Alt+F4 (Close window)
    if (e.altKey && e.key === 'F4') {
      e.preventDefault();
      e.stopPropagation();
      showError("Không thể đóng cửa sổ khi trình duyệt đang bị khóa");
      return false;
    }
    
    // Block F5, Ctrl+R (Refresh - allow this for lockscreen)
    // We allow refresh so user can retry if page has issues
    
    // Block Ctrl+Shift+T (Reopen closed tab)
    if (e.ctrlKey && e.shiftKey && (e.key === 't' || e.key === 'T')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true); // Use capture phase to catch before other handlers

  // Removed beforeunload alert to allow smooth exit
  // window.onbeforeunload = function() {
  //   return "Đang khóa trình duyệt...";
  // };

  // Monitor for any attempts to change location
  let originalLocation = window.location.href;
  setInterval(() => {
    if (window.location.href !== originalLocation && !window.location.href.includes('src/html/lockscreen.html')) {
      // If location changed, force back to lockscreen
      window.location.href = chrome.runtime.getURL("src/html/lockscreen.html");
    }
    originalLocation = window.location.href;
  }, 500);

  // Prevent any form of navigation via window.location
  const originalReplace = window.location.replace;
  const originalAssign = window.location.assign;
  
  window.location.replace = function(url) {
    if (!url.includes('src/html/lockscreen.html') && !url.includes('chrome://newtab')) {
      showError("Không thể điều hướng khi trình duyệt đang bị khóa");
      return;
    }
    originalReplace.call(window.location, url);
  };
  
  window.location.assign = function(url) {
    if (!url.includes('src/html/lockscreen.html') && !url.includes('chrome://newtab')) {
      showError("Không thể điều hướng khi trình duyệt đang bị khóa");
      return;
    }
    originalAssign.call(window.location, url);
  };

  // Prevent navigation via links
  document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.href && !e.target.href.includes('src/html/lockscreen.html')) {
      e.preventDefault();
      e.stopPropagation();
      showError("Không thể điều hướng khi trình duyệt đang bị khóa");
      return false;
    }
  }, true);

  console.log('Chrome Lock - Enhanced Security Active');
});