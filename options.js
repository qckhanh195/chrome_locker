document.addEventListener("DOMContentLoaded", () => {
  const oldPasswordInput = document.getElementById("oldPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const error = document.getElementById("error");
  const status = document.getElementById("status");
  const saveBtn = document.getElementById("saveBtn");

  // Toggle password visibility with con mắt
  document.querySelectorAll('.toggle-password').forEach(el => {
    el.addEventListener('click', () => {
      const inputId = el.getAttribute('data-target');
      const input = document.getElementById(inputId);
      if (input.type === 'password') {
        input.type = 'text';
        el.textContent = '🙈'; // icon con mắt khoá
      } else {
        input.type = 'password';
        el.textContent = '👁️'; // icon con mắt mở
      }
    });
  });

  saveBtn.addEventListener("click", () => {
    const oldPass = oldPasswordInput.value.trim();
    const newPass = newPasswordInput.value.trim();
    const confirmPass = confirmPasswordInput.value.trim();

    error.textContent = "";
    status.textContent = "";

    if (!oldPass || !newPass || !confirmPass) {
      error.textContent = "Vui lòng nhập đầy đủ thông tin.";
      return;
    }

    if (newPass !== confirmPass) {
      error.textContent = "Mật khẩu mới không khớp.";
      return;
    }

    // Lấy mật khẩu hiện tại từ storage
    chrome.storage.local.get("lockerPassword", (result) => {
      const currentPassword = result.lockerPassword || "123456";

      if (oldPass !== currentPassword) {
        error.textContent = "Mật khẩu cũ không đúng!";
        return;
      }

      // Lưu mật khẩu mới
      chrome.storage.local.set({ lockerPassword: newPass }, () => {
        status.textContent = "✅ Đã lưu mật khẩu mới. Đang thoát trình duyệt...";
        setTimeout(() => {
          // Gửi message background để đóng Chrome
          chrome.runtime.sendMessage({ action: "closeChrome" }, () => {
            window.close();
          });
        }, 1500);
      });
    });
  });
});
