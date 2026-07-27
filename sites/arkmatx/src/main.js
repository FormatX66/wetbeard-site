import './style.css';

const base = import.meta.env.BASE_URL || '/';
const asset = path => `${base}${String(path).replace(/^\/+/, '')}`;
const params = new URLSearchParams(location.search);
const worlds = {
  morri: { label: 'MORRI', url: 'https://madmorrigan.com/morri/' },
  witch: { label: 'WITCHDIX', url: 'https://madmorrigan.com/witchdix/' },
  xander: { label: 'XANDER ZOMBIE', url: 'https://xanderzombie.com/' },
};
const repoUrl = 'https://github.com/FormatX66/wetbeard-site';
const memoryUrl = `${repoUrl}/tree/main/gpt-workflow-memory`;
const stagingUrl = 'https://arkmatx.com/staging/';
const passportKey = 'realm-passport';
const incoming = (params.get('rp') || '').split(',').filter(Boolean);
const passport = new Set([
  ...(localStorage.getItem(passportKey) || '').split(',').filter(Boolean),
  ...incoming,
]);
const savePassport = () => localStorage.setItem(passportKey, [...passport].join(','));
const jump = url => {
  const target = new URL(url);
  target.searchParams.set('rp', [...passport].join(','));
  location.href = target.toString();
};
const openExternal = url => { location.href = url; };
const stateUrl = asset('world-state.php');

let worldState = null;
let activity = null;
let githubStatus = null;
let sceneName = 'workshop';
let renderManifest = {};
let sceneRenders = {};
let activeVariant = 'core';
const logic = { a: false, b: false, c: false };
const radio = [];
const has = flag => passport.has(flag) || Boolean(worldState?.flags?.[flag]);

