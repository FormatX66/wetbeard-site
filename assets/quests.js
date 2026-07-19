const $ = (selector) => document.querySelector(selector);

let adminPassword = '';
let questState = {quests: [], cards: [], stats: {}};
let editingQuestId = null;
let editingCardId = null;
let ideaFilter = 0;
const DISMISSED_IDEAS_KEY = 'wetbeardDismissedQuestIdeas';
const DISMISSED_CARD_IDEAS_KEY = 'wetbeardDismissedCardIdeas';

const questIdeas = [
  {id:'e01', difficulty:1, stars:5, title:'Give another rider a genuine compliment', description:'Build the crew up anywhere the ride takes you.'},
  {id:'e02', difficulty:1, stars:5, title:'Spot a motorcycle from a brand you have never owned', description:'Name the brand to another rider.'},
  {id:'e03', difficulty:1, stars:5, title:'Find something on the ride that matches your bike', description:'Match by color, shape, name, or attitude.'},
  {id:'e04', difficulty:1, stars:5, title:'Learn another rider’s road name or nickname', description:'Ask how they got the name if they want to share.'},
  {id:'e05', difficulty:1, stars:5, title:'Notice one custom detail on another motorcycle', description:'Tell its rider what caught your eye.'},
  {id:'e06', difficulty:1, stars:5, title:'Share your favorite motorcycle song with the crew', description:'A title is enough; no music playback required.'},
  {id:'e07', difficulty:1, stars:5, title:'Name one road you would happily ride again', description:'Share what makes that road memorable.'},
  {id:'e08', difficulty:1, stars:5, title:'Thank someone who helped make the ride happen', description:'Recognize an organizer, road captain, helper, or riding partner.'},
  {id:'m01', difficulty:2, stars:10, title:'Introduce two riders who have not met', description:'Help two people in the crew make a new connection.'},
  {id:'m02', difficulty:2, stars:10, title:'Learn the story behind another rider’s motorcycle', description:'Ask why they chose it or what makes it special.'},
  {id:'m03', difficulty:2, stars:10, title:'Find three different motorcycle makes on the ride', description:'Identify three distinct manufacturers.'},
  {id:'m04', difficulty:2, stars:10, title:'Share one useful riding tip with another rider', description:'Keep it friendly, practical, and safety-minded.'},
  {id:'m05', difficulty:2, stars:10, title:'Ask a rider about their favorite ride of all time', description:'Listen for the place, people, or story that made it great.'},
  {id:'m06', difficulty:2, stars:10, title:'Help check another rider’s lights or signals', description:'Only while safely parked before or after riding.'},
  {id:'m07', difficulty:2, stars:10, title:'Find a rider with more years of experience than you', description:'Ask what lesson took them longest to learn.'},
  {id:'m08', difficulty:2, stars:10, title:'Find a rider with fewer years of experience than you', description:'Welcome them and ask what they enjoy most so far.'},
  {id:'h01', difficulty:3, stars:20, title:'Ride with someone you have never ridden beside before', description:'Make a new riding connection while following the group formation.'},
  {id:'h02', difficulty:3, stars:20, title:'Help a new rider feel included in the crew', description:'Introduce yourself, include them in conversation, and connect them with another rider.'},
  {id:'h03', difficulty:3, stars:20, title:'Learn three riders’ motorcycle origin stories', description:'Ask what first inspired each person to ride.'},
  {id:'h04', difficulty:3, stars:20, title:'Share a meaningful road story with the crew', description:'Tell a short story about a ride that changed or taught you something.'},
  {id:'h05', difficulty:3, stars:20, title:'Find five unique custom details across the motorcycles', description:'Look for paint, lighting, controls, luggage, exhaust, or handmade touches.'},
  {id:'h06', difficulty:3, stars:20, title:'Make three positive introductions during the ride', description:'Connect riders using something they have in common.'},
  {id:'h07', difficulty:3, stars:20, title:'Collect three pieces of local road knowledge', description:'Ask riders about roads, hazards, views, or routes worth remembering.'},
  {id:'h08', difficulty:3, stars:20, title:'Recognize three different people who supported the ride', description:'Thank riders or helpers for specific things they contributed.'}
];

