document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const unlockBtn = document.getElementById("unlockBtn");
  const exitBtn = document.getElementById("exitBtn");
  const errorMessage = document.getElementById("errorMessage");
  const lockoutMessage = document.getElementById("lockoutMessage");
  const attemptsCounter = document.getElementById("attemptsCounter");
  const lockContainer = document.getElementById("lockContainer");

  let isProcessing = false;
  // Bỏ MAX_ATTEMPTS - không còn giới hạn

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

  // Check for lockout status - Bỏ chức năng khóa
  function checkLockoutStatus() {
    // Không còn khóa nữa, chỉ enable input
    hideLockoutMessage();
    passwordInput.disabled = false;
    unlockBtn.disabled = false;
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

  // Update attempts counter - Bỏ giới hạn
  function updateAttemptsCounter(attempts) {
    if (attempts > 0) {
      attemptsCounter.textContent = `⚠️ Đã thử ${attempts} lần`;
      attemptsCounter.style.color = "#856404";
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
      const correctPassword = result.lockerPassword || "123456";
      const currentAttempts = result.failedAttempts || 0;

      if (enteredPassword === correctPassword) {
        // Success - Chỉ lưu trạng thái thành công
        chrome.storage.local.set({ 
          accessGranted: true, 
          failedAttempts: 0 
        }, () => {
          chrome.runtime.sendMessage({ action: "resetFailedAttempts" });

          // BỎ CHẶN CHUỘT PHẢI chỉ ở popup này
          enableRightClick();

          // Success animation for container
          lockContainer.style.background = "rgba(40, 167, 69, 0.95)";
          lockContainer.style.color = "white";
          unlockBtn.innerHTML = "✅ Thành Công!";

          // Đóng popup và cho phép truy cập bình thường
          setTimeout(() => {
            window.close(); // Đóng popup thay vì chuyển tab
          }, 1500);
        });
      } else {
        // Failed attempt - Không có giới hạn
        const newAttempts = currentAttempts + 1;
        
        // Chỉ lưu số lần thử, không khóa
        chrome.storage.local.set({ failedAttempts: newAttempts }, () => {
          showError("Mật khẩu không chính xác");
          updateAttemptsCounter(newAttempts);
          
          isProcessing = false;
          lockContainer.classList.remove("loading");
        });
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

  // Initial setup - Đơn giản hóa, bỏ logic khóa
  chrome.storage.local.get(["failedAttempts"], (result) => {
    const attempts = result.failedAttempts || 0;
    updateAttemptsCounter(attempts);
    checkLockoutStatus();
    
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

  // Prevent right-click CHỈ ở popup này, không ảnh hưởng trang web
  let rightClickHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    showError("Menu chuột phải đã bị vô hiệu hóa");
    return false;
  };
  
  // Chỉ chặn chuột phải trong popup này
  document.addEventListener("contextmenu", rightClickHandler, true);
  
  // Hàm bỏ chặn chuột phải trong popup
  function enableRightClick() {
    document.removeEventListener("contextmenu", rightClickHandler, true);
  }

  // Re-focus after any click outside
  document.addEventListener("click", (e) => {
    if (e.target !== passwordInput && !passwordInput.disabled) {
      setTimeout(() => passwordInput.focus(), 100);
    }
  });

  // Prevent drag and drop
  document.addEventListener("dragover", (e) => e.preventDefault());
  document.addEventListener("drop", (e) => e.preventDefault());
});