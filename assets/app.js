const $ = (selector) => document.querySelector(selector);
const DEVICE_TOKEN_KEY = 'wbDevice';

function validDeviceToken(value) {
  return typeof value === 'string' && /^[a-f0-9]{32}$/i.test(value);
}

function readDeviceToken() {
  try {
    const value = localStorage.getItem(DEVICE_TOKEN_KEY);
    if (validDeviceToken(value)) return value;
  } catch {
    // Some phone privacy modes disable localStorage. The cookie fallback below
    // keeps the same rider connected between page loads in those browsers.
  }

  const prefix = `${DEVICE_TOKEN_KEY}=`;
  const value = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
  return validDeviceToken(value) ? value : null;
}

function createDeviceToken() {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('A secure browser connection is required to create a rider key.');
  }

  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function saveDeviceToken(value) {
  try {
    localStorage.setItem(DEVICE_TOKEN_KEY, value);
    return;
  } catch {
    // Fall through to a first-party cookie when localStorage is unavailable.
  }

  document.cookie = `${DEVICE_TOKEN_KEY}=${value}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`;
}

const token = (() => {
  let value = readDeviceToken();
  if (!value) {
    value = createDeviceToken();
    saveDeviceToken(value);
  }
  return value;
})();

let currentState = null;
let currentCollection = [];
let loading = false;
let tickerIndex = 0;
let tickerTimer = null;