const cardIdeas = [
  {id:'animal-friend', title:'Animal Friend', quests:[
    {difficulty:1, stars:5, title:'Pet a friendly dog', description:'Only with the owner’s permission and when safely off the motorcycle.'},
    {difficulty:2, stars:10, title:'Meet and pet a friendly cat', description:'Let the cat approach and get the owner’s permission first.'},
    {difficulty:3, stars:20, title:'Meet an exotic or unusual pet', description:'Safely meet a bird, reptile, farm animal, or other uncommon companion with permission.'}]},
  {id:'crew-builder', title:'Crew Builder', quests:[
    {difficulty:1, stars:5, title:'Learn a rider’s name', description:'Introduce yourself and learn the name they prefer to use.'},
    {difficulty:2, stars:10, title:'Introduce two riders who have not met', description:'Help two people in the crew make a new connection.'},
    {difficulty:3, stars:20, title:'Make three positive introductions', description:'Connect riders using something they have in common.'}]},
  {id:'machine-spotter', title:'Machine Spotter', quests:[
    {difficulty:1, stars:5, title:'Spot a motorcycle brand you have never owned', description:'Identify the manufacturer.'},
    {difficulty:2, stars:10, title:'Find three different motorcycle makes', description:'Identify three distinct manufacturers represented on the ride.'},
    {difficulty:3, stars:20, title:'Find five unique custom motorcycle details', description:'Look for paint, lighting, controls, luggage, exhaust, or handmade touches.'}]},
  {id:'road-stories', title:'Road Stories', quests:[
    {difficulty:1, stars:5, title:'Name a road you would happily ride again', description:'Share what makes that road memorable.'},
    {difficulty:2, stars:10, title:'Ask a rider about their favorite ride', description:'Listen for the place, people, or story that made it great.'},
    {difficulty:3, stars:20, title:'Share a meaningful road story', description:'Tell the crew about a ride that changed or taught you something.'}]},
  {id:'safety-watch', title:'Safety Watch', quests:[
    {difficulty:1, stars:5, title:'Check your motorcycle before riding', description:'Give tires, lights, controls, fluids, and stands a quick visual check.'},
    {difficulty:2, stars:10, title:'Help check another rider’s lights and signals', description:'Only while safely parked before or after riding.'},
    {difficulty:3, stars:20, title:'Share three useful safety reminders with the crew', description:'Keep them practical, friendly, and appropriate for today’s ride.'}]},
  {id:'local-knowledge', title:'Local Knowledge', quests:[
    {difficulty:1, stars:5, title:'Learn the name of a road you have not ridden', description:'Ask another rider for one local road name.'},
    {difficulty:2, stars:10, title:'Learn one local road hazard', description:'Ask about a curve, surface, crossing, or traffic pattern worth remembering.'},
    {difficulty:3, stars:20, title:'Collect three pieces of local road knowledge', description:'Ask riders about roads, hazards, views, or routes worth remembering.'}]},
  {id:'good-vibes', title:'Good Vibes', quests:[
    {difficulty:1, stars:5, title:'Give another rider a genuine compliment', description:'Build the crew up anywhere the ride takes you.'},
    {difficulty:2, stars:10, title:'Recognize someone’s contribution to the ride', description:'Thank them for one specific thing they did.'},
    {difficulty:3, stars:20, title:'Recognize three people who supported the ride', description:'Thank riders or helpers for specific things they contributed.'}]},
  {id:'rider-roots', title:'Rider Roots', quests:[
    {difficulty:1, stars:5, title:'Ask someone what motorcycle they first rode', description:'Learn the make or model if they remember it.'},
    {difficulty:2, stars:10, title:'Learn the story behind another rider’s motorcycle', description:'Ask why they chose it or what makes it special.'},
    {difficulty:3, stars:20, title:'Learn three riders’ motorcycle origin stories', description:'Ask what first inspired each person to ride.'}]},
  {id:'road-soundtrack', title:'Road Soundtrack', quests:[
    {difficulty:1, stars:5, title:'Share your favorite motorcycle song', description:'A song title is enough; no music playback required.'},
    {difficulty:2, stars:10, title:'Collect three songs for a crew playlist', description:'Ask three riders for one road-song recommendation each.'},
    {difficulty:3, stars:20, title:'Build a ten-song ride playlist with the crew', description:'Collect ten unique song recommendations from riders.'}]},
  {id:'welcome-aboard', title:'Welcome Aboard', quests:[
    {difficulty:1, stars:5, title:'Welcome someone you have not met before', description:'Introduce yourself and make room in the conversation.'},
    {difficulty:2, stars:10, title:'Ride near someone you have not ridden with before', description:'Follow the group formation and road captain’s directions.'},
    {difficulty:3, stars:20, title:'Help a new rider feel included in the crew', description:'Introduce them to others and include them in conversation.'}]},
  {id:'style-scout', title:'Style Scout', quests:[
    {difficulty:1, stars:5, title:'Notice one custom detail on a motorcycle', description:'Tell its rider what caught your eye.'},
    {difficulty:2, stars:10, title:'Find three different motorcycle styles', description:'Examples include cruiser, touring, sport, standard, adventure, or trike.'},
    {difficulty:3, stars:20, title:'Find five motorcycles with distinct personalities', description:'Identify what makes each machine’s look or setup unique.'}]},
  {id:'wisdom-run', title:'Wisdom Run', quests:[
    {difficulty:1, stars:5, title:'Share one useful riding tip', description:'Keep it friendly, practical, and safety-minded.'},
    {difficulty:2, stars:10, title:'Ask an experienced rider for one lesson', description:'Find out what lesson took them longest to learn.'},
    {difficulty:3, stars:20, title:'Trade riding wisdom with three different riders', description:'Give or receive one useful lesson in each conversation.'}]}
];

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

