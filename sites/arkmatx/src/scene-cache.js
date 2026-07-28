const base = import.meta.env.BASE_URL || '/';
const nativeFetch = window.fetch.bind(window);
const payloadCache = new Map();
const inFlight = new Map();
const state = {
  status: 'warming',
  hits: 0,
  misses: 0,
  entries: 0,
  preloaded: [],
  errors: [],
  loading: null,
  lastLoadMs: null,
};
window.__arkmatxSceneCache = state;

function normalizedUrl(input) {
  const value = input instanceof Request ? input.url : String(input);
  return new URL(value, location.href).href;
}

function isScenePayload(url) {
  const target = new URL(url, location.href);
  return target.origin === location.origin
    && target.pathname.includes('/scenes/')
    && (target.pathname.endsWith('.txt') || target.pathname.endsWith('.json'));
}

function responseFrom(record) {
  return new Response(record.body.slice(0), {
    status: record.status,
    statusText: record.statusText,
    headers: record.headers,
  });
}

async function capture(url, init) {
  if (payloadCache.has(url)) return responseFrom(payloadCache.get(url));
  if (inFlight.has(url)) {
    await inFlight.get(url);
    return responseFrom(payloadCache.get(url));
  }

  const task = nativeFetch(url, init).then(async response => {
    if (!response.ok) throw new Error(`${new URL(url).pathname}: ${response.status}`);
    const clone = response.clone();
    const record = {
      body: await clone.arrayBuffer(),
      status: response.status,
      statusText: response.statusText,
      headers: [...response.headers.entries()],
    };
    payloadCache.set(url, record);
    state.entries = payloadCache.size;
    return record;
  }).finally(() => inFlight.delete(url));

  inFlight.set(url, task);
  await task;
  return responseFrom(payloadCache.get(url));
}

window.fetch = async function arkmatxSceneFetch(input, init) {
  const url = normalizedUrl(input);
  if (!isScenePayload(url)) return nativeFetch(input, init);

  if (payloadCache.has(url) || inFlight.has(url)) state.hits += 1;
  else state.misses += 1;

  try {
    return await capture(url, init);
  } catch (error) {
    state.errors.push(error.message);
    return nativeFetch(input, init);
  }
};

function sceneSpecs(manifest, variant) {
  return {
    ...(manifest.scenes || {}),
    ...(manifest.variants?.[variant]?.scenes || {}),
  };
}

async function encodedScene(spec) {
  if (spec.file) {
    const response = await fetch(`${base}scenes/${spec.file}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${spec.file}: ${response.status}`);
    return response.text();
  }

  const parts = await Promise.all(
    Array.from({ length: spec.parts || 0 }, (_, index) =>
      fetch(`${base}scenes/${spec.prefix}.part${index}.txt`, { cache: 'no-store' })
        .then(response => {
          if (!response.ok) throw new Error(`${spec.prefix}.${index}: ${response.status}`);
          return response.text();
        })
    )
  );
  return parts.join('');
}

async function decodeDataScene(name, spec) {
  const encoded = await encodedScene(spec);
  const image = new Image();
  image.src = `data:${spec.mime || 'image/jpeg'};base64,${encoded.trim()}`;
  await image.decode();
  state.preloaded.push(name);
}

async function decodeDirectScene(name, path) {
  const image = new Image();
  image.src = `${base}scenes/${path}`;
  await image.decode();
  state.preloaded.push(name);
}

async function warmScenes() {
  try {
    const response = await fetch(`${base}scenes/render-manifest.json`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`render manifest: ${response.status}`);
    const manifest = await response.json();

    let variant = document.body.dataset.variant;
    for (let attempt = 0; !variant && attempt < 80; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 25));
      variant = document.body.dataset.variant;
    }
    variant ||= 'core';

    const specs = sceneSpecs(manifest, variant);
    const results = await Promise.allSettled(
      Object.entries(specs).map(([name, spec]) => decodeDataScene(name, spec))
    );
    const direct = await Promise.allSettled([
      decodeDirectScene('servers-direct', 'servers-render.jpg'),
    ]);

    for (const result of [...results, ...direct]) {
      if (result.status === 'rejected') state.errors.push(result.reason?.message || String(result.reason));
    }
    state.preloaded = [...new Set(state.preloaded)];
    state.status = state.errors.length ? 'degraded' : 'ready';
  } catch (error) {
    state.errors.push(error.message);
    state.status = 'degraded';
  }
  document.body.dataset.sceneCache = state.status;
}

function installLoadingState() {
  const viewport = document.querySelector('#viewport');
  const hotspots = document.querySelector('#hotspots');
  const background = document.querySelector('#sceneBg');
  const transition = document.querySelector('#transition');
  if (!viewport || !hotspots || !background || !transition) {
    setTimeout(installLoadingState, 40);
    return;
  }

  if (!document.querySelector('#scene-cache-style')) {
    const style = document.createElement('style');
    style.id = 'scene-cache-style';
    style.textContent = `
      .transition.scene-loading{opacity:.82;background:#030807e8;font-size:clamp(13px,2.4vw,22px)}
      .transition.scene-loading:after{content:"";display:block;width:112px;height:2px;margin-top:18px;background:linear-gradient(90deg,transparent,#9bebb0,transparent);animation:sceneLoadSweep 1s ease-in-out infinite}
      @keyframes sceneLoadSweep{0%,100%{transform:scaleX(.18);opacity:.35}50%{transform:scaleX(1);opacity:1}}
      @media(prefers-reduced-motion:reduce){.transition.scene-loading:after{animation:none}}
    `;
    document.head.append(style);
  }

  let startedAt = 0;
  let timeout = 0;

  const finish = () => {
    if (!state.loading) return;
    state.lastLoadMs = Math.max(0, Math.round(performance.now() - startedAt));
    state.loading = null;
    delete document.body.dataset.sceneLoading;
    viewport.setAttribute('aria-busy', 'false');
    clearTimeout(timeout);
    requestAnimationFrame(() => transition.classList.remove('scene-loading'));
  };

  const start = name => {
    state.loading = name;
    startedAt = performance.now();
    document.body.dataset.sceneLoading = name;
    viewport.setAttribute('aria-busy', 'true');
    transition.textContent = `LOADING ${name.toUpperCase()}…`;
    transition.classList.add('scene-loading');
    clearTimeout(timeout);
    timeout = setTimeout(finish, 8000);
  };

  hotspots.addEventListener('click', event => {
    const polygon = event.target.closest?.('polygon[data-target^="scene-"]');
    if (!polygon) return;
    start(polygon.dataset.target.slice(6));
  }, true);

  background.addEventListener('load', finish);
  background.addEventListener('error', finish);
}

installLoadingState();
warmScenes();