async function api(action, data = {}) {
  const hasBody = Object.keys(data).length > 0;
  const response = await fetch(`api/api.php?action=${encodeURIComponent(action)}&device_token=${encodeURIComponent(token)}`, {
    method: hasBody ? 'POST' : 'GET',
    headers: {'Content-Type': 'application/json'},
    body: hasBody ? JSON.stringify({...data, device_token: token}) : undefined
  });
  const text = await response.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error(`Server response could not be read (${response.status}).`); }
  if (!response.ok || !json.ok) throw new Error(json.error || `HTTP ${response.status}`);
  return json;
}

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function formatDate(value) {
  if (!value) return '';
  return new Date(value.replace(' ', 'T')).toLocaleString([], {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

function coin(points = '', extraClass = '') {
  return `<span class="coin ${extraClass}"></span>${points === '' ? '' : `<b>${points}</b>`}`;
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function renderCollection() {
  const collection = currentCollection;
  const totalCompletions = collection.length;
  const totalStars = collection.reduce((sum, card) => sum + Number(card.total_points || 0), 0);
  $('#collectionStats').innerHTML = `
    <div><strong>${collection.length}</strong><span>Unique Cards</span></div>
    <div><strong>${totalCompletions}</strong><span>Total Clears</span></div>
    <div><strong>${totalStars}</strong><span>Card Stars</span></div>`;

  $('#questCollection').innerHTML = collection.length ? collection.map((card) => `
    <article class="collected-card">
      <div class="collection-card-number">#${card.card_id}</div>
      <div class="collection-stamp">COMPLETE</div>
      <h3>${esc(card.title)}</h3>
      <ol>${card.tasks.map((task) => `<li>${esc(task.text)}</li>`).join('')}</ol>
      <footer><span>${new Date(String(card.completed_at).replace(' ', 'T')).toLocaleDateString()}</span><span>${coin(card.total_points, 'tiny')}</span></footer>
    </article>`).join('') : '<div class="empty-copy">Finish all three tasks on a card to add it to your collection.</div>';

  const milestones = [
    {at: 1, icon: '🧭', name: 'First Voyage'},
    {at: 5, icon: '⚓', name: 'Deckhand'},
    {at: 10, icon: '🗺️', name: 'Map Keeper'},
    {at: 25, icon: '🏴‍☠️', name: 'Quest Captain'},
    {at: 50, icon: '👑', name: 'Legend of the Road'}
  ];
  $('#trophyRoom').innerHTML = `<div class="trophy-shelf">${milestones.map((trophy) => {
    const earned = collection.length >= trophy.at;
    return `<div class="trophy ${earned ? 'earned' : 'locked'}"><span>${earned ? trophy.icon : '🔒'}</span><strong>${trophy.name}</strong><small>${earned ? 'Earned' : `${collection.length}/${trophy.at} cards`}</small></div>`;
  }).join('')}</div>`;
}

function renderLeaders(leaderboard) {
  const top = leaderboard.slice(0, 3);
  if (!top.length) {
    $('#leaders').innerHTML = '<div class="empty-copy">No scores yet</div>';
    $('#leaderboardFull').innerHTML = '<div class="empty-copy">The captain’s table is empty.</div>';
    return;
  }
  const order = top.length >= 3 ? [top[1], top[0], top[2]] : top;
  $('#leaders').innerHTML = order.map((rider) => {
    const actualRank = leaderboard.indexOf(rider) + 1;
    return `<div class="podium-rider rank-${actualRank}">
      <span class="rank-medal">${actualRank}</span>
      <div class="rider-name">${esc(rider.display_name)}</div>
      <div class="rider-score">${coin(rider.points, 'tiny')}</div>
    </div>`;
  }).join('');

  $('#leaderboardFull').innerHTML = leaderboard.map((rider, index) => `
    <div class="leader-row"><span class="leader-rank">${index + 1}</span><strong>${esc(rider.display_name)}</strong><span class="leader-points">${coin(rider.points, 'tiny')}</span></div>`).join('');
}

function getCurrentCard(state) {
  const grouped = {};
  state.current_quest.forEach((task) => (grouped[task.card_id] ??= []).push(task));
  return Object.values(grouped)[0] || null;
}

function renderQuest(state) {
  const card = getCurrentCard(state);
  if (!card) {
    $('#questNumber').textContent = '—';
    $('#quest').innerHTML = '<div class="empty-quest">No quest card drawn.</div>';
    $('#progress').textContent = '0 / 3';
    $('#draw').hidden = false;
    return;
  }
  const completed = new Set(state.completed_task_ids.map(Number));
  const doneCount = card.filter((task) => completed.has(Number(task.task_id))).length;
  $('#questNumber').textContent = `#${card[0].card_id}`;
  $('#progress').textContent = `${doneCount} / ${card.length}`;
  $('#draw').hidden = doneCount > 0 && doneCount < card.length;
  $('#quest').innerHTML = card.map((task) => {
    const done = completed.has(Number(task.task_id));
    return `<button class="quest-task ${done ? 'done' : ''}" ${done ? 'disabled' : ''} onclick="completeTask(${task.task_id})">
      <span class="drawn-box">${done ? '✓' : ''}</span><span class="task-copy">${esc(task.task_text)}</span><span class="task-value">${coin(task.points, 'tiny')}</span>
    </button>`;
  }).join('');
}

function renderRides(state) {
  $('#rides').innerHTML = state.rides.length ? state.rides.map((ride) => {
    const reserved = state.reserved_ride_ids.includes(Number(ride.id));
    const upcoming = new Date(ride.starts_at.replace(' ', 'T')) > new Date();
    return `<div class="ride-card"><div class="ride-main"><strong>${esc(ride.title)}</strong><span>${formatDate(ride.starts_at)}</span></div><div class="ride-location">⚓ ${esc(ride.location)}</div><div class="ride-meta">${ride.reserved_count} pirates reserved</div>${upcoming ? `<button onclick="reserve(${ride.id}, ${reserved})">${reserved ? 'Cancel' : 'Reserve Spot'}</button>` : ''}</div>`;
  }).join('') : '<div class="empty-copy">No voyages scheduled.</div>';
  if (state.live_ride) {
    $('#live').classList.remove('hidden');
    $('#live').innerHTML = `<span class="pulse"></span><strong>RIDE LIVE</strong><span>${esc(state.live_ride.title)}</span>`;
  } else $('#live').classList.add('hidden');
}

function visibleAchievementCount() {
  if (window.matchMedia('(max-width: 359px)').matches) return 1;
  if (window.matchMedia('(max-width: 439px)').matches) return 2;
  return 3;
}

function updateTicker() {
  const track = $('#recent');
  const cards = track.querySelectorAll('.victory-card');
  if (!cards.length) return;
  const visible = visibleAchievementCount();
  const maxIndex = Math.max(0, cards.length - visible);
  if (tickerIndex > maxIndex) tickerIndex = 0;
  const step = 100 / visible;
  track.style.transform = `translateX(-${tickerIndex * step}%)`;
  document.querySelectorAll('#recentDots button').forEach((dot, i) => dot.classList.toggle('active', i === tickerIndex));
}

function startTicker() {
  clearInterval(tickerTimer);
  tickerTimer = setInterval(() => {
    const cards = document.querySelectorAll('#recent .victory-card');
    const visible = visibleAchievementCount();
    const maxIndex = Math.max(0, cards.length - visible);
    tickerIndex = maxIndex ? (tickerIndex + 1) % (maxIndex + 1) : 0;
    updateTicker();
  }, 4200);
}

function renderRecent(recent) {
  const items = recent.slice(0, 12);
  $('#recent').innerHTML = items.length ? items.map((item) => `
    <article class="victory-card"><button class="kudos-button" onclick="sendStars(${item.recipient_rider_id}, ${item.id}, '${encodeURIComponent(String(item.display_name))}', event)" aria-label="Send Gold Nautical Stars">${coin()}</button><div><strong>${esc(item.display_name)}</strong><span>${esc(item.task_text)}</span></div></article>`).join('') : '<span class="empty-copy">No victories yet.</span>';
  tickerIndex = 0;
  const count = Math.max(0, items.length - visibleAchievementCount() + 1);
  $('#recentDots').innerHTML = count > 1 ? Array.from({length: count}, (_, i) => `<button type="button" aria-label="Achievement page ${i + 1}" class="${i === 0 ? 'active' : ''}" onclick="jumpTicker(${i})"></button>`).join('') : '';
  updateTicker();
  startTicker();
}

function renderStarSending(starSending) {
  const sending = starSending || {remaining_today: 100, daily_limit: 100, history: []};
  $('#starSendRemaining').textContent = sending.remaining_today;
  $('#starSendSummary').textContent = `${sending.remaining_today} of ${sending.daily_limit} available today`;
  $('#starHistory').innerHTML = sending.history?.length ? sending.history.map((item) => `
    <div class="star-history-row"><strong>${esc(item.recipient_name)}</strong><span>${coin(item.amount, 'tiny')}</span><small>${esc(item.reason || 'Gold Nautical Stars sent')} · ${formatDate(item.created_at)}</small></div>`).join('') : '<div class="empty-copy">No Gold Nautical Stars sent yet.</div>';
  const resetAt = sending.resets_at ? new Date(String(sending.resets_at).replace(' ', 'T')) : null;
  const updateCountdown = () => {
    if (!resetAt) return;
    const seconds = Math.max(0, Math.floor((resetAt - new Date()) / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    $('#starResetCountdown').textContent = `Daily sending limit resets in ${hours}h ${minutes}m`;
  };
  updateCountdown();
  clearInterval(renderStarSending.timer);
  renderStarSending.timer = setInterval(updateCountdown, 60000);
}

function renderCardMarket(state) {
  const inventory = state.card_inventory || [];
  const listings = state.card_market || [];
  const mine = inventory.length ? `<h3>Your tradeable cards</h3>${inventory.map(card => `<div class="market-card"><strong>#${card.card_id} ${esc(card.title)}</strong><span>${card.listing_id ? `Listed for ${coin(card.price,'tiny')}` : 'Available to sell'}</span>${card.listing_id ? `<button onclick="cancelListing(${card.listing_id})">Cancel</button>` : `<button onclick="listCard(${card.holding_id}, '${encodeURIComponent(String(card.title))}')">List</button>`}</div>`).join('')}` : '<div class="empty-copy">Complete a quest card to sell or trade it.</div>';
  const market = listings.length ? `<h3>Cards for sale</h3>${listings.map(card => `<div class="market-card"><strong>#${card.card_id} ${esc(card.title)}</strong><span>Seller: ${esc(card.seller_name)}</span><small>${coin(card.price,'tiny')} Gold Nautical Stars</small><button onclick="buyCard(${card.listing_id}, ${card.price}, '${encodeURIComponent(String(card.title))}')" ${Number(card.seller_rider_id)===Number(state.rider.id)?'disabled':''}>${Number(card.seller_rider_id)===Number(state.rider.id)?'Yours':'Buy'}</button></div>`).join('')}` : '<div class="empty-copy">No quest cards are listed for sale.</div>';
  $('#cardMarket').innerHTML = `${mine}${market}`;
}

window.jumpTicker = (index) => { tickerIndex = index; updateTicker(); startTicker(); };

function renderMessages(messages) {
  $('#messages').innerHTML = messages.length ? messages.map((item) => `<div class="log-entry"><strong>${esc(item.display_name)}</strong><span>${esc(item.message)}</span><small>${formatDate(item.created_at)}</small></div>`).join('') : '<div class="empty-copy">The log is quiet.</div>';
}

async function load() {
  if (loading) return;
  loading = true;
  try {
    $('#status').textContent = 'Online';
    const state = await api('state');
    currentState = state;
    $('#name').value = state.rider.display_name === 'New Pirate' ? '' : state.rider.display_name;
    $('#name').disabled = Boolean(Number(state.rider.name_locked));
    $('#saveName').disabled = Boolean(Number(state.rider.name_locked));
    $('#points').textContent = state.rider.points;
    renderLeaders(state.leaderboard);
    renderQuest(state);
    renderRides(state);
    renderRecent(state.recent);
    renderMessages(state.messages);
    renderStarSending(state.star_sending);
    renderCardMarket(state);
    currentCollection = Array.isArray(state.collection) ? state.collection : [];
    renderCollection();
  } catch (error) {
    $('#status').textContent = 'Offline';
    if (!document.querySelector('.error-banner')) document.querySelector('.masthead').insertAdjacentHTML('afterend', `<div class="error-banner">${esc(error.message)}</div>`);
  } finally { loading = false; }
}

window.completeTask = async (taskId) => {
  try {
    await api('complete_task', {task_id: taskId});
    const fresh = await api('state');
    const card = getCurrentCard(fresh);
    const completed = new Set(fresh.completed_task_ids.map(Number));
    const allComplete = card?.length && card.every((task) => completed.has(Number(task.task_id)));
    if (allComplete) {
      showToast('Quest card added to your collection!');
      renderQuest(fresh);
      await new Promise((resolve) => setTimeout(resolve, 900));
      await api('draw_quest');
    }
    await load();
  } catch (error) { alert(error.message); }
};

window.reserve = async (rideId, reserved) => { try { await api(reserved ? 'unreserve' : 'reserve', {ride_id: rideId}); await load(); } catch (error) { alert(error.message); } };
window.sendStars = async (recipientRiderId, completionId, encodedRiderName, clickEvent) => {
  const riderName = decodeURIComponent(encodedRiderName);
  if (Number(recipientRiderId) === Number(currentState?.rider?.id)) return alert('You cannot send Gold Nautical Stars to yourself.');
  const available = Math.min(Number(currentState?.rider?.points || 0), Number(currentState?.star_sending?.remaining_today || 0));
  if (available < 1) return alert('You have no Gold Nautical Stars available to send today.');
  const rawAmount = prompt(`Send Gold Nautical Stars to ${riderName}\nEnter 1–${available}:`, '1');
  if (rawAmount === null) return;
  const amount = Number(rawAmount);
  if (!Number.isInteger(amount) || amount < 1 || amount > available) return alert(`Enter a whole number from 1 to ${available}.`);
  const reason = prompt('Optional reason:', 'Great quest!');
  if (reason === null) return;
  if (!confirm(`Send ${amount} Gold Nautical Star${amount === 1 ? '' : 's'} to ${riderName}?`)) return;
  try {
    await api('send_stars', {recipient_rider_id: recipientRiderId, completion_id: completionId, amount, reason});
    clickEvent?.currentTarget?.classList.add('sent');
    showToast(`${amount} Gold Nautical Star${amount === 1 ? '' : 's'} sent!`);
    await load();
  } catch (error) { alert(error.message); }
};
window.listCard = async (holdingId, encodedTitle) => { const title=decodeURIComponent(encodedTitle); const raw=prompt(`List “${title}” for how many Gold Nautical Stars?`,'25'); if(raw===null)return; const price=Number(raw); if(!Number.isInteger(price)||price<1)return alert('Enter a whole-number price.'); try{await api('list_card',{holding_id:holdingId,price});showToast('Quest card listed!');await load()}catch(e){alert(e.message)} };
window.cancelListing = async (listingId) => { if(!confirm('Remove this card from the market?'))return; try{await api('cancel_listing',{listing_id:listingId});showToast('Listing removed.');await load()}catch(e){alert(e.message)} };
window.buyCard = async (listingId,price,encodedTitle) => { const title=decodeURIComponent(encodedTitle); if(!confirm(`Buy “${title}” for ${price} Gold Nautical Stars?`))return; try{await api('buy_card',{listing_id:listingId});showToast('Quest card purchased!');await load()}catch(e){alert(e.message)} };

$('#saveName').onclick = async () => { try { await api('set_name', {display_name: $('#name').value}); $('#profilePanel').classList.add('hidden'); await load(); } catch (error) { alert(error.message); } };
$('#draw').onclick = async () => { try { await api('draw_quest'); await load(); } catch (error) { alert(error.message); } };
$('#send').onclick = async () => { try { const message = $('#message').value.trim(); if (!message) return; await api('message', {message}); $('#message').value = ''; await load(); } catch (error) { alert(error.message); } };
$('#profileToggle').onclick = () => $('#profilePanel').classList.toggle('hidden');
$('#shareSite').onclick = async () => {
  const shareData = {title: 'Wet Beard — Keeper of Quests', text: 'Join the Wet Beard bike quest adventure!', url: window.location.href};
  try {
    if (navigator.share) await navigator.share(shareData);
    else { await navigator.clipboard.writeText(window.location.href); showToast('Website link copied!'); }
  } catch (error) { if (error.name !== 'AbortError') showToast('Could not share this page.'); }
};
document.querySelectorAll('[data-msg]').forEach((button) => { button.onclick = () => { $('#message').value = button.dataset.msg; }; });
window.addEventListener('resize', () => { tickerIndex = 0; updateTicker(); renderRecent(currentState?.recent || []); });

renderCollection();
load();
setInterval(load, 30000);
