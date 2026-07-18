const $ = (selector) => document.querySelector(selector);

let adminPassword = '';
let questState = {quests: [], cards: [], stats: {}};
let editingQuestId = null;
let editingCardId = null;

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character]));

const difficultyNames = {1: 'Easy', 2: 'Medium', 3: 'Hard'};

async function questApi(action, data = {}) {
  const response = await fetch(`api/quests.php?action=${encodeURIComponent(action)}`, {
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

function showNotice(message = '', type = 'success') {
  const notice = $('#editorNotice');
  notice.textContent = message;
  notice.className = `admin-notice ${message ? `show ${type}` : ''}`;
  if (message) {
    window.clearTimeout(showNotice.timer);
    showNotice.timer = window.setTimeout(() => showNotice(), 4500);
  }
}

function setButtonLabel(button, label) {
  button.textContent = label;
  button.dataset.label = label;
}

function setBusy(button, busy, busyLabel) {
  if (!button.dataset.label) button.dataset.label = button.textContent;
  button.disabled = busy;
  button.textContent = busy ? busyLabel : button.dataset.label;
}

function questById(questId) {
  return questState.quests.find((quest) => Number(quest.id) === Number(questId)) || null;
}

function cardById(cardId) {
  return questState.cards.find((card) => Number(card.id) === Number(cardId)) || null;
}

function renderStats() {
  $('#statQuests').textContent = Number(questState.stats.quests || 0).toLocaleString();
  $('#statActiveQuests').textContent = Number(questState.stats.active_quests || 0).toLocaleString();
  $('#statReadyCards').textContent = Number(questState.stats.ready_cards || 0).toLocaleString();
}

function filteredQuests() {
  const query = $('#questSearch').value.trim().toLowerCase();
  if (!query) return questState.quests;
  return questState.quests.filter((quest) => `${quest.title || ''} ${quest.description || ''}`.toLowerCase().includes(query));
}

function renderQuests() {
  const quests = filteredQuests();
  $('#questRows').innerHTML = quests.length ? quests.map((quest) => {
    const active = Number(quest.active) === 1;
    return `<article class="admin-record ${active ? '' : 'is-disabled'}">
      <div class="admin-record-heading">
        <strong>${escapeHtml(quest.title)}</strong>
        <span class="quest-difficulty difficulty-${Number(quest.difficulty)}">${difficultyNames[Number(quest.difficulty)] || 'Unknown'}</span>
      </div>
      ${quest.description ? `<p>${escapeHtml(quest.description)}</p>` : ''}
      <div class="admin-record-meta"><span>${Number(quest.star_value || 0).toLocaleString()} Gold Nautical Stars</span><span>${Number(quest.card_count || 0)} card${Number(quest.card_count || 0) === 1 ? '' : 's'}</span></div>
      <div class="admin-record-actions">
        <button type="button" data-edit-quest="${Number(quest.id)}">Edit</button>
        <button type="button" data-duplicate-quest="${Number(quest.id)}">Duplicate</button>
        <button class="${active ? 'active' : ''}" type="button" data-toggle-quest="${Number(quest.id)}">${active ? 'Disable' : 'Enable'}</button>
        <button class="danger" type="button" data-delete-quest="${Number(quest.id)}">Delete</button>
      </div>
    </article>`;
  }).join('') : '<div class="admin-empty">No quests match this search.</div>';
}

function selectedCardSlots() {
  return {
    1: Number($('#cardEasy').value || 0),
    2: Number($('#cardMedium').value || 0),
    3: Number($('#cardHard').value || 0)
  };
}

function questOptions(difficulty, selectedId) {
  const quests = questState.quests.filter((quest) => Number(quest.difficulty) === difficulty);
  const options = ['<option value="">Choose a quest…</option>'];
  quests.forEach((quest) => {
    const selected = Number(quest.id) === Number(selectedId) ? ' selected' : '';
    const inactive = Number(quest.active) === 1 ? '' : ' (disabled)';
    options.push(`<option value="${Number(quest.id)}"${selected}>${escapeHtml(quest.title)}${inactive}</option>`);
  });
  return options.join('');
}

function populateCardSelects(selections = selectedCardSlots()) {
  $('#cardEasy').innerHTML = questOptions(1, selections[1]);
  $('#cardMedium').innerHTML = questOptions(2, selections[2]);
  $('#cardHard').innerHTML = questOptions(3, selections[3]);
}

function renderCards() {
  $('#cardRows').innerHTML = questState.cards.length ? questState.cards.map((card) => {
    const active = Number(card.active) === 1;
    const slots = Object.fromEntries((card.slots || []).map((slot) => [Number(slot.slot_number), slot]));
    const ready = [1, 2, 3].every((slotNumber) => slots[slotNumber] && Number(slots[slotNumber].quest_active) === 1);
    return `<article class="admin-record ${active ? '' : 'is-disabled'}">
      <div class="admin-record-heading">
        <strong>#${Number(card.id)} · ${escapeHtml(card.title)}</strong>
        <span class="admin-status ${active && ready ? 'admin-status-live' : 'admin-status-finished'}">${active && ready ? 'Ready' : (active ? 'Blocked' : 'Disabled')}</span>
      </div>
      <ol class="quest-card-slots">
        ${[1, 2, 3].map((slotNumber) => `<li><b>${difficultyNames[slotNumber]}</b><span>${escapeHtml(slots[slotNumber]?.quest_title || 'Unassigned')}</span></li>`).join('')}
      </ol>
      <div class="admin-record-actions card-actions">
        <button type="button" data-edit-card="${Number(card.id)}">Edit Card</button>
        <button class="${active ? 'active' : ''}" type="button" data-toggle-card="${Number(card.id)}">${active ? 'Disable' : 'Enable'}</button>
        <button class="danger" type="button" data-delete-card="${Number(card.id)}">Delete</button>
      </div>
    </article>`;
  }).join('') : '<div class="admin-empty">No quest cards have been created.</div>';
}

function renderState() {
  renderStats();
  renderQuests();
  populateCardSelects();
  renderCards();
}

async function loadState() {
  const state = await questApi('state');
  questState = state;
  renderState();
}

function resetQuestForm() {
  editingQuestId = null;
  $('#questTitle').value = '';
  $('#questDescription').value = '';
  $('#questDifficulty').value = '1';
  $('#questStars').value = '10';
  $('#questActive').checked = true;
  $('#questFormTitle').textContent = 'Create a Quest';
  setButtonLabel($('#saveQuest'), 'Create Quest');
  $('#cancelQuestEdit').classList.add('hidden');
}

function openQuest(questId) {
  const quest = questById(questId);
  if (!quest) return;
  editingQuestId = Number(quest.id);
  $('#questTitle').value = quest.title || '';
  $('#questDescription').value = quest.description || '';
  $('#questDifficulty').value = String(quest.difficulty || 1);
  $('#questStars').value = String(quest.star_value || 0);
  $('#questActive').checked = Number(quest.active) === 1;
  $('#questFormTitle').textContent = `Edit Quest #${Number(quest.id)}`;
  setButtonLabel($('#saveQuest'), 'Save Quest');
  $('#cancelQuestEdit').classList.remove('hidden');
  $('#questFormPanel').scrollIntoView({behavior: 'smooth', block: 'start'});
  $('#questTitle').focus({preventScroll: true});
}

function resetCardForm() {
  editingCardId = null;
  $('#cardTitle').value = '';
  $('#cardActive').checked = true;
  populateCardSelects({1: 0, 2: 0, 3: 0});
  $('#cardFormTitle').textContent = 'Create a Quest Card';
  setButtonLabel($('#saveCard'), 'Create Card');
  $('#cancelCardEdit').classList.add('hidden');
}

function openCard(cardId) {
  const card = cardById(cardId);
  if (!card) return;
  editingCardId = Number(card.id);
  $('#cardTitle').value = card.title || '';
  $('#cardActive').checked = Number(card.active) === 1;
  const slots = Object.fromEntries((card.slots || []).map((slot) => [Number(slot.slot_number), Number(slot.quest_id)]));
  populateCardSelects(slots);
  $('#cardFormTitle').textContent = `Edit Quest Card #${Number(card.id)}`;
  setButtonLabel($('#saveCard'), 'Save Card');
  $('#cancelCardEdit').classList.remove('hidden');
  $('#cardFormPanel').scrollIntoView({behavior: 'smooth', block: 'start'});
  $('#cardTitle').focus({preventScroll: true});
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
    await loadState();
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
  questState = {quests: [], cards: [], stats: {}};
  resetQuestForm();
  resetCardForm();
  $('#pw').value = '';
  $('#dash').classList.add('hidden');
  $('#loginPanel').classList.remove('hidden');
  $('#pw').focus();
});

$('#questSearch').addEventListener('input', renderQuests);
$('#cancelQuestEdit').addEventListener('click', resetQuestForm);
$('#cancelCardEdit').addEventListener('click', resetCardForm);

$('#saveQuest').addEventListener('click', async () => {
  const title = $('#questTitle').value.trim();
  const description = $('#questDescription').value.trim();
  const difficulty = Number($('#questDifficulty').value);
  const starValue = Number($('#questStars').value);
  if (!title) return showNotice('Add a quest title.', 'error');
  if (!Number.isInteger(starValue) || starValue < 0 || starValue > 100000) return showNotice('Gold Nautical Stars must be a whole number from 0 to 100,000.', 'error');

  const button = $('#saveQuest');
  const questId = editingQuestId;
  setBusy(button, true, questId ? 'Saving…' : 'Creating…');
  try {
    await questApi(questId ? 'update_quest' : 'create_quest', {
      ...(questId ? {id: questId} : {}),
      title,
      description,
      difficulty,
      active: $('#questActive').checked ? 1 : 0,
      star_value: starValue
    });
    resetQuestForm();
    await loadState();
    showNotice(questId ? 'Quest saved.' : 'Quest created.');
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    setBusy(button, false, questId ? 'Saving…' : 'Creating…');
  }
});

$('#questRows').addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-edit-quest]');
  if (editButton) return openQuest(editButton.dataset.editQuest);

  const actionButton = event.target.closest('[data-duplicate-quest],[data-toggle-quest],[data-delete-quest]');
  if (!actionButton) return;
  const questId = Number(actionButton.dataset.duplicateQuest || actionButton.dataset.toggleQuest || actionButton.dataset.deleteQuest);
  const quest = questById(questId);
  if (!quest) return;

  let action = 'duplicate_quest';
  let busyLabel = 'Duplicating…';
  let successMessage = 'Inactive quest copy created.';
  if (actionButton.dataset.toggleQuest) {
    action = 'toggle_quest';
    busyLabel = 'Saving…';
    successMessage = Number(quest.active) === 1 ? 'Quest disabled.' : 'Quest enabled.';
  }
  if (actionButton.dataset.deleteQuest) {
    if (!window.confirm(`Delete “${quest.title}”? Assigned quests must be removed from their cards first.`)) return;
    action = 'delete_quest';
    busyLabel = 'Deleting…';
    successMessage = 'Quest deleted.';
  }

  setBusy(actionButton, true, busyLabel);
  try {
    await questApi(action, {id: questId});
    if (action === 'delete_quest' && editingQuestId === questId) resetQuestForm();
    await loadState();
    showNotice(successMessage);
  } catch (error) {
    showNotice(error.message, 'error');
    setBusy(actionButton, false, busyLabel);
  }
});

