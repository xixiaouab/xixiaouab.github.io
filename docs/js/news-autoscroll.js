/* Optional progressive enhancement. Keeps the original News DOM and links.
 * Requires a scrollable panel [data-news-autoscroll] plus sibling/ancestor
 * [data-news-toggle], both inside [data-news-widget]. No cloned list or ticker.
 */
(function () {
  "use strict";
  function init() {
    document.querySelectorAll("[data-news-autoscroll]").forEach(function (panel) {
      var widget = panel.closest("[data-news-widget]");
      var button = widget && widget.querySelector("[data-news-toggle]");
      if (!widget || !button || !window.requestAnimationFrame || !window.matchMedia) { return; }
      var hint = widget.querySelector(".news-scroll-hint");
      var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      var userPaused = false;
      var hovered = false;
      var visible = true;
      var previousTime = null;
      var frame = null;
      var waitUntil = performance.now() + 2500;
      var atEnd = false;
      var position = panel.scrollTop;
      var speed = 12; // CSS pixels per second; independent of display refresh rate.

      function overflows() { return panel.scrollHeight > panel.clientHeight + 1; }
      function blocked() {
        return userPaused || motion.matches || hovered || !visible || document.hidden ||
          widget.contains(document.activeElement) || !overflows();
      }
      function updateButton() {
        if (hint) {
          hint.textContent = motion.matches ? "Scroll to browse all updates." :
            (userPaused ? "Auto-scroll paused · Scroll to browse." : "Auto-scrolling · Hover to pause. Scroll to browse.");
        }
        button.hidden = !overflows();
        button.disabled = motion.matches;
        button.textContent = motion.matches ? "Auto-scroll off" :
          (userPaused ? "Resume auto-scroll" : "Pause auto-scroll");
        button.title = motion.matches ? "Reduced motion is enabled; scroll News manually" :
          "Automatic scrolling also pauses while hovering, focusing, or interacting with News";
      }
      function stopFrame() {
        if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
        previousTime = null;
      }
      function tick(now) {
        frame = null;
        if (blocked()) { previousTime = null; return; }
        var delta = previousTime === null ? 0 : Math.min(now - previousTime, 100);
        previousTime = now;
        if (now >= waitUntil) {
          if (atEnd) {
            panel.scrollTop = 0;
            position = 0;
            atEnd = false;
            waitUntil = now + 2500;
          } else {
            position = Math.min(panel.scrollHeight - panel.clientHeight, position + delta * speed / 1000);
            panel.scrollTop = position;
            if (position >= panel.scrollHeight - panel.clientHeight - 1) {
              atEnd = true;
              waitUntil = now + 3500;
            }
          }
        }
        frame = requestAnimationFrame(tick);
      }
      function refresh() {
        updateButton();
        if (blocked()) { stopFrame(); return; }
        if (frame === null) {
          position = panel.scrollTop;
          previousTime = null;
          waitUntil = Math.max(waitUntil, performance.now() + 1000);
          frame = requestAnimationFrame(tick);
        }
      }
      function manualPause() {
        userPaused = true;
        atEnd = false;
        refresh();
      }

      button.hidden = false;
      button.addEventListener("click", function () { userPaused = !userPaused; refresh(); });
      widget.addEventListener("pointerenter", function () { hovered = true; refresh(); });
      widget.addEventListener("pointerleave", function () { hovered = false; refresh(); });
      widget.addEventListener("focusin", refresh);
      widget.addEventListener("focusout", function () { window.setTimeout(refresh, 0); });
      panel.addEventListener("wheel", manualPause, { passive: true });
      panel.addEventListener("touchstart", manualPause, { passive: true });
      panel.addEventListener("pointerdown", manualPause, { passive: true });
      panel.addEventListener("keydown", function (event) {
        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].indexOf(event.key) !== -1) {
          manualPause();
        }
      });
      document.addEventListener("visibilitychange", refresh);
      if (motion.addEventListener) { motion.addEventListener("change", refresh); }
      else if (motion.addListener) { motion.addListener(refresh); }
      if (window.ResizeObserver) { new ResizeObserver(refresh).observe(panel); }
      else { window.addEventListener("resize", refresh); }
      if (window.IntersectionObserver) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          refresh();
        }).observe(panel);
      }
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(refresh); }
      refresh();
    });
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); }
  else { init(); }
}());
