/* Refresh the optional citation chart after its native disclosure is opened. */
(function () {
  "use strict";
  function init() {
    document.querySelectorAll("[data-expand-stats]").forEach(function (details) {
      details.addEventListener("toggle", function () {
        if (!details.open || !window.profileStatsReady) { return; }
        window.profileStatsReady.then(function (stats) {
          if (details.open && stats.scholar && typeof drawCitationChart === "function") {
            drawCitationChart(document.getElementById("scholarCitationChart"), stats.scholar.history || []);
          }
        });
      });
    });
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); }
  else { init(); }
}());