$('#saveCard').addEventListener('click', async () => {
  const title = $('#cardTitle').value.trim();
  const slots = selectedCardSlots();
  if (!title) return showNotice('Add a quest-card title.', 'error');
  if (Object.values(slots).some((questId) => !questId)) return showNotice('Assign a quest to every card slot.', 'error');
  if (new Set(Object.values(slots)).size !== 3) return showNotice('Use a different quest in each card slot.', 'error');

  const button = $('#saveCard');
  const cardId = editingCardId;
  setBusy(button, true, cardId ? 'Saving…' : 'Creating…');
  try {
    await questApi(cardId ? 'update_card' : 'create_card', {
      ...(cardId ? {id: cardId} : {}),
      title,
      active: $('#cardActive').checked ? 1 : 0,
      slots
    });
    resetCardForm();
    await loadState();
    showNotice(cardId ? 'Quest card saved.' : 'Quest card created.');
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    setBusy(button, false, cardId ? 'Saving…' : 'Creating…');
  }
});

$('#cardRows').addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-edit-card]');
  if (editButton) return openCard(editButton.dataset.editCard);

  const actionButton = event.target.closest('[data-toggle-card],[data-delete-card]');
  if (!actionButton) return;
  const cardId = Number(actionButton.dataset.toggleCard || actionButton.dataset.deleteCard);
  const card = cardById(cardId);
  if (!card) return;

  const deleting = Boolean(actionButton.dataset.deleteCard);
  if (deleting && !window.confirm(`Delete “${card.title}”? Cards with rider history cannot be deleted.`)) return;
  setBusy(actionButton, true, deleting ? 'Deleting…' : 'Saving…');
  try {
    await questApi(deleting ? 'delete_card' : 'toggle_card', {id: cardId});
    if (deleting && editingCardId === cardId) resetCardForm();
    await loadState();
    showNotice(deleting ? 'Quest card deleted.' : (Number(card.active) === 1 ? 'Quest card disabled.' : 'Quest card enabled.'));
  } catch (error) {
    showNotice(error.message, 'error');
    setBusy(actionButton, false, deleting ? 'Deleting…' : 'Saving…');
  }
});

resetQuestForm();
resetCardForm();
