// Optional: publication filter (showPubs) - template may call showPubs(1)
function showPubs(n) { return true; }

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
    link.rel = "noopener noreferrer";
  });

  var navbarToggle = document.getElementById("navbarToggle");
  var navbarButton = document.querySelector(".navbar-toggler");
  if (!navbarToggle || !navbarButton) {
    return;
  }

  navbarToggle.querySelectorAll(".nav-link").forEach(function (link) {
    link.addEventListener("click", function () {
      if (navbarToggle.classList.contains("show")) {
        navbarToggle.classList.remove("show");
        navbarButton.setAttribute("aria-expanded", "false");
      }
    });
  });
});
