const $ = (selector) => document.querySelector(selector);

let adminPassword = '';
let riders = [];
let selectedRiderId = null;

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

  if (!response.ok || !json.ok) throw new Error(json.error || `Request failed (${response.status}).`);
  return json;
}

function setBusy(button, busy, busyLabel) {
  if (!button.dataset.label) button.dataset.label = button.textContent;
  button.disabled = busy;
  button.textContent = busy ? busyLabel : button.dataset.label;
}

function showNotice(message = '', type = 'success') {
  const notice = $('#editorNotice');
  notice.textContent = message;
  notice.className = `admin-notice ${message ? `show ${type}` : ''}`;
  if (message) {
    window.clearTimeout(showNotice.timer);
    showNotice.timer = window.setTimeout(() => showNotice(), 4200);
  }
}

function renderStats(stats = {}) {
  $('#statRiders').textContent = Number(stats.riders || 0).toLocaleString();
  $('#statPoints').textContent = Number(stats.points || 0).toLocaleString();
  $('#statCompletions').textContent = Number(stats.completions || 0).toLocaleString();
}

function filteredRiders() {
  const query = $('#riderSearch').value.trim().toLowerCase();
  if (!query) return riders;
  return riders.filter((rider) => String(rider.display_name || '').toLowerCase().includes(query) || String(rider.id) === query);
}

function renderRiders() {
  const visible = filteredRiders();
  $('#riderRows').innerHTML = visible.length ? visible.map((rider) => `
    <tr class="${Number(rider.id) === selectedRiderId ? 'selected' : ''}">
      <td><strong>${escapeHtml(rider.display_name || 'New Pirate')}</strong><small>#${Number(rider.id)}</small></td>
      <td>${Number(rider.points || 0).toLocaleString()}</td>
      <td>${Number(rider.completion_count || 0)}</td>
      <td title="${escapeHtml(rider.current_quest || 'None')}">${escapeHtml(rider.current_quest || '—')}</td>
      <td><button class="admin-toggle-button" type="button" data-edit-rider="${Number(rider.id)}">Edit</button></td>
    </tr>`).join('') : '<tr><td colspan="5" class="rider-table-empty">No riders match that search.</td></tr>';
}

function selectedRider() {
  return riders.find((rider) => Number(rider.id) === selectedRiderId) || null;
}

function openRider(riderId) {
  selectedRiderId = Number(riderId);
  const rider = selectedRider();
  if (!rider) return;

  $('#editorTitle').textContent = rider.display_name || 'New Pirate';
  $('#editorSubtitle').textContent = `Rider #${rider.id} · Joined ${new Date(String(rider.created_at).replace(' ', 'T')).toLocaleDateString()}`;
  $('#editName').value = rider.display_name || '';
  $('#editPoints').value = Number(rider.points || 0);
  $('#editNameLocked').checked = Number(rider.name_locked) === 1;
  $('#editCompletions').textContent = Number(rider.completion_count || 0);
  $('#editReservations').textContent = Number(rider.reservation_count || 0);
  $('#editMessages').textContent = Number(rider.message_count || 0);
  $('#riderEditPanel').classList.remove('hidden');
  renderRiders();
  $('#riderEditPanel').scrollIntoView({behavior: 'smooth', block: 'start'});
}

async function loadRiders({keepSelection = true} = {}) {
  const state = await adminApi('riders');
  riders = state.riders || [];
  renderStats(state.stats);
  renderRiders();

  if (keepSelection && selectedRiderId && selectedRider()) {
    const rider = selectedRider();
    $('#editorTitle').textContent = rider.display_name || 'New Pirate';
    $('#editorSubtitle').textContent = `Rider #${rider.id} · Joined ${new Date(String(rider.created_at).replace(' ', 'T')).toLocaleDateString()}`;
    $('#editName').value = rider.display_name || '';
    $('#editPoints').value = Number(rider.points || 0);
    $('#editNameLocked').checked = Number(rider.name_locked) === 1;
    $('#editCompletions').textContent = Number(rider.completion_count || 0);
    $('#editReservations').textContent = Number(rider.reservation_count || 0);
    $('#editMessages').textContent = Number(rider.message_count || 0);
  } else if (!selectedRider()) {
    selectedRiderId = null;
    $('#riderEditPanel').classList.add('hidden');
  }
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
    await loadRiders({keepSelection: false});
    $('#loginPanel').classList.add('hidden');
    $('#dash').classList.remove('hidden');
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
  riders = [];
  selectedRiderId = null;
  $('#pw').value = '';
  $('#dash').classList.add('hidden');
  $('#riderEditPanel').classList.add('hidden');
  $('#loginPanel').classList.remove('hidden');
  $('#pw').focus();
});

