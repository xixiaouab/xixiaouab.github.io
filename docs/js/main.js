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

function formatCompactNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }
  return Number(value).toLocaleString("en-US");
}

function formatScholarDate(value) {
  if (!value) {
    return "Pending";
  }

  var date = new Date(value + "T00:00:00");
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function fitCanvasToDisplaySize(canvas) {
  var ratio = window.devicePixelRatio || 1;
  var width = Math.floor(canvas.clientWidth * ratio);
  var height = Math.floor(canvas.clientHeight * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return ratio;
}

function drawCitationChart(canvas, history) {
  if (!canvas || !canvas.getContext) {
    return;
  }

  var ctx = canvas.getContext("2d");
  var ratio = fitCanvasToDisplaySize(canvas);
  var width = canvas.width;
  var height = canvas.height;
  var pad = 18 * ratio;
  var values = (history || [])
    .map(function (entry) { return Number(entry.total_citations); })
    .filter(function (value) { return !Number.isNaN(value); });

  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 1.4 * ratio;
  ctx.strokeStyle = "rgba(38, 90, 130, 0.14)";
  ctx.beginPath();
  ctx.moveTo(pad, height - pad);
  ctx.lineTo(width - pad, height - pad);
  ctx.stroke();

  if (!values.length) {
    return;
  }

  if (values.length === 1) {
    values = [Math.max(0, values[0] - 1), values[0]];
  }

  var min = Math.min.apply(null, values);
  var max = Math.max.apply(null, values);
  if (min === max) {
    min -= 1;
    max += 1;
  }

  var points = values.map(function (value, index) {
    var x = pad + (index / (values.length - 1)) * (width - pad * 2);
    var y = height - pad - ((value - min) / (max - min)) * (height - pad * 2);
    return { x: x, y: y };
  });

  var gradient = ctx.createLinearGradient(0, pad, 0, height - pad);
  gradient.addColorStop(0, "rgba(62, 137, 193, 0.24)");
  gradient.addColorStop(1, "rgba(62, 137, 193, 0.02)");

  ctx.beginPath();
  ctx.moveTo(points[0].x, height - pad);
  points.forEach(function (point) {
    ctx.lineTo(point.x, point.y);
  });
  ctx.lineTo(points[points.length - 1].x, height - pad);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  points.forEach(function (point, index) {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.strokeStyle = "#2c86c9";
  ctx.lineWidth = 2.5 * ratio;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  var last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 4.5 * ratio, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#2c86c9";
  ctx.lineWidth = 2 * ratio;
  ctx.stroke();
}

function initScholarCitationTracker() {
  var tracker = document.querySelector("[data-scholar-tracker]");
  if (!tracker || !window.fetch) {
    return;
  }

  fetch("data/scholar_citations.json", { cache: "no-cache" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Citation data unavailable");
      }
      return response.json();
    })
    .then(function (data) {
      var summary = data.summary || {};
      var profile = data.profile || {};
      var topPaper = (data.top_papers || [])[0] || {};
      var topPaperLink = tracker.querySelector("[data-scholar-top-paper]");

      tracker.querySelector("[data-scholar-total]").textContent = formatCompactNumber(summary.total_citations);
      tracker.querySelector("[data-scholar-hindex]").textContent = formatCompactNumber(summary.h_index);
      tracker.querySelector("[data-scholar-i10]").textContent = formatCompactNumber(summary.i10_index);
      tracker.querySelector("[data-scholar-papers]").textContent = formatCompactNumber(summary.paper_count);
      tracker.querySelector("[data-scholar-updated]").textContent = formatScholarDate(summary.updated);

      if (topPaperLink && topPaper.title) {
        topPaperLink.href = topPaper.link || profile.scholar_url || topPaperLink.href;
        topPaperLink.querySelector("strong").textContent = topPaper.title;
      }

      drawCitationChart(document.getElementById("scholarCitationChart"), data.history || []);
      window.addEventListener("resize", function () {
        drawCitationChart(document.getElementById("scholarCitationChart"), data.history || []);
      });
    })
    .catch(function () {
      tracker.querySelector("[data-scholar-updated]").textContent = "Google Scholar";
      var topPaper = tracker.querySelector("[data-scholar-top-paper] strong");
      if (topPaper) {
        topPaper.textContent = "Open the live Google Scholar profile";
      }
    });
}

document.addEventListener("DOMContentLoaded", function () {
  initIdentityTyping();
  initScholarCitationTracker();

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
