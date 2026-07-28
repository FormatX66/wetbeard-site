const base = import.meta.env.BASE_URL || '/';
const asset = path => `${base}${String(path).replace(/^\/+/, '')}`;

const runtime = {
  manifest: null,
  manifestPromise: null,
  sources: new Map(),
  decoded: new Map(),
  activeToken: 0,
  retryTimers: new Map(),
  retryCounts: new Map(),
};

function sceneSpec(sceneName) {
  const variant = document.body.dataset.variant || 'core';
  return runtime.manifest?.variants?.[variant]?.scenes?.[sceneName]
    || runtime.manifest?.scenes?.[sceneName]
    || runtime.manifest?.[sceneName]
    || null;
}

async function loadManifest() {
  if (runtime.manifest) return runtime.manifest;
  if (!runtime.manifestPromise) {
    runtime.manifestPromise = fetch(asset('scenes/render-manifest.json'), { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error(`render manifest: ${response.status}`);
        return response.json();
      })
      .then(manifest => {
        runtime.manifest = manifest;
        return manifest;
      })
      .catch(error => {
        runtime.manifestPromise = null;
        throw error;
      });
  }
  return runtime.manifestPromise;
}

async function sourceFor(sceneName) {
  await loadManifest();
  const variant = document.body.dataset.variant || 'core';
  const cacheKey = `${variant}:${sceneName}`;
  if (runtime.sources.has(cacheKey)) return runtime.sources.get(cacheKey);

  const spec = sceneSpec(sceneName);
  if (!spec) throw new Error(`missing raster specification for ${cacheKey}`);

  let encoded = '';
  if (spec.file) {
    const response = await fetch(asset(`scenes/${spec.file}`), { cache: 'no-store' });
    if (!response.ok) throw new Error(`${sceneName} raster file: ${response.status}`);
    encoded = await response.text();
  } else {
    const partCount = Number(spec.parts || 0);
    if (!spec.prefix || partCount < 1) throw new Error(`invalid raster chunks for ${cacheKey}`);
    const parts = await Promise.all(
      Array.from({ length: partCount }, async (_, index) => {
        const response = await fetch(asset(`scenes/${spec.prefix}.part${index}.txt`), { cache: 'no-store' });
        if (!response.ok) throw new Error(`${sceneName} raster chunk ${index}: ${response.status}`);
        return response.text();
      })
    );
    encoded = parts.join('');
  }

  const source = `data:${spec.mime || 'image/jpeg'};base64,${encoded.trim()}`;
  runtime.sources.set(cacheKey, source);
  return source;
}

async function decodeSource(cacheKey, source) {
  if (runtime.decoded.has(cacheKey)) return runtime.decoded.get(cacheKey);
  const decoded = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error(`zero-sized raster for ${cacheKey}`));
        return;
      }
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => reject(new Error(`decode failed for ${cacheKey}`));
    image.src = source;
  });
  runtime.decoded.set(cacheKey, decoded);
  try {
    return await decoded;
  } catch (error) {
    runtime.decoded.delete(cacheKey);
    throw error;
  }
}

function injectGuardStyle() {
  if (document.querySelector('#scene-integrity-style')) return;
  const style = document.createElement('style');
  style.id = 'scene-integrity-style';
  style.textContent = `
    #sceneBg[src$=".svg"],#sceneBg[data-raster-state="loading"],#sceneBg[data-raster-state="error"]{opacity:0!important}
    #sceneSignal{position:absolute;left:50%;top:50%;z-index:4;translate:-50% -50%;min-width:min(420px,72vw);padding:18px 22px;border:1px solid #4f6658;background:#040806e8;color:#91a597;text-align:center;font:11px/1.7 ui-monospace,monospace;letter-spacing:.12em;pointer-events:none;transition:opacity .22s ease}
    #sceneSignal[data-state="ready"]{opacity:0}
    #sceneSignal[data-state="loading"]{opacity:.86}
    #sceneSignal[data-state="error"]{opacity:1;border-color:#8d644f;color:#d6aa8d}
  `;
  document.head.append(style);
}

function ensureSignal(viewport) {
  let signal = document.querySelector('#sceneSignal');
  if (!signal) {
    signal = document.createElement('div');
    signal.id = 'sceneSignal';
    signal.setAttribute('role', 'status');
    signal.setAttribute('aria-live', 'polite');
    signal.dataset.state = 'loading';
    signal.textContent = 'ACQUIRING RENDERED ENVIRONMENT';
    viewport.append(signal);
  }
  return signal;
}