function hash32(value) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function loginIdentity() {
  const explicit = params.get('login') || params.get('user');
  if (explicit) return explicit;

  let id = localStorage.getItem('arkmatx-visitor-id');
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random()}`;
    localStorage.setItem('arkmatx-visitor-id', id);
  }
  return id;
}

function chooseVariant() {
  const variants = renderManifest?.variants || {};
  const names = Object.keys(variants);
  if (!names.length) return activeVariant;

  const forced = params.get('variant');
  if (forced && variants[forced]) {
    activeVariant = forced;
    sessionStorage.setItem('arkmatx-active-variant', forced);
    return activeVariant;
  }

  const cached = sessionStorage.getItem('arkmatx-active-variant');
  if (cached && variants[cached]) {
    activeVariant = cached;
    return activeVariant;
  }

  activeVariant = names[hash32(loginIdentity()) % names.length];
  sessionStorage.setItem('arkmatx-active-variant', activeVariant);
  return activeVariant;
}

function sceneSpec(name) {
  return renderManifest?.variants?.[activeVariant]?.scenes?.[name]
    || renderManifest?.scenes?.[name]
    || renderManifest?.[name]
    || null;
}

async function loadWorld() {
  try {
    const response = await fetch(stateUrl, { cache: 'no-store' });
    if (!response.ok) return;
    worldState = await response.json();
    for (const [flag, enabled] of Object.entries(worldState.flags || {})) {
      if (enabled) passport.add(flag);
    }
    savePassport();
  } catch {
  }
}

async function pushWorld(flag) {
  passport.add(flag);
  savePassport();
  try {
    const response = await fetch(stateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flag, source: 'arkmatx' }),
    });
    if (response.ok) {
      const payload = await response.json();
      worldState = payload.state || worldState;
    }
  } catch {
  }
}

async function loadRenderManifest() {
  const response = await fetch(asset('scenes/render-manifest.json'), { cache: 'no-store' });
  if (!response.ok) throw new Error(`render manifest: ${response.status}`);
  renderManifest = await response.json();
  chooseVariant();
  document.body.dataset.variant = activeVariant;
}

async function loadSceneRender(name) {
  const cacheKey = `${activeVariant}:${name}`;
  if (sceneRenders[cacheKey]) return sceneRenders[cacheKey];

  const spec = sceneSpec(name);
  if (!spec) return null;

  let encoded;
  if (spec.file) {
    const response = await fetch(asset(`scenes/${spec.file}`), { cache: 'no-store' });
    if (!response.ok) throw new Error(`${name} render file: ${response.status}`);
    encoded = await response.text();
  } else {
    const parts = await Promise.all(
      Array.from({ length: spec.parts || 0 }, (_, index) =>
        fetch(asset(`scenes/${spec.prefix}.part${index}.txt`), { cache: 'no-store' })
          .then(response => {
            if (!response.ok) throw new Error(`${name} render chunk ${index}: ${response.status}`);
            return response.text();
          })
      )
    );
    encoded = parts.join('');
  }

  sceneRenders[cacheKey] = `data:${spec.mime || 'image/jpeg'};base64,${encoded.trim()}`;
  return sceneRenders[cacheKey];
}

const scenes = {
  workshop: {
    bg: asset('scenes/workshop.svg'),
    hot: [
      ['terminal', 'BRAIN CONNECT CRT', '165,315 610,315 610,520 165,520', 'project-terminal'],
      ['bench', 'HARDWARE BENCH', '0,415 625,415 625,735 0,735', 'project-bench'],
      ['bike', 'WET BEARD BIKE', '650,350 1285,350 1285,685 650,685', 'project-bike'],
      ['rack', 'ÜBERCORP RACK', '1010,20 1215,20 1215,390 1010,390', 'project-rack'],
      ['map', 'WORLD MAP', '625,70 1025,70 1025,370 625,370', 'map'],
      ['radio', 'RADIO', '1215,545 1595,545 1595,895 1215,895', 'radio'],
      ['red', 'DO NOT PUSH', '575,635 790,635 790,845 575,845', 'red'],
      ['servers', 'SERVER CLOSET', '1370,145 1595,145 1595,535 1370,535', 'scene-servers'],
      ['paradox', 'PARADOX TERMINAL', '1230,85 1435,85 1435,315 1230,315', 'scene-paradox'],
    ],
  },
  servers: {
    bg: asset('scenes/servers.svg'),
    hot: [
      ['morri', 'MOSS NODE', '330,185 520,185 520,715 330,715', 'server-morri'],
      ['witch', 'PAPER NODE', '520,150 870,150 870,470 520,470', 'server-witch'],
      ['xander', 'INK NODE', '890,165 1130,165 1130,700 890,700', 'server-xander'],
      ['ark', 'LOOPBACK', '1360,80 1590,80 1590,710 1360,710', 'server-ark'],
      ['back', 'WORKSHOP', '75,235 360,235 360,665 75,665', 'scene-workshop'],
      ['next', 'PARADOX', '1135,230 1355,230 1355,665 1135,665', 'scene-paradox'],
    ],
  },
  paradox: {
    bg: asset('scenes/paradox.svg'),
    hot: [
      ['a', 'TERMINAL A', '120,160 545,160 545,625 120,625', 'logic-a'],
      ['b', 'TERMINAL B', '585,160 1015,160 1015,625 585,625', 'logic-b'],
      ['c', 'TERMINAL C', '1055,160 1485,160 1485,625 1055,625', 'logic-c'],
      ['door', 'MAINTENANCE CHANNEL', '570,650 1030,650 1030,785 570,785', 'logic-door'],
      ['back', 'WORKSHOP', '20,745 270,745 270,890 20,890', 'scene-workshop'],
      ['servers', 'SERVER CLOSET', '1330,745 1580,745 1580,890 1330,890', 'scene-servers'],
    ],
  },
};

const app = document.querySelector('#app');
app.innerHTML = `<main class="experience"><div id="viewport" class="viewport"><img id="sceneBg" class="scene-bg" alt=""><div class="ambient ambient-a"></div><div class="ambient ambient-b"></div><svg id="hotspots" class="hotspots" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"></svg><div class="scanlines"></div></div><header><b>ARKMATX</b><span id="location">WORKSHOP</span></header><aside id="readout">Booting actual systems…</aside><button id="hint" aria-label="show clickable areas">?</button><div id="modal" class="modal"><div><button id="close">×</button><small id="tag"></small><h1 id="title"></h1><pre id="copy"></pre><div id="actions"></div></div></div><div id="transition" class="transition"></div></main>`;

const bg = document.querySelector('#sceneBg');
const svg = document.querySelector('#hotspots');
const readout = document.querySelector('#readout');
const modal = document.querySelector('#modal');
const title = document.querySelector('#title');
const copy = document.querySelector('#copy');
const tag = document.querySelector('#tag');
const actions = document.querySelector('#actions');
const transition = document.querySelector('#transition');

const show = (heading, content, kind = 'WORKSHOP OBJECT', buttons = '') => {
  title.textContent = heading;
  copy.textContent = content;
  tag.textContent = kind;
  actions.innerHTML = buttons;
  modal.classList.add('show');
};

document.querySelector('#close').onclick = () => modal.classList.remove('show');

function bindProjectLinks() {
  const source = document.querySelector('#sourceBtn');
  if (source) source.onclick = () => openExternal(`${repoUrl}/tree/main/sites/arkmatx`);
  const memory = document.querySelector('#memoryBtn');
  if (memory) memory.onclick = () => openExternal(memoryUrl);
  const review = document.querySelector('#reviewBtn');
  if (review) review.onclick = () => openExternal(stagingUrl);
}

