(() => {
  document.documentElement.classList.add('js-enabled');
  document.querySelectorAll('[data-resource]').forEach(link => {
    const url = window.REALVR_LINKS?.[link.dataset.resource];
    if (!url || !/^https:\/\//.test(url)) return;
    link.href = url;
    link.classList.remove('unavailable');
    link.removeAttribute('aria-disabled');
    link.removeAttribute('aria-label');
    link.removeAttribute('title');
    link.querySelector('small')?.remove();
  });
  const object = document.getElementById('mechanism');
  const button = document.getElementById('motion-toggle');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  function updateMotion() {
    const root = object.contentDocument?.documentElement;
    if (!root) return;
    root.classList.toggle('paused', paused);
    if (paused) root.pauseAnimations?.(); else root.unpauseAnimations?.();
    button.innerHTML = paused ? '<span aria-hidden="true">▷</span> Play' : '<span aria-hidden="true">Ⅱ</span> Pause';
    button.setAttribute('aria-pressed', String(paused));
  }
  function initializeMotion() {
    if (object.contentDocument?.documentElement?.localName !== 'svg') return;
    button.disabled = false;
    updateMotion();
  }
  object.addEventListener('load', initializeMotion);
  initializeMotion();
  button.addEventListener('click', () => { paused = !paused; updateMotion(); });
  reduced.addEventListener('change', e => { paused = e.matches; updateMotion(); });
  document.getElementById('copy-citation').addEventListener('click', async () => {
    const text = document.getElementById('bibtex').textContent;
    const status = document.getElementById('copy-status');
    try {
      await navigator.clipboard.writeText(text);
      document.getElementById('copy-citation').textContent = 'Copied!';
      status.textContent = 'BibTeX copied to clipboard.';
      setTimeout(() => { document.getElementById('copy-citation').textContent = 'Copy BibTeX'; }, 2200);
    } catch {
      const range = document.createRange(); range.selectNodeContents(document.getElementById('bibtex'));
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      status.textContent = 'Select and copy the highlighted BibTeX.';
    }
  });
})();
