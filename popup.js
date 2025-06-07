document.getElementById("submit").addEventListener("click", () => {
  const nhap = document.getElementById("password").value;

  chrome.storage.local.get("lockerPassword", (kq) => {
    const mat_khau_dung = kq.lockerPassword || "123456";

    if (nhap === mat_khau_dung) {
      chrome.storage.local.set({ accessGranted: true });
      window.close();
    } else {
      document.getElementById("msg").textContent = "Sai mat khau!";
    }
  });
});
