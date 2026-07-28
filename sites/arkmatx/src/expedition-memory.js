const SCENES = ['workshop', 'servers', 'paradox'];
const SCENE_LABELS = {
  workshop: ['WORKSHOP'],
  servers: ['SERVER CLOSET'],
  paradox: ['PARADOX TERMINAL', 'PARADOX'],
};

function hash32(value) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function identity() {
  const params = new URLSearchParams(location.search);
  const explicit = params.get('login') || params.get('user');
  if (explicit) return explicit;

  let visitor = localStorage.getItem('arkmatx-visitor-id');
  if (!visitor) {
    visitor = globalThis.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random()}`;
    localStorage.setItem('arkmatx-visitor-id', visitor);
  }
  return visitor;
}

const identityHash = hash32(identity()).toString(36);
const storageKey = `arkmatx-expedition:${identityHash}`;

function readState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const visited = Array.isArray(parsed.visited)
      ? parsed.visited.filter(scene => SCENES.includes(scene))
      : [];
    const lastScene = SCENES.includes(parsed.lastScene) ? parsed.lastScene : 'workshop';
    return {
      lastScene,
      visited: [...new Set(['workshop', ...visited])],
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return { lastScene: 'workshop', visited: ['workshop'], updatedAt: null };
  }
}

let state = readState();

function writeState(scene) {
  if (!SCENES.includes(scene)) return;
  state = {
    lastScene: scene,
    visited: [...new Set([...state.visited, scene])],
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function currentScene(locationNode) {
  const value = (locationNode?.textContent || '').split('//')[0].trim().toLowerCase();
  return SCENES.includes(value) ? value : null;
}

function updateSceneUrl(scene, mode = 'replace') {
  if (!SCENES.includes(scene) || mode === 'none') return;
  const url = new URL(location.href);
  if (url.searchParams.get('scene') === scene) return;
  url.searchParams.set('scene', scene);
  history[mode === 'push' ? 'pushState' : 'replaceState']({ arkmatxScene: scene }, '', url);
}

function activateHotspot(target) {
  target.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
  }));
}

function injectStyle() {
  if (document.querySelector('#expedition-memory-style')) return;
  const style = document.createElement('style');
  style.id = 'expedition-memory-style';
  style.textContent = `
    #journal{position:absolute;right:66px;bottom:18px;z-index:12;width:40px;height:40px;border-radius:50%;border:1px solid #667268;background:#070c09bb;color:#aab7aa;font:700 14px ui-monospace,monospace;cursor:pointer}
    #journal:hover,#journal:focus{border-color:#9bebb0;color:#d7e8d8;outline:none}
    @media(max-width:700px){#journal{right:60px;bottom:12px}}
  `;
  document.head.append(style);
}

function openJournal({ modal, tag, title, copy, actions, locationNode, requestScene }) {
  const scene = currentScene(locationNode) || state.lastScene;
  const visited = state.visited.map(item => item.toUpperCase()).join(' · ');
  tag.textContent = 'LOCAL EXPEDITION MEMORY';
  title.textContent = 'FIELD JOURNAL';
  copy.textContent = `IDENTITY SLOT .... ${identityHash.toUpperCase()}\nCURRENT ROOM ..... ${scene.toUpperCase()}\nVISITED .......... ${visited}\nLAST UPDATE ...... ${state.updatedAt || 'new expedition'}\n\nThis journal stays in this browser and is isolated per login. Shared world flags continue to use the ArkmatX world bus.`;
  actions.innerHTML = state.visited
    .map(item => `<button type="button" data-journal-scene="${item}">${item.toUpperCase()}</button>`)
    .join('');
  actions.querySelectorAll('[data-journal-scene]').forEach(button => {
    button.onclick = () => requestScene(button.dataset.journalScene, 'push');
  });
  modal.classList.add('show');
}

function initExpeditionMemory() {
  const experience = document.querySelector('.experience');
  const locationNode = document.querySelector('#location');
  const hotspots = document.querySelector('#hotspots');
  const modal = document.querySelector('#modal');
  const tag = document.querySelector('#tag');
  const title = document.querySelector('#title');
  const copy = document.querySelector('#copy');
  const actions = document.querySelector('#actions');
  const close = document.querySelector('#close');
  if (!experience || !locationNode || !hotspots || !modal || !tag || !title || !copy || !actions || !close) {
    setTimeout(initExpeditionMemory, 50);
    return;
  }

  injectStyle();

  let pendingHistoryMode = 'replace';
  let requestedHistoryMode = null;
  let navigationToken = 0;
  let booting = true;

  const settleScene = (scene, token, mode) => {
    let attempts = 0;
    const check = () => {
      if (token !== navigationToken) return;
      if (currentScene(locationNode) === scene) {
        if (booting) {
          booting = false;
          writeState(scene);
          updateSceneUrl(scene, mode);
          window.dispatchEvent(new CustomEvent('arkmatx:scenechange', {
            detail: { scene, source: 'expedition-memory' },
          }));
        }
        return;
      }
      attempts += 1;
      if (attempts < 80) setTimeout(check, 100);
    };
    setTimeout(check, 0);
  };

  const requestScene = (scene, mode = 'push') => {
    if (!SCENES.includes(scene)) return false;
    const active = currentScene(locationNode);
    close.click();

    if (active === scene) {
      writeState(scene);
      if (booting) booting = false;
      updateSceneUrl(scene, mode);
      return true;
    }

    const labels = SCENE_LABELS[scene] || [];
    const target = labels
      .map(label => hotspots.querySelector(`polygon[aria-label="${label}"]`))
      .find(Boolean);
    if (!target) return false;

    requestedHistoryMode = mode;
    const token = ++navigationToken;
    activateHotspot(target);
    settleScene(scene, token, mode);
    return true;
  };

  const queueSceneRequest = (scene, mode = 'push') => {
    let attempts = 0;
    const tryRoute = () => {
      attempts += 1;
      if (requestScene(scene, mode)) return;
      if (attempts < 80) setTimeout(tryRoute, 100);
    };
    tryRoute();
  };

  let journal = document.querySelector('#journal');
  if (!journal) {
    journal = document.createElement('button');
    journal.id = 'journal';
    journal.type = 'button';
    journal.textContent = 'J';
    journal.setAttribute('aria-label', 'open field journal');
    journal.title = 'Field journal';
    experience.append(journal);
  }
  journal.onclick = () => openJournal({
    modal,
    tag,
    title,
    copy,
    actions,
    locationNode,
    requestScene: queueSceneRequest,
  });

  hotspots.addEventListener('click', event => {
    const target = event.target.closest?.('polygon')?.dataset.target || '';
    if (!target.startsWith('scene-')) return;
    pendingHistoryMode = requestedHistoryMode || 'push';
    requestedHistoryMode = null;
  }, true);

  const record = () => {
    const scene = currentScene(locationNode);
    if (!scene) return;
    writeState(scene);

    if (booting) return;

    const mode = pendingHistoryMode;
    pendingHistoryMode = 'replace';
    updateSceneUrl(scene, mode);
    window.dispatchEvent(new CustomEvent('arkmatx:scenechange', {
      detail: { scene, source: 'physical-hotspot' },
    }));
  };
  new MutationObserver(record).observe(locationNode, { childList: true, characterData: true, subtree: true });

  window.__arkmatxSceneNavigator = true;
  window.addEventListener('arkmatx:navigate', event => {
    const scene = event.detail?.scene;
    const mode = event.detail?.history || 'push';
    queueSceneRequest(scene, mode);
  });

  window.addEventListener('popstate', () => {
    const requested = new URLSearchParams(location.search).get('scene');
    if (SCENES.includes(requested)) queueSceneRequest(requested, 'none');
  });

  const params = new URLSearchParams(location.search);
  const requested = params.get('scene');
  const resumeEnabled = params.get('noresume') !== '1';
  const desired = SCENES.includes(requested)
    ? requested
    : (resumeEnabled ? state.lastScene : 'workshop');

  const finishBoot = () => {
    const scene = currentScene(locationNode);
    if (!scene) {
      setTimeout(finishBoot, 50);
      return;
    }
    if (scene === desired) {
      booting = false;
      writeState(scene);
      updateSceneUrl(scene, 'replace');
      return;
    }
    queueSceneRequest(desired, 'replace');
  };
  finishBoot();
}

if (document.readyState === 'complete') queueMicrotask(initExpeditionMemory);
else window.addEventListener('load', initExpeditionMemory, { once: true });
