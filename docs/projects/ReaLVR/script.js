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
  const replay = document.getElementById('motion-replay');
  const seek = document.getElementById('motion-seek');
  const time = document.getElementById('motion-time');
  const chapterNav = document.getElementById('motion-chapters');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let inView = false;
  let animations = [];
  let duration = 54;
  let chapters = [];
  let frame = 0;
  let lastPaint = 0;
  let position = 0;
  const stamp = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  function readPosition() {
    const clock = animations[0]?.currentTime;
    if (typeof clock === 'number') position = (clock / 1000) % duration;
    return position;
  }
  function paintProgress() {
    const seconds = readPosition();
    seek.value = String(seconds);
    const label = `${stamp(seconds)} / ${stamp(duration)}`;
    if (time.textContent !== label) time.textContent = label;
    seek.setAttribute('aria-valuetext', `${stamp(seconds)} of ${stamp(duration)}`);
    const current = chapters.reduce((last, chapter, i) => seconds >= chapter.time ? i : last, 0);
    chapterNav.querySelectorAll('button').forEach((chapter, i) => {
      if (i === current) chapter.setAttribute('aria-current', 'step');
      else chapter.removeAttribute('aria-current');
    });
  }
  function tick(now) {
    if (now - lastPaint >= 100) { paintProgress(); lastPaint = now; }
    if (!paused && inView && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function enableMotion() {
    const root = object.contentDocument?.documentElement;
    if (!root) return;
    root.classList.add('motion-enabled');
    animations = object.contentDocument.getAnimations();
  }
  function updateMotion() {
    const root = object.contentDocument?.documentElement;
    if (!root) return;
    const running = !paused && inView && !document.hidden;
    root.classList.toggle('paused', !running);
    animations.forEach(animation => running ? animation.play() : animation.pause());
    button.innerHTML = paused ? '<span aria-hidden="true">▷</span> Play' : '<span aria-hidden="true">Ⅱ</span> Pause';
    button.setAttribute('aria-pressed', String(paused));
    cancelAnimationFrame(frame);
    paintProgress();
    if (running) frame = requestAnimationFrame(tick);
  }
  function jump(seconds) {
    enableMotion();
    position = Math.max(0, Math.min(duration - 0.05, seconds));
    animations.forEach(animation => { animation.currentTime = position * 1000; });
    updateMotion();
  }
  function initializeMotion() {
    const root = object.contentDocument?.documentElement;
    if (root?.localName !== 'svg') return;
    duration = Number(root.dataset.duration) || 54;
    try { chapters = JSON.parse(root.querySelector('#realvr-timeline')?.textContent || '[]'); }
    catch { chapters = []; }
    seek.max = String(duration);
    chapterNav.replaceChildren();
    chapters.forEach((chapter, i) => {
      const item = document.createElement('button');
      item.type = 'button';
      const number = document.createElement('span');
      number.textContent = String(i + 1).padStart(2, '0');
      item.append(number, document.createTextNode(chapter.label));
      item.setAttribute('aria-label', `${chapter.label}, ${stamp(chapter.time)}`);
      item.addEventListener('click', () => { paused = false; jump(chapter.time + 0.35); });
      chapterNav.append(item);
    });
    button.disabled = replay.disabled = seek.disabled = false;
    if (!reduced.matches) enableMotion();
    animations.forEach(animation => { animation.currentTime = 0; });
    updateMotion();
  }
  object.addEventListener('load', initializeMotion);
  initializeMotion();
  button.addEventListener('click', () => {
    paused = !paused;
    if (!paused && !animations.length) jump(0);
    else updateMotion();
  });
  replay.addEventListener('click', () => { paused = false; jump(0); });
  seek.addEventListener('input', () => jump(Number(seek.value)));
  reduced.addEventListener('change', e => {
    paused = e.matches;
    if (!paused) enableMotion();
    updateMotion();
  });
  document.addEventListener('visibilitychange', updateMotion);
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    updateMotion();
  }, { threshold: 0.15 }).observe(object);
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
