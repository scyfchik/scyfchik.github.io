(function loadPortfolio() {
  if (window.location.protocol !== "file:") {
    const moduleScript = document.createElement("script");
    moduleScript.type = "module";
    moduleScript.src = "./src/app.js";
    document.head.append(moduleScript);
    return;
  }

  document.documentElement.classList.add("file-fallback");
  document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
  const dashboardStatus = document.getElementById("dashboardStatus");
  if (dashboardStatus) dashboardStatus.textContent = "Статистика пока недоступна";

  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.getElementById("main-navigation");
  const closeMenu = () => {
    navigation?.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  };
  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    navigation?.classList.toggle("open", open);
  });
  navigation?.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });

  document.querySelectorAll(".copy-discord").forEach((button) => button.addEventListener("click", async () => {
    const toast = document.getElementById("copyToast");
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText("scyfchik");
      } else {
        const input = document.createElement("textarea");
        input.value = "scyfchik";
        input.readOnly = true;
        input.style.cssText = "position:fixed;opacity:0";
        document.body.append(input);
        input.select();
        const copied = document.execCommand("copy");
        input.remove();
        if (!copied) throw new Error("Copy failed");
      }
      if (toast) toast.textContent = "Discord username скопирован";
    } catch (_) {
      if (toast) toast.textContent = "Discord: scyfchik";
    }
    toast?.classList.add("show");
    window.setTimeout(() => toast?.classList.remove("show"), 2200);
  }));

  const year = document.getElementById("currentYear");
  if (year) year.textContent = String(new Date().getFullYear());
}());