$('#riderSearch').addEventListener('input', renderRiders);

$('#riderRows').addEventListener('click', (event) => {
  const button = event.target.closest('[data-edit-rider]');
  if (button) openRider(button.dataset.editRider);
});

$('#saveRider').addEventListener('click', async () => {
  const rider = selectedRider();
  if (!rider) return;
  const button = $('#saveRider');
  const displayName = $('#editName').value.trim();
  const points = Number($('#editPoints').value);

  if (displayName.length < 2 || displayName.length > 32) {
    showNotice('Rider names must be 2–32 characters.', 'error');
    return;
  }
  if (!Number.isInteger(points) || points < 0 || points > 1000000) {
    showNotice('Points must be a whole number between 0 and 1,000,000.', 'error');
    return;
  }

  setBusy(button, true, 'Saving…');
  try {
    await adminApi('update_rider', {
      rider_id: rider.id,
      display_name: displayName,
      points,
      name_locked: $('#editNameLocked').checked ? 1 : 0
    });
    await loadRiders();
    showNotice('Rider saved.');
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    setBusy(button, false, 'Saving…');
  }
});

async function runRiderAction({action, button, confirmMessage, successMessage}) {
  const rider = selectedRider();
  if (!rider || !window.confirm(confirmMessage.replace('{name}', rider.display_name || `Rider #${rider.id}`))) return;

  setBusy(button, true, 'Working…');
  try {
    await adminApi(action, {rider_id: rider.id});
    await loadRiders();
    showNotice(successMessage);
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    setBusy(button, false, 'Working…');
  }
}

$('#clearCurrentQuest').addEventListener('click', () => runRiderAction({
  action: 'clear_current_quest',
  button: $('#clearCurrentQuest'),
  confirmMessage: 'Clear the current quest card for {name}?',
  successMessage: 'Current quest card cleared.'
}));

$('#clearQuestHistory').addEventListener('click', () => runRiderAction({
  action: 'clear_quest_history',
  button: $('#clearQuestHistory'),
  confirmMessage: 'Clear all completed quests and achievements for {name}? Their current point total will stay unchanged.',
  successMessage: 'Quest history and achievements cleared.'
}));

$('#resetRider').addEventListener('click', () => runRiderAction({
  action: 'reset_rider',
  button: $('#resetRider'),
  confirmMessage: 'Reset ALL data for {name}? This clears points, quests, achievements, reservations, and log entries.',
  successMessage: 'Rider data reset.'
}));

$('#deleteRider').addEventListener('click', async () => {
  const rider = selectedRider();
  if (!rider || !window.confirm(`Permanently delete ${rider.display_name || `Rider #${rider.id}`}? Their device will start over as a new pirate.`)) return;

  const button = $('#deleteRider');
  setBusy(button, true, 'Deleting…');
  try {
    await adminApi('delete_rider', {rider_id: rider.id});
    selectedRiderId = null;
    await loadRiders({keepSelection: false});
    showNotice('Rider removed.');
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    setBusy(button, false, 'Deleting…');
  }
});

$('#clearFinishedRides').addEventListener('click', async () => {
  if (!window.confirm('Remove every finished ride and its saved reservations? Upcoming and live rides will stay.')) return;
  const button = $('#clearFinishedRides');
  setBusy(button, true, 'Removing…');
  try {
    const result = await adminApi('clear_finished_rides');
    showNotice(`${Number(result.deleted || 0)} finished ride${Number(result.deleted || 0) === 1 ? '' : 's'} removed.`);
    await loadRiders();
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    setBusy(button, false, 'Removing…');
  }
});
