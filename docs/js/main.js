// Optional: publication filter (showPubs) - template may call showPubs(1)
function showPubs(n) { return true; }

function initIdentityTyping() {
  var target = document.querySelector(".intro-identity-dynamic");
  if (!target) {
    return;
  }

  var identities = [
    "an AI Researcher",
    "an Adventurer",
    "a Chef",
    "a Sports Enthusiast"
  ];

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    target.textContent = identities[0];
    return;
  }

  var identityIndex = 0;
  var charIndex = identities[identityIndex].length;
  var deleting = true;

  function tickIdentity() {
    var currentIdentity = identities[identityIndex];

    if (deleting) {
      charIndex -= 1;
    } else {
      charIndex += 1;
    }

    target.textContent = currentIdentity.slice(0, charIndex);

    var delay = deleting ? 38 : 78;
    if (!deleting && charIndex === currentIdentity.length) {
      delay = 1450;
      deleting = true;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      identityIndex = (identityIndex + 1) % identities.length;
      delay = 280;
    }

    window.setTimeout(tickIdentity, delay);
  }

  window.setTimeout(tickIdentity, 1200);
}

document.addEventListener("DOMContentLoaded", function () {
  initIdentityTyping();

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