function setState(background, signal, state, detail = '') {
  background.dataset.rasterState = state;
  signal.dataset.state = state;
  if (state === 'loading') signal.textContent = `ACQUIRING ${detail.toUpperCase()} RENDER`;
  if (state === 'ready') signal.textContent = `${detail.toUpperCase()} RENDER LOCKED`;
  if (state === 'error') signal.textContent = `${detail.toUpperCase()} RASTER SIGNAL DEGRADED // RETRYING`;
}

function clearRetry(sceneName) {
  const timer = runtime.retryTimers.get(sceneName);
  if (timer) clearTimeout(timer);
  runtime.retryTimers.delete(sceneName);
  runtime.retryCounts.delete(sceneName);
}

function scheduleRetry(sceneName, enforce) {
  if (runtime.retryTimers.has(sceneName)) return;
  const attempt = (runtime.retryCounts.get(sceneName) || 0) + 1;
  runtime.retryCounts.set(sceneName, attempt);
  const delay = Math.min(30000, 1000 * (2 ** Math.min(attempt - 1, 5)));
  const timer = setTimeout(() => {
    runtime.retryTimers.delete(sceneName);
    enforce(sceneName, true);
  }, delay);
  runtime.retryTimers.set(sceneName, timer);
}

function isDecodedRaster(background) {
  return background.src.startsWith('data:image/')
    && background.complete
    && background.naturalWidth > 0
    && background.naturalHeight > 0;
}

function initSceneIntegrity() {
  const background = document.querySelector('#sceneBg');
  const viewport = document.querySelector('#viewport');
  if (!background || !viewport) {
    setTimeout(initSceneIntegrity, 40);
    return;
  }

  injectGuardStyle();
  const signal = ensureSignal(viewport);

  async function enforce(sceneName = background.dataset.scene, forced = false) {
    if (!sceneName) return;
    const variant = document.body.dataset.variant || 'core';
    const cacheKey = `${variant}:${sceneName}`;

    if (!forced && isDecodedRaster(background)) {
      background.dataset.rasterProvenance = `runtime:${cacheKey}`;
      setState(background, signal, 'ready', sceneName);
      clearRetry(sceneName);
      return;
    }

    const token = ++runtime.activeToken;
    setState(background, signal, 'loading', sceneName);

    try {
      const source = await sourceFor(sceneName);
      const dimensions = await decodeSource(cacheKey, source);
      if (token !== runtime.activeToken || background.dataset.scene !== sceneName) return;

      if (background.src !== source) background.src = source;
      if (!background.complete || !background.naturalWidth) await background.decode();
      if (token !== runtime.activeToken || background.dataset.scene !== sceneName) return;
      if (!background.naturalWidth || !background.naturalHeight) throw new Error(`zero-sized active raster for ${cacheKey}`);

      background.dataset.rasterProvenance = `manifest:${cacheKey}`;
      background.dataset.rasterWidth = String(dimensions.width);
      background.dataset.rasterHeight = String(dimensions.height);
      setState(background, signal, 'ready', sceneName);
      clearRetry(sceneName);
    } catch (error) {
      if (token !== runtime.activeToken || background.dataset.scene !== sceneName) return;
      background.dataset.rasterError = String(error?.message || error);
      setState(background, signal, 'error', sceneName);
      scheduleRetry(sceneName, enforce);
    }
  }

  const observer = new MutationObserver(records => {
    if (records.some(record => record.attributeName === 'data-scene' || record.attributeName === 'src')) {
      queueMicrotask(() => enforce());
    }
  });
  observer.observe(background, { attributes: true, attributeFilter: ['data-scene', 'src'] });
  background.addEventListener('error', () => enforce(background.dataset.scene, true));

  loadManifest()
    .then(manifest => {
      const sceneNames = Object.keys(manifest.scenes || {});
      return Promise.allSettled(sceneNames.map(async sceneName => {
        const variant = document.body.dataset.variant || 'core';
        const source = await sourceFor(sceneName);
        return decodeSource(`${variant}:${sceneName}`, source);
      }));
    })
    .catch(() => {});

  globalThis.__arkmatxSceneIntegrity = {
    enforce: () => enforce(background.dataset.scene, true),
    snapshot: () => ({
      scene: background.dataset.scene || null,
      state: background.dataset.rasterState || null,
      provenance: background.dataset.rasterProvenance || null,
      width: background.naturalWidth || 0,
      height: background.naturalHeight || 0,
      vectorFallbackVisible: background.src.endsWith('.svg'),
      cachedSources: [...runtime.sources.keys()],
    }),
  };

  enforce();
}

if (document.readyState === 'complete') queueMicrotask(initSceneIntegrity);
else window.addEventListener('load', initSceneIntegrity, { once: true });
