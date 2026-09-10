function appearanceBootstrap(palettes) {
  const paletteKey = 'gentask-palette';
  const mediaKey = 'astryx-media';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const read = (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* Keep the in-memory choice. */ }
  };
  let palette = read(paletteKey) ?? 'neutral';
  let preference = read(mediaKey);
  const names = new Set(Object.values(palettes).flatMap(tokens => Object.keys(tokens)));
  const apply = () => {
    if (!Object.prototype.hasOwnProperty.call(palettes, palette)) palette = 'neutral';
    const media = preference === 'light' || preference === 'dark' ? preference : system.matches ? 'dark' : 'light';
    const tokens = palettes[palette] ?? {};
    for (const name of names) {
      const pair = tokens[name];
      if (pair) document.body.style.setProperty(name, `light-dark(${pair[0]}, ${pair[1]})`);
      else document.body.style.removeProperty(name);
    }
    document.body.setAttribute('data-gentask-palette', palette);
    document.body.setAttribute('data-astryx-media', media);
    document.getElementById('app-favicon')?.setAttribute('href', `/brand/favicon-${media}.svg`);
    const background = tokens['--color-background-body'] ?? ['#f1f1f1', '#1b1b1b'];
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background[media === 'dark' ? 1 : 0]);
    window.dispatchEvent(new Event('gentask-appearance-applied'));
  };
  window.addEventListener('gentask-appearance-change', event => {
    const detail = event.detail;
    if (detail.palette !== undefined) {
      palette = Object.prototype.hasOwnProperty.call(palettes, detail.palette) ? detail.palette : 'neutral';
      save(paletteKey, palette);
    }
    if (detail.media === 'light' || detail.media === 'dark') {
      preference = detail.media;
      save(mediaKey, preference);
    }
    apply();
  });
  window.addEventListener('storage', event => {
    if (event.key === paletteKey || event.key === mediaKey || event.key === null) {
      palette = read(paletteKey) ?? 'neutral';
      preference = read(mediaKey);
      apply();
    }
  });
  system.addEventListener('change', apply);
  apply();
}
