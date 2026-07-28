const params = new URLSearchParams(location.search);

function hash32(value) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function activeIdentity() {
  const explicit = params.get('login') || params.get('user');
  if (explicit) return { value: explicit, explicit: true };

  let visitor = localStorage.getItem('arkmatx-visitor-id');
  if (!visitor) {
    visitor = globalThis.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random()}`;
    localStorage.setItem('arkmatx-visitor-id', visitor);
  }
  return { value: visitor, explicit: false };
}

function currentScene() {
  const room = (document.querySelector('#location')?.textContent || 'WORKSHOP')
    .split('//')[0]
    .trim()
    .toLowerCase();
  return ['workshop', 'servers', 'paradox'].includes(room) ? room : 'workshop';
}

function cleanCallsign(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9 _.-]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 32);
}

function navigateAs(callsign) {
  const url = new URL(location.href);
  url.searchParams.delete('user');
  url.searchParams.delete('variant');
  url.searchParams.set('login', callsign);
  url.searchParams.set('scene', currentScene());
  location.href = url.toString();
}

function navigateAnonymous() {
  const url = new URL(location.href);
  localStorage.removeItem('arkmatx-visitor-id');
  sessionStorage.removeItem('arkmatx-active-login');
  sessionStorage.removeItem('arkmatx-active-variant');
  url.searchParams.delete('login');
  url.searchParams.delete('user');
  url.searchParams.delete('variant');
  url.searchParams.set('scene', currentScene());
  location.href = url.toString();
}

function injectStyle() {
  if (document.querySelector('#identity-console-style')) return;
  const style = document.createElement('style');
  style.id = 'identity-console-style';
  style.textContent = `
    #identityConsole{position:absolute;right:162px;bottom:18px;z-index:12;width:40px;height:40px;border-radius:50%;border:1px solid #667268;background:#070c09bb;color:#aab7aa;font:700 11px ui-monospace,monospace;cursor:pointer}
    #identityConsole:hover,#identityConsole:focus{border-color:#9bebb0;color:#d7e8d8;outline:none}
    #identityInput{width:min(430px,100%);margin:8px 0 14px;padding:11px 12px;border:1px solid #59665b;background:#030806;color:#d7e8d8;font:14px ui-monospace,monospace}
    #identityInput:focus{outline:1px solid #9bebb0;border-color:#9bebb0}
    @media(max-width:700px){#identityConsole{right:156px;bottom:12px}}
  `;
  document.head.append(style);
}

function openIdentityConsole() {
  const identity = activeIdentity();
  const modal = document.querySelector('#modal');
  const tag = document.querySelector('#tag');
  const title = document.querySelector('#title');
  const copy = document.querySelector('#copy');
  const actions = document.querySelector('#actions');
  if (!modal || !tag || !title || !copy || !actions) return;

  const identityHash = hash32(identity.value).toString(36).toUpperCase();
  const variant = document.body.dataset.variant?.toUpperCase() || 'BOOTING';
  tag.textContent = 'LOCAL IDENTITY TERMINAL';
  title.textContent = identity.explicit ? identity.value.toUpperCase() : 'ANONYMOUS VISITOR';
  copy.textContent = `IDENTITY SLOT .... ${identityHash}\nVISUAL BUILD ..... ${variant}\nCURRENT ROOM ..... ${currentScene().toUpperCase()}\n\nA callsign keeps its own visual build, expedition journal, and discovery ledger in this browser. Switching callsigns preserves the current room but loads that identity's separate local history.`;
  actions.innerHTML = `
    <label for="identityInput">CALLSIGN</label><br>
    <input id="identityInput" maxlength="32" autocomplete="off" spellcheck="false" value="${identity.explicit ? identity.value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;') : ''}" placeholder="Enter a callsign">
    <br><button type="button" id="identityApply">ENTER AS CALLSIGN</button>
    <button type="button" id="identityAnonymous">NEW ANONYMOUS SLOT</button>
  `;
  modal.classList.add('show');

  const input = document.querySelector('#identityInput');
  const apply = () => {
    const callsign = cleanCallsign(input?.value);
    if (!callsign) {
      if (input) {
        input.setCustomValidity('Enter a callsign using letters, numbers, spaces, dots, dashes, or underscores.');
        input.reportValidity();
      }
      return;
    }
    navigateAs(callsign);
  };
  document.querySelector('#identityApply').onclick = apply;
  document.querySelector('#identityAnonymous').onclick = navigateAnonymous;
  input?.addEventListener('input', () => input.setCustomValidity(''));
  input?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      apply();
    }
  });
  setTimeout(() => input?.focus(), 0);
}

function initIdentityConsole() {
  const experience = document.querySelector('.experience');
  if (!experience) {
    setTimeout(initIdentityConsole, 50);
    return;
  }
  injectStyle();
  let button = document.querySelector('#identityConsole');
  if (!button) {
    button = document.createElement('button');
    button.id = 'identityConsole';
    button.type = 'button';
    button.textContent = 'ID';
    button.setAttribute('aria-label', 'open identity terminal');
    button.title = 'Identity terminal';
    experience.append(button);
  }
  button.onclick = openIdentityConsole;
}

if (document.readyState === 'complete') queueMicrotask(initIdentityConsole);
else window.addEventListener('load', initIdentityConsole, { once: true });
