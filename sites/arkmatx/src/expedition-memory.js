const SCENES = ['workshop', 'servers', 'paradox'];
const SCENE_LABELS = {
  workshop: 'WORKSHOP',
  servers: 'SERVER CLOSET',
  paradox: 'PARADOX TERMINAL',
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

function navigate(scene) {
  if (!SCENES.includes(scene)) return;
  const url = new URL(location.href);
  url.searchParams.set('scene', scene);
  location.href = url.toString();
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

function openJournal({ modal, tag, title, copy, actions, locationNode }) {
  const scene = currentScene(locationNode) || state.lastScene;
  const visited = state.visited.map(item => item.toUpperCase()).join(' · ');
  tag.textContent = 'LOCAL EXPEDITION MEMORY';
  title.textContent = 'FIELD JOURNAL';
  copy.textContent = `IDENTITY SLOT .... ${identityHash.toUpperCase()}\nCURRENT ROOM ..... ${scene.toUpperCase()}\nVISITED .......... ${visited}\nLAST UPDATE ...... ${state.updatedAt || 'new expedition'}\n\nThis journal stays in this browser and is isolated per login. Shared world flags continue to use the ArkmatX world bus.`;
  actions.innerHTML = state.visited
    .map(item => `<button type="button" data-journal-scene="${item}">${item.toUpperCase()}</button>`)
    .join('');
  actions.querySelectorAll('[data-journal-scene]').forEach(button => {
    button.onclick = () => navigate(button.dataset.journalScene);
  });
  modal.classList.add('show');
}

function restoreScene(locationNode, hotspots, desired) {
  if (!SCENES.includes(desired) || desired === 'workshop') return;

  const label = SCENE_LABELS[desired];
  let attempts = 0;
  const tryOpen = () => {
    attempts += 1;
    if (currentScene(locationNode) === desired) return;
    const target = hotspots.querySelector(`polygon[aria-label="${label}"]`);
    if (target) {
      target.click();
      return;
    }
    if (attempts < 80) setTimeout(tryOpen, 50);
  };
  setTimeout(tryOpen, 80);
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
  if (!experience || !locationNode || !hotspots || !modal || !tag || !title || !copy || !actions) {
    setTimeout(initExpeditionMemory, 50);
    return;
  }

  injectStyle();
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
  journal.onclick = () => openJournal({ modal, tag, title, copy, actions, locationNode });

  const record = () => {
    const scene = currentScene(locationNode);
    if (scene) writeState(scene);
  };
  new MutationObserver(record).observe(locationNode, { childList: true, characterData: true, subtree: true });

  const params = new URLSearchParams(location.search);
  const requested = params.get('scene');
  const resumeEnabled = params.get('noresume') !== '1';
  const desired = SCENES.includes(requested)
    ? requested
    : (resumeEnabled ? state.lastScene : 'workshop');
  if (desired === 'workshop') record();
  else restoreScene(locationNode, hotspots, desired);
}

if (document.readyState === 'complete') queueMicrotask(initExpeditionMemory);
else window.addEventListener('load', initExpeditionMemory, { once: true });
