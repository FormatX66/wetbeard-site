const $ = (selector) => document.querySelector(selector);

let adminPassword = '';
let dashboardState = null;

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character]));

async function adminApi(action, data = {}) {
  const response = await fetch(`api/admin.php?action=${encodeURIComponent(action)}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({...data, password: adminPassword})
  });
  const text = await response.text();
  let json;

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`The server response could not be read (${response.status}).`);
  }

  if (!response.ok || !json.ok) {
    throw new Error(json.error || `Request failed (${response.status}).`);
  }
  return json;
}

function showNotice(message = '', type = 'success') {
  const notice = $('#adminNotice');
  notice.textContent = message;
  notice.className = `admin-notice ${message ? `show ${type}` : ''}`;
  if (message) {
    window.clearTimeout(showNotice.timer);
    showNotice.timer = window.setTimeout(() => showNotice(), 3500);
  }
}

function setBusy(button, busy, busyLabel) {
  if (!button.dataset.label) button.dataset.label = button.textContent;
  button.disabled = busy;
  button.textContent = busy ? busyLabel : button.dataset.label;
}

function formatDate(value) {
  if (!value) return 'Time not set';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function toServerDate(value) {
  return value ? `${value.replace('T', ' ')}${value.length === 16 ? ':00' : ''}` : '';
}

function renderStats(stats = {}) {
  $('#statRiders').textContent = Number(stats.riders || 0).toLocaleString();
  $('#statCompletions').textContent = Number(stats.completions || 0).toLocaleString();
  $('#statMessages').textContent = Number(stats.messages || 0).toLocaleString();
}

function renderRides(rides = []) {
  $('#adminRides').innerHTML = rides.length ? rides.map((ride) => {
    const now = Date.now();
    const starts = new Date(String(ride.starts_at).replace(' ', 'T')).getTime();
    const ends = new Date(String(ride.ends_at).replace(' ', 'T')).getTime();
    const state = now >= starts && now <= ends ? 'Live' : (starts > now ? 'Upcoming' : 'Finished');
    return `<article class="admin-list-card">
      <div class="admin-list-topline">
        <strong>${escapeHtml(ride.title)}</strong>
        <span class="admin-status admin-status-${state.toLowerCase()}">${state}</span>
      </div>
      <div class="admin-list-detail">⚓ ${escapeHtml(ride.location || 'Location not set')}</div>
      <div class="admin-list-detail">${escapeHtml(formatDate(ride.starts_at))}</div>
      <div class="admin-list-detail">to ${escapeHtml(formatDate(ride.ends_at))}</div>
      ${ride.description ? `<p>${escapeHtml(ride.description)}</p>` : ''}
      <button class="admin-danger-button" type="button" data-delete-ride="${Number(ride.id)}">Delete Ride</button>
    </article>`;
  }).join('') : '<div class="admin-empty">No voyages scheduled.</div>';
}

function renderCards(cards = []) {
  $('#cards').innerHTML = cards.length ? cards.map((card) => {
    const active = Number(card.active) === 1;
    return `<article class="admin-list-card admin-card-row ${active ? '' : 'is-disabled'}">
      <span class="admin-card-number">#${Number(card.id)}</span>
      <div class="admin-card-copy">
        <strong>${escapeHtml(card.title)}</strong>
        <small>${Number(card.task_count || 0)} tasks · ${active ? 'Included in draws' : 'Not included in draws'}</small>
      </div>
      <button class="admin-toggle-button ${active ? 'active' : ''}" type="button" data-toggle-card="${Number(card.id)}">${active ? 'Disable' : 'Enable'}</button>
    </article>`;
  }).join('') : '<div class="admin-empty">No quest cards have been added.</div>';
}

async function loadDashboard() {
  const state = await adminApi('dashboard');
  dashboardState = state;
  renderStats(state.stats);
  renderRides(state.rides);
  renderCards(state.cards);
  $('#loginPanel').classList.add('hidden');
  $('#dash').classList.remove('hidden');
  $('#adminError').textContent = '';
}

async function logIn() {
  const button = $('#login');
  adminPassword = $('#pw').value;
  $('#adminError').textContent = '';

  if (!adminPassword) {
    $('#adminError').textContent = 'Enter the admin password.';
    return;
  }

  setBusy(button, true, 'Opening…');
  try {
    await loadDashboard();
  } catch (error) {
    adminPassword = '';
    $('#adminError').textContent = error.message;
    $('#pw').select();
  } finally {
    setBusy(button, false, 'Opening…');
  }
}

$('#login').addEventListener('click', logIn);
$('#pw').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') logIn();
});

$('#lockAdmin').addEventListener('click', () => {
  adminPassword = '';
  dashboardState = null;
  $('#pw').value = '';
  $('#dash').classList.add('hidden');
  $('#loginPanel').classList.remove('hidden');
  $('#pw').focus();
});

$('#saveRide').addEventListener('click', async () => {
  const button = $('#saveRide');
  const title = $('#rideTitle').value.trim();
  const startsAt = $('#rideStart').value;
  const endsAt = $('#rideEnd').value;

  if (!title || !startsAt || !endsAt) {
    showNotice('Add a title, start time, and end time.', 'error');
    return;
  }
  if (new Date(endsAt) <= new Date(startsAt)) {
    showNotice('The ride must end after it starts.', 'error');
    return;
  }

  setBusy(button, true, 'Creating Ride…');
  try {
    await adminApi('save_ride', {
      title,
      location: $('#rideLocation').value.trim(),
      description: $('#rideDescription').value.trim(),
      starts_at: toServerDate(startsAt),
      ends_at: toServerDate(endsAt)
    });
    ['#rideTitle', '#rideLocation', '#rideStart', '#rideEnd', '#rideDescription'].forEach((selector) => {
      $(selector).value = '';
    });
    await loadDashboard();
    showNotice('Ride scheduled. The crew will see it on the site.');
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    setBusy(button, false, 'Creating Ride…');
  }
});

$('#addCard').addEventListener('click', async () => {
  const button = $('#addCard');
  const fields = {
    title: $('#cardTitle').value.trim(),
    easy: $('#easy').value.trim(),
    medium: $('#medium').value.trim(),
    hard: $('#hard').value.trim()
  };

  if (Object.values(fields).some((value) => !value)) {
    showNotice('Complete the title and all three quest tasks.', 'error');
    return;
  }

  setBusy(button, true, 'Adding Card…');
  try {
    await adminApi('add_card', fields);
    ['#cardTitle', '#easy', '#medium', '#hard'].forEach((selector) => {
      $(selector).value = '';
    });
    await loadDashboard();
    showNotice('Quest card added to the draw.');
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    setBusy(button, false, 'Adding Card…');
  }
});

$('#adminRides').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-delete-ride]');
  if (!button) return;
  const ride = dashboardState?.rides.find((item) => Number(item.id) === Number(button.dataset.deleteRide));
  if (!window.confirm(`Delete “${ride?.title || 'this ride'}”?`)) return;

  setBusy(button, true, 'Deleting…');
  try {
    await adminApi('delete_ride', {id: Number(button.dataset.deleteRide)});
    await loadDashboard();
    showNotice('Ride deleted.');
  } catch (error) {
    showNotice(error.message, 'error');
    setBusy(button, false, 'Deleting…');
  }
});

$('#cards').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-toggle-card]');
  if (!button) return;

  setBusy(button, true, 'Saving…');
  try {
    await adminApi('toggle_card', {id: Number(button.dataset.toggleCard)});
    await loadDashboard();
    showNotice('Quest card updated.');
  } catch (error) {
    showNotice(error.message, 'error');
    setBusy(button, false, 'Saving…');
  }
});
