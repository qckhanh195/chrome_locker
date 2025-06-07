document.addEventListener("DOMContentLoaded", () => {
  const o_nhap = document.getElementById("password");
  const thong_bao = document.getElementById("error");

  function kiem_tra() {
    chrome.storage.local.get("lockerPassword", (kq) => {
      const mat_khau_dung = kq.lockerPassword || "123456";
      if (o_nhap.value === mat_khau_dung) {
        chrome.storage.local.set({ accessGranted: true }, () => {
          chrome.tabs.update({ url: "chrome://newtab" });
        });
      } else {
        thong_bao.textContent = "Sai mat khau. Vui long nhap lai.";
        o_nhap.value = "";
        o_nhap.focus();
      }
    });
  }

  document.getElementById("okBtn").addEventListener("click", kiem_tra);
  o_nhap.addEventListener("keypress", (e) => {
    if (e.key === "Enter") kiem_tra();
  });

  document.getElementById("cancelBtn").addEventListener("click", () => {
    window.close();
  });
});