function dismissedIdeaIds() {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_IDEAS_KEY) || '[]')); }
  catch { return new Set(); }
}

function saveDismissedIdeaIds(ids) {
  localStorage.setItem(DISMISSED_IDEAS_KEY, JSON.stringify([...ids]));
}

function dismissedCardIdeaIds() {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_CARD_IDEAS_KEY) || '[]')); }
  catch { return new Set(); }
}

function renderCardIdeas() {
  const dismissed = dismissedCardIdeaIds();
  const existingCards = new Set(questState.cards.map((card) => String(card.title || '').trim().toLowerCase()));
  const ideas = cardIdeas.filter((idea) => !dismissed.has(idea.id) && !existingCards.has(idea.title.toLowerCase()));
  $('#cardIdeas').innerHTML = ideas.length ? ideas.map((idea) => `
    <article class="card-idea-card">
      <div class="card-idea-copy"><strong>${escapeHtml(idea.title)}</strong><ol>${idea.quests.map((quest) => `<li><b>${difficultyNames[quest.difficulty]}</b><span>${escapeHtml(quest.title)}</span><small>${quest.stars} Stars</small></li>`).join('')}</ol></div>
      <div class="quest-idea-actions"><button class="idea-approve" type="button" data-approve-card-idea="${idea.id}" aria-label="Add this quest card and its quests">👍</button><button class="idea-dismiss" type="button" data-dismiss-card-idea="${idea.id}" aria-label="Dismiss this card idea">👎</button></div>
    </article>`).join('') : '<div class="admin-empty">No unused card ideas remain. Restore dismissed ideas to review them again.</div>';
}