async function renderScene(name) {
  sceneName = name;
  const scene = scenes[name];
  transition.classList.add('flash');
  setTimeout(() => transition.classList.remove('flash'), 380);

  const cacheKey = `${activeVariant}:${name}`;
  let src = sceneRenders[cacheKey] || scene.bg;
  if (sceneSpec(name) && !sceneRenders[cacheKey]) {
    try {
      src = await loadSceneRender(name) || scene.bg;
    } catch {
      src = scene.bg;
    }
  }

  bg.dataset.scene = name;
  bg.src = src;
  bg.alt = `ArkmatX ${name} — ${activeVariant}`;
  document.querySelector('#location').textContent = `${name.toUpperCase()} // ${activeVariant.toUpperCase()}`;
  svg.innerHTML = scene.hot
    .map(hotspot => `<polygon tabindex="0" aria-label="${hotspot[1]}" data-target="${hotspot[3]}" points="${hotspot[2]}"/>`)
    .join('');
  svg.querySelectorAll('polygon').forEach(polygon => {
    polygon.onclick = () => act(polygon.dataset.target);
    polygon.onkeydown = event => { if (event.key === 'Enter') polygon.click(); };
  });
}

function travel(url, label) {
  transition.textContent = label;
  transition.classList.add('traveling');
  setTimeout(() => jump(url), 800);
}

function worklog() {
  const projects = (activity?.projects || [])
    .map(item => `${item.name.padEnd(14, '.')} ${item.status}\n${item.detail}`)
    .join('\n\n');
  return `${activity?.headline || 'ARKMATX WEEKLY LOG'}\n\n${activity?.summary || ''}\n\n${projects || 'No feed loaded.'}`;
}

function gitlog() {
  return `${githubStatus?.repository || 'GITHUB'} // ${githubStatus?.status || 'OFFLINE'}\nUPDATED: ${githubStatus?.updated_at || 'unknown'}\n\n${(githubStatus?.recent_commits || []).slice(0, 7).map(item => `${item.sha} ${item.message}`).join('\n')}`;
}

function diagnostics() {
  return `MORRI ......... ${has('morri-chess') ? 'ROOK HANDSHAKE' : 'UNRESOLVED'}\nWITCHDIX ...... ${has('witch-moon') ? 'MOON SIGIL' : 'LISTENING'}\nXANDER ........ ${has('xander-woods') ? 'INK PATH OPEN' : 'CANON STABLE'}\nARK RADIO ..... ${has('ark-radio') ? 'LOCKED' : 'UNTUNED'}\nWORLD BUS ..... ${worldState ? 'PERSISTENT' : 'LOCAL FALLBACK'}\nVISUAL BUILD ... ${activeVariant.toUpperCase()}`;
}

