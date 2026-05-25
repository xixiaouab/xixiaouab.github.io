// Optional: publication filter (showPubs) - template may call showPubs(1)
function showPubs(n) { return true; }

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
    link.rel = "noopener noreferrer";
  });

  document.addEventListener("click", function (event) {
    var toggle = event.target.closest(".navbar-custom .dropdown-toggle");
    var openMenus = document.querySelectorAll(".navbar-custom .dropdown-menu.show");

    openMenus.forEach(function (menu) {
      if (!toggle || menu !== toggle.nextElementSibling) {
        menu.classList.remove("show");
        var owner = menu.previousElementSibling;
        if (owner) {
          owner.setAttribute("aria-expanded", "false");
        }
      }
    });

    if (!toggle) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    var menu = toggle.nextElementSibling;
    if (!menu || !menu.classList.contains("dropdown-menu")) {
      return;
    }

    var isOpen = menu.classList.toggle("show");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }, true);

  var navbarToggle = document.getElementById("navbarToggle");
  var navbarButton = document.querySelector(".navbar-toggler");
  if (!navbarToggle || !navbarButton) {
    return;
  }

  navbarToggle.querySelectorAll(".nav-link").forEach(function (link) {
    link.addEventListener("click", function () {
      if (link.classList.contains("dropdown-toggle")) {
        return;
      }

      if (navbarToggle.classList.contains("show")) {
        navbarToggle.classList.remove("show");
        navbarButton.setAttribute("aria-expanded", "false");
      }
    });
  });
});
