document.addEventListener("DOMContentLoaded", () => {
  const passwordForm = document.getElementById("passwordForm");
  const oldPasswordInput = document.getElementById("oldPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const saveBtn = document.getElementById("saveBtn");
  const messageArea = document.getElementById("messageArea");

  let isProcessing = false;

  // Create animated background particles
  function createParticles() {
    const particles = document.getElementById("particles");
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.top = Math.random() * 100 + "%";
      particle.style.width = Math.random() * 4 + 2 + "px";
      particle.style.height = particle.style.width;
      particle.style.animationDelay = Math.random() * 8 + "s";
      particle.style.animationDuration = Math.random() * 3 + 5 + "s";
      particles.appendChild(particle);
    }
  }

  // Initialize particles
  createParticles();

  // Toggle password visibility
  document.querySelectorAll(".toggle-password").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const targetId = toggle.getAttribute("data-target");
      const input = document.getElementById(targetId);

      if (input.type === "password") {
        input.type = "text";
        toggle.textContent = "🫣"; // closed eye
        toggle.style.opacity = "1";
      } else {
        input.type = "password";
        toggle.textContent = "👀"; // open eye
        toggle.style.opacity = "0.7";
      }
    });
  });

  // Show message
  function showMessage(text, type = "error") {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = text;

    messageArea.innerHTML = "";
    messageArea.appendChild(messageDiv);

    // Auto-hide success messages
    if (type === "success") {
      setTimeout(() => {
        messageArea.innerHTML = "";
      }, 5000);
    }
  }

  // Clear messages
  function clearMessages() {
    messageArea.innerHTML = "";
  }

  // Validate password strength
  function validatePassword(password) {
    const errors = [];

    if (password.length < 4) {
      errors.push("Mật khẩu phải có ít nhất 4 ký tự");
    }

    if (password.length > 50) {
      errors.push("Mật khẩu không được vượt quá 50 ký tự");
    }

    return errors;
  }

  // Handle form submission
  function handleSubmit(e) {
    e.preventDefault();

    if (isProcessing) return;

    const oldPass = oldPasswordInput.value.trim();
    const newPass = newPasswordInput.value.trim();
    const confirmPass = confirmPasswordInput.value.trim();

    clearMessages();

    // Validation
    if (!oldPass || !newPass || !confirmPass) {
      showMessage("⚠️ Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (newPass !== confirmPass) {
      showMessage("❌ Mật khẩu xác nhận không khớp");
      confirmPasswordInput.focus();
      return;
    }

    if (oldPass === newPass) {
      showMessage("⚠️ Mật khẩu mới phải khác mật khẩu hiện tại");
      newPasswordInput.focus();
      return;
    }

    // Validate new password strength
    const validationErrors = validatePassword(newPass);
    if (validationErrors.length > 0) {
      showMessage("⚠️ " + validationErrors[0]);
      newPasswordInput.focus();
      return;
    }

    // Start processing
    isProcessing = true;
    document.querySelector(".container").classList.add("loading");
    saveBtn.textContent = "🔄 Đang xử lý...";
    saveBtn.disabled = true;

    // Check current password
    chrome.storage.local.get("lockerPassword", (result) => {
      const currentPassword = result.lockerPassword || "123456";

      if (oldPass !== currentPassword) {
        showMessage("❌ Mật khẩu hiện tại không đúng!");
        oldPasswordInput.focus();

        // Reset processing state
        isProcessing = false;
        document.querySelector(".container").classList.remove("loading");
        saveBtn.textContent = "💾 Lưu Thay Đổi";
        saveBtn.disabled = false;
        return;
      }

      // Save new password
      chrome.storage.local.set({ lockerPassword: newPass }, () => {
        showMessage("✅ Đã lưu mật khẩu mới thành công!", "success");

        // Clear form
        passwordForm.reset();

        // Show exit countdown
        let countdown = 3;
        const countdownMessage = document.createElement("div");
        countdownMessage.className = "message success-message";
        countdownMessage.style.marginTop = "15px";

        const updateCountdown = () => {
          countdownMessage.innerHTML = `
            🚀 Sẽ tự động đóng extension sau ${countdown} giây...<br>
            <small>Bạn có thể đóng tab này bất kỳ lúc nào</small>
          `;

          if (countdown <= 0) {
            // Close current tab or window
            try {
              chrome.runtime.sendMessage({ action: "closeOptionsTab" });
            } catch (e) {
              window.close();
            }
            return;
          }

          countdown--;
          setTimeout(updateCountdown, 1000);
        };

        messageArea.appendChild(countdownMessage);
        updateCountdown();

        // Reset processing state
        isProcessing = false;
        document.querySelector(".container").classList.remove("loading");
        saveBtn.textContent = "✅ Đã Hoàn Thành";
        saveBtn.style.background =
          "linear-gradient(135deg, #2ed573 0%, #17c0eb 100%)";

        // Re-enable after delay
        setTimeout(() => {
          saveBtn.textContent = "💾 Lưu Thay Đổi";
          saveBtn.disabled = false;
        }, 3000);
      });
    });
  }

  // Event listeners
  passwordForm.addEventListener("submit", handleSubmit);

  // Real-time validation feedback
  newPasswordInput.addEventListener("input", () => {
    const password = newPasswordInput.value;
    if (password) {
      const errors = validatePassword(password);
      if (errors.length > 0) {
        newPasswordInput.style.borderColor = "rgba(220, 53, 69, 0.6)";
      } else {
        newPasswordInput.style.borderColor = "rgba(46, 213, 115, 0.6)";
      }
    } else {
      newPasswordInput.style.borderColor = "rgba(255, 255, 255, 0.3)";
    }
    clearMessages();
  });

  confirmPasswordInput.addEventListener("input", () => {
    const newPass = newPasswordInput.value;
    const confirmPass = confirmPasswordInput.value;

    if (confirmPass) {
      if (newPass === confirmPass) {
        confirmPasswordInput.style.borderColor = "rgba(46, 213, 115, 0.6)";
      } else {
        confirmPasswordInput.style.borderColor = "rgba(220, 53, 69, 0.6)";
      }
    } else {
      confirmPasswordInput.style.borderColor = "rgba(255, 255, 255, 0.3)";
    }
    clearMessages();
  });

  // Prevent common bypass attempts
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
      (e.ctrlKey && e.key === "U")
    ) {
      e.preventDefault();
    }
  });

  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  // Focus first input
  oldPasswordInput.focus();
});