function renderQuestIdeas() {
  const dismissed = dismissedIdeaIds();
  const existing = new Set(questState.quests.map((quest) => String(quest.title || '').trim().toLowerCase()));
  const ideas = questIdeas.filter((idea) => !dismissed.has(idea.id) && !existing.has(idea.title.toLowerCase()) && (!ideaFilter || idea.difficulty === ideaFilter));
  $('#questIdeas').innerHTML = ideas.length ? ideas.map((idea) => `
    <article class="quest-idea-card difficulty-${idea.difficulty}">
      <div><span>${difficultyNames[idea.difficulty]}</span><strong>${escapeHtml(idea.title)}</strong><p>${escapeHtml(idea.description)}</p><small>${idea.stars} Gold Nautical Stars</small></div>
      <div class="quest-idea-actions"><button class="idea-approve" type="button" data-approve-idea="${idea.id}" aria-label="Add this quest">👍</button><button class="idea-dismiss" type="button" data-dismiss-idea="${idea.id}" aria-label="Dismiss this idea">👎</button></div>
    </article>`).join('') : '<div class="admin-empty">No unused ideas in this group. Restore dismissed ideas or choose another difficulty.</div>';
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
  renderQuestIdeas();
  renderCardIdeas();
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
document.querySelector('.quest-idea-filters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-idea-filter]');
  if (!button) return;
  ideaFilter = Number(button.dataset.ideaFilter);
  document.querySelectorAll('[data-idea-filter]').forEach((item) => item.classList.toggle('active', item === button));
  renderQuestIdeas();
});
$('#restoreIdeas').addEventListener('click', () => { localStorage.removeItem(DISMISSED_IDEAS_KEY); renderQuestIdeas(); showNotice('Dismissed ideas restored.'); });
$('#restoreCardIdeas').addEventListener('click', () => { localStorage.removeItem(DISMISSED_CARD_IDEAS_KEY); renderCardIdeas(); showNotice('Dismissed card ideas restored.'); });
$('#questIdeas').addEventListener('click', async (event) => {
  const approve = event.target.closest('[data-approve-idea]');
  const dismiss = event.target.closest('[data-dismiss-idea]');
  const ideaId = approve?.dataset.approveIdea || dismiss?.dataset.dismissIdea;
  if (!ideaId) return;
  const idea = questIdeas.find((item) => item.id === ideaId);
  if (!idea) return;
  if (dismiss) {
    const ids = dismissedIdeaIds();
    ids.add(idea.id);
    saveDismissedIdeaIds(ids);
    renderQuestIdeas();
    return;
  }
  setBusy(approve, true, '…');
  try {
    await questApi('create_quest', {title:idea.title, description:idea.description, difficulty:idea.difficulty, active:1, star_value:idea.stars});
    await loadState();
    showNotice(`Quest added: ${idea.title}`);
  } catch (error) {
    showNotice(error.message, 'error');
    setBusy(approve, false, '…');
  }
});
$('#cardIdeas').addEventListener('click', async (event) => {
  const approve = event.target.closest('[data-approve-card-idea]');
  const dismiss = event.target.closest('[data-dismiss-card-idea]');
  const ideaId = approve?.dataset.approveCardIdea || dismiss?.dataset.dismissCardIdea;
  if (!ideaId) return;
  const idea = cardIdeas.find((item) => item.id === ideaId);
  if (!idea) return;
  if (dismiss) {
    const ids = dismissedCardIdeaIds();
    ids.add(idea.id);
    localStorage.setItem(DISMISSED_CARD_IDEAS_KEY, JSON.stringify([...ids]));
    renderCardIdeas();
    return;
  }
  setBusy(approve, true, '…');
  try {
    await questApi('create_card_bundle', {title:idea.title, quests:idea.quests});
    await loadState();
    showNotice(`Quest card added: ${idea.title}`);
  } catch (error) {
    showNotice(error.message, 'error');
    setBusy(approve, false, '…');
  }
});
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