function act(target) {
  if (target.startsWith('scene-')) return renderScene(target.slice(6));

  if (target === 'project-terminal') {
    show('BRAIN CONNECT', `AI orchestration / machines / experiments\n\n${diagnostics()}\n\n${worklog()}`, 'REAL PROJECT TERMINAL', `<button id="gitBtn">GIT TELEMETRY</button><button id="sourceBtn">ARKMATX SOURCE</button><button id="memoryBtn">WORKFLOW MEMORY</button>`);
    queueMicrotask(() => {
      document.querySelector('#gitBtn').onclick = () => show('GIT TELEMETRY', gitlog(), 'SOURCE OF TRUTH', `<button id="sourceBtn">ARKMATX SOURCE</button><button id="memoryBtn">WORKFLOW MEMORY</button>`);
      bindProjectLinks();
    });
    return;
  }

  if (target === 'project-bench') {
    show('WORKBENCH', 'Raspberry Pi · hardware · network experiments\n\nPhysical systems, remote-control experiments, security appliance ideas, and anything that required a cable before it required a website.', 'HARDWARE PROJECTS', `<button id="sourceBtn">ARKMATX SOURCE</button><button id="memoryBtn">WORKFLOW MEMORY</button>`);
    queueMicrotask(bindProjectLinks);
    return;
  }

  if (target === 'project-bike') {
    show('WET BEARD', 'Quest engine escaped into the real world. Rider game logic, quests, admin tools, deployments, and an actual bicycle.', 'PROJECT LINK', `<button id="wetBtn">OPEN WET BEARD</button>`);
    queueMicrotask(() => { document.querySelector('#wetBtn').onclick = () => jump('https://wetbeard.madmorrigan.com/'); });
    return;
  }

  if (target === 'project-rack') {
    show('ÜBERCORP', 'Space Pirates infrastructure and corporate interference. The rack claims all services are mission critical. The rack is a liar.\n\nThe useful part of this rack is the real engineering memory behind the worlds.', 'INFRASTRUCTURE', `<button id="memoryBtn">WORKFLOW MEMORY</button><button id="sourceBtn">ARKMATX SOURCE</button><button id="reviewBtn">STAGING REVIEW</button>`);
    queueMicrotask(bindProjectLinks);
    return;
  }

  if (target === 'map') {
    show('WORLD MAP', 'Three unstable destinations are pinned to the wall.', 'TRANSPORT BUS', `<button data-world="morri">MORRI</button><button data-world="witch">WITCHDIX</button><button data-world="xander">XANDER</button>`);
    queueMicrotask(() => document.querySelectorAll('[data-world]').forEach(button => {
      button.onclick = () => travel(worlds[button.dataset.world].url, `ROUTING TO ${worlds[button.dataset.world].label}…`);
    }));
    return;
  }

  if (target === 'radio') {
    show('WORLD BUS RADIO', 'Tune three frequencies in sequence.', 'ANALOG INTERFACE', `<button data-f="1">1 / MOSS</button><button data-f="2">2 / PAPER</button><button data-f="3">3 / INK</button>`);
    queueMicrotask(() => document.querySelectorAll('[data-f]').forEach(button => {
      button.onclick = async () => {
        radio.push(Number(button.dataset.f));
        if (radio.length > 3) radio.shift();
        readout.textContent = `RADIO SEQUENCE: ${radio.join(' → ')}`;
        if (radio.join('') === '123') {
          await pushWorld('ark-radio');
          readout.textContent = 'WORLD BUS LOCKED // MOSS PAPER INK';
          modal.classList.remove('show');
        }
      };
    }));
    return;
  }

  if (target === 'red') {
    document.body.classList.toggle('alarm');
    pushWorld('ark-red');
    readout.textContent = 'BAD IDEA BROADCAST TO ALL REALMS.';
    return;
  }

  if (target.startsWith('server-')) {
    const server = target.slice(7);
    const message = {
      morri: `MOSS NODE\n${has('morri-chess') ? 'ROOK HANDSHAKE ACCEPTED' : 'AWAITING CHESS EVENT'}`,
      witch: `PAPER NODE\n${has('witch-moon') ? 'MOON SIGIL ACTIVE' : 'GRIMOIRE LISTENING'}`,
      xander: `INK NODE\n${has('xander-woods') ? 'IMPOSSIBLE PATH OPEN' : 'CANON STABLE'}`,
      ark: `LOOPBACK\n${diagnostics()}`,
    }[server];
    show(`${server.toUpperCase()} NODE`, message, 'LIVE MACHINE');
    return;
  }

  if (target.startsWith('logic-')) {
    const key = target.slice(6);
    if (key === 'door') {
      if (logic.a && !logic.b && logic.c) {
        pushWorld('ark-paradox');
        show('MAINTENANCE CHANNEL 0', `RULE 1: If it looks like project information, it should be real.\nRULE 2: If it is fake, it should be part of a puzzle.\nRULE 3: A system that documents itself changes what it documents.\nRULE 4: There is no Rule 4.\n\nFLAGS: ${[...passport].join(', ') || 'none'}`, 'UNAUTHORIZED ACCESS');
      } else {
        readout.textContent = 'ACCESS DENIED // terminals disagree';
      }
      return;
    }
    logic[key] = !logic[key];
    readout.textContent = `PARADOX STATE A:${+logic.a} B:${+logic.b} C:${+logic.c}`;
  }
}

async function actionLoad() {
  await Promise.allSettled([
    loadWorld(),
    loadRenderManifest(),
    fetch(asset('activity.json'), { cache: 'no-store' }).then(response => response.json()).then(payload => { activity = payload; }),
    fetch(asset('github-status.json'), { cache: 'no-store' }).then(response => response.json()).then(payload => { githubStatus = payload; }),
  ]);
  try { await loadSceneRender('workshop'); } catch {}
  readout.textContent = `${worldState ? 'WORLD BUS ONLINE' : 'WORLD BUS DEGRADED'} // VARIANT ${activeVariant.toUpperCase()}`;
  await renderScene('workshop');
}

document.querySelector('#hint').onpointerdown = () => document.body.classList.add('reveal');
document.querySelector('#hint').onpointerup =
document.querySelector('#hint').onpointerleave = () => document.body.classList.remove('reveal');

savePassport();
actionLoad();
