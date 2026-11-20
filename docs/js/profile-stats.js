/* Shared cached statistics for the social row and Scholar footer.
 * Load with defer before main.js. No live metrics API or browser token.
 * window.profileStatsReady always resolves to { scholar: object|null,
 * github: object|null }; consumers must not make their own metrics requests.
 */
(function () {
  "use strict";
  if (window.profileStatsReady && typeof window.profileStatsReady.then === "function") { return; }

  var rawBase = "https://raw.githubusercontent.com/xixiaouab/xixiaouab.github.io/master/docs/data/";
  var resolveReady;
  var started = false;
  window.profileStatsReady = new Promise(function (resolve) { resolveReady = resolve; });

  function validCount(value) {
    return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
  }

  function requestJSON(url) {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer;
    var timeout = new Promise(function (resolve, reject) {
      timer = window.setTimeout(function () {
        if (controller) { controller.abort(); }
        reject(new Error("Snapshot request timed out"));
      }, 8000);
    });
    var request = Promise.resolve().then(function () {
      return window.fetch(url, {
        cache: "no-cache",
        signal: controller ? controller.signal : undefined
      });
    }).then(function (response) {
      if (!response.ok) { throw new Error("Snapshot unavailable"); }
      return response.json();
    });

    return Promise.race([request, timeout]).then(function (data) {
      window.clearTimeout(timer);
      return data;
    }, function (error) {
      window.clearTimeout(timer);
      throw error;
    });
  }

  function loadMetric(options) {
    if (typeof window.fetch !== "function") { return Promise.resolve(null); }

    function validate(data) {
      if (!data || !options.identity(data) || !data.summary || !validCount(data.summary[options.metric])) {
        throw new Error("Unexpected snapshot identity or count");
      }
      return data;
    }

    function show(data) {
      var total = data.summary[options.metric];
      var date = data.summary.updated || "";
      document.querySelectorAll(options.selector).forEach(function (node) {
        node.textContent = total.toLocaleString("en-US");
        var link = node.closest("a");
        if (link) {
          link.title = options.label + ": " + total.toLocaleString("en-US") +
            (date ? "; last successful update " + date : "");
        }
      });
      return data;
    }

    // Bot commits do not trigger branch-based Pages rebuilds. The public raw
    // cache is updated daily; a deployed same-origin cache is the fallback.
    return requestJSON(rawBase + options.file).then(validate)
      .catch(function () {
        return requestJSON(new URL("data/" + options.file, document.baseURI).href).then(validate);
      })
      .then(show)
      .catch(function () {
        // Keep the visible dated HTML snapshot and resolve the shared promise.
        return null;
      });
  }

  function init() {
    if (started) { return; }
    started = true;
    Promise.all([
      loadMetric({
        selector: "[data-inline-scholar-citations]", file: "scholar_citations.json",
        metric: "total_citations", label: "Google Scholar citations",
        identity: function (data) { return data.profile && data.profile.scholar_id === "Q4DnRVgAAAAJ"; }
      }),
      loadMetric({
        selector: "[data-inline-github-stars]", file: "github_stats.json",
        metric: "total_stars", label: "Stars across my repositories and coauthored paper projects, excluding Agent Harness Engineering",
        identity: function (data) { return data.profile && data.profile.login === "xixiaouab" &&
          data.profile.scholar_id === "Q4DnRVgAAAAJ" && data.schema_version === 2 && data.scope &&
          data.scope.visibility === "public" && data.scope.ownership === "personal_and_coauthored_research"; }
      })
    ]).then(function (results) {
      resolveReady({ scholar: results[0], github: results[1] });
    });
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); }
  else { init(); }
}());
