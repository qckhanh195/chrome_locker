chrome.storage.local.get("accessGranted", (result) => {
  if (!result.accessGranted) {
    document.body.innerHTML = `
      <div style="text-align: center; margin-top: 100px;">
        <h2>🔒 Trình duyệt đã bị khoá</h2>
        <p>Vui lòng nhấn vào biểu tượng tiện ích và nhập mật khẩu để tiếp tục.</p>
      </div>
    `;
  }
});