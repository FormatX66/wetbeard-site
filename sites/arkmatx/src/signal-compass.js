const params = new URLSearchParams(location.search);
const explicitIdentity = params.get('login') || params.get('user');
let identity = explicitIdentity || localStorage.getItem('arkmatx-visitor-id');
if (!identity) {
  identity = globalThis.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random()}`;
  localStorage.setItem('arkmatx-visitor-id', identity);
}

function hash32(value) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const identityHash = hash32(identity).toString(36);
const discoveryKey = `arkmatx-discoveries:${identityHash}`;
const repoUrl = 'https://github.com/FormatX66/wetbeard-site';
const memoryUrl = `${repoUrl}/tree/main/gpt-workflow-memory`;
const stagingUrl = 'https://arkmatx.com/staging/';

const missions = [
  {
    title: 'SURVEY THE WORKSHOP',
    scene: 'workshop',
    targets: ['BRAIN CONNECT CRT', 'WORLD MAP', 'SERVER CLOSET'],
  },
  {
    title: 'TRACE THE WORLD BUS',
    scene: 'servers',
    targets: ['MOSS NODE', 'PAPER NODE', 'INK NODE', 'LOOPBACK'],
  },
  {
    title: 'RESOLVE THE CONTRADICTION',
    scene: 'paradox',
    targets: ['TERMINAL A', 'TERMINAL C', 'MAINTENANCE CHANNEL 0'],
  },
  {
    title: 'LOCK THE RADIO CARRIER',
    scene: 'workshop',
    targets: ['WORLD BUS RADIO SEQUENCE'],
  },
];

function readDiscoveries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(discoveryKey) || '{"items":[]}');
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function status() {
  const found = new Set(readDiscoveries().map(item => item.label));
  const details = missions.map(mission => {
    const completed = mission.targets.filter(target => found.has(target));
    const missing = mission.targets.filter(target => !found.has(target));
    return { ...mission, completed, missing, done: missing.length === 0 };
  });
  return {
    details,
    complete: details.every(mission => mission.done),
    finished: details.filter(mission => mission.done).length,
  };
}

function navigate(scene) {
  if (window.__arkmatxSceneNavigator) {
    window.dispatchEvent(new CustomEvent('arkmatx:navigate', {
      detail: { scene, history: 'push', source: 'signal-compass' },
    }));
    return;
  }
  const url = new URL(location.href);
  url.searchParams.set('scene', scene);
  location.href = url.toString();
}

function injectStyle() {
  if (document.querySelector('#signal-compass-style')) return;
  const style = document.createElement('style');
  style.id = 'signal-compass-style';
  style.textContent = `
    #signalCompass{position:absolute;right:162px;bottom:18px;z-index:12;width:40px;height:40px;border-radius:50%;border:1px solid #667268;background:#070c09bb;color:#aab7aa;font:700 14px ui-monospace,monospace;cursor:pointer}
    #signalCompass:hover,#signalCompass:focus{border-color:#9bebb0;color:#d7e8d8;outline:none}
    #signalCompass.complete{border-color:#b99a54;color:#e8d39f;box-shadow:0 0 18px #c9a85a33}
    @media(max-width:700px){#signalCompass{right:156px;bottom:12px}}
  `;
  document.head.append(style);
}

function bindExternal(id, url) {
  const button = document.querySelector(id);
  if (button) button.onclick = () => { location.href = url; };
}

function openCompass() {
  const modal = document.querySelector('#modal');
  const tag = document.querySelector('#tag');
  const title = document.querySelector('#title');
  const copy = document.querySelector('#copy');
  const actions = document.querySelector('#actions');
  if (!modal || !tag || !title || !copy || !actions) return;

  const current = status();
  const lines = current.details.map(mission => {
    const marker = mission.done ? '✓' : '·';
    const progress = `${mission.completed.length}/${mission.targets.length}`;
    const next = mission.missing[0] ? `\n  NEXT: ${mission.missing[0]}` : '';
    return `[${marker}] ${mission.title} .... ${progress}${next}`;
  });
  const nextMission = current.details.find(mission => !mission.done);

  tag.textContent = 'LOCAL SIGNAL COMPASS';
  title.textContent = current.complete ? 'DEVELOPER CHANNEL' : 'ACTIVE MISSIONS';
  copy.textContent = `${lines.join('\n\n')}\n\nMISSION CLEARANCE ... ${current.finished}/${missions.length}${current.complete ? '\nDEVELOPER CHANNEL ... UNLOCKED' : `\nCURRENT VECTOR ...... ${nextMission?.scene.toUpperCase() || 'WORKSHOP'}`}`;

  if (current.complete) {
    actions.innerHTML = '<button type="button" id="compassSource">ARKMATX SOURCE</button><button type="button" id="compassMemory">WORKFLOW MEMORY</button><button type="button" id="compassReview">STAGING REVIEW</button><button type="button" id="compassClose">RETURN TO ROOM</button>';
    bindExternal('#compassSource', `${repoUrl}/tree/main/sites/arkmatx`);
    bindExternal('#compassMemory', memoryUrl);
    bindExternal('#compassReview', stagingUrl);
  } else {
    actions.innerHTML = `<button type="button" id="compassRoute">ROUTE TO ${nextMission.scene.toUpperCase()}</button><button type="button" id="compassClose">RETURN TO ROOM</button>`;
    document.querySelector('#compassRoute').onclick = () => navigate(nextMission.scene);
  }

  document.querySelector('#compassClose').onclick = () => document.querySelector('#close')?.click();
  modal.classList.add('show');
}

function initSignalCompass() {
  const experience = document.querySelector('.experience');
  const hotspots = document.querySelector('#hotspots');
  if (!experience || !hotspots) {
    setTimeout(initSignalCompass, 50);
    return;
  }

  injectStyle();
  let button = document.querySelector('#signalCompass');
  if (!button) {
    button = document.createElement('button');
    button.id = 'signalCompass';
    button.type = 'button';
    button.textContent = 'S';
    button.setAttribute('aria-label', 'open signal compass and missions');
    button.title = 'Signal compass';
    experience.append(button);
  }

  const refresh = () => button.classList.toggle('complete', status().complete);
  button.onclick = openCompass;
  hotspots.addEventListener('click', () => setTimeout(refresh, 0));
  const readout = document.querySelector('#readout');
  if (readout) new MutationObserver(() => setTimeout(refresh, 0)).observe(readout, { childList: true, characterData: true, subtree: true });
  const modal = document.querySelector('#modal');
  if (modal) new MutationObserver(() => setTimeout(refresh, 0)).observe(modal, { attributes: true, attributeFilter: ['class'] });
  refresh();
}

if (document.readyState === 'complete') queueMicrotask(initSignalCompass);
else window.addEventListener('load', initSignalCompass, { once: true });
