<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/quest-store.php';

$pdo = db();
$data = body();
if (!admin_ok($data)) respond(['ok' => false, 'error' => 'Invalid admin password'], 401);
$action = (string)($_GET['action'] ?? 'state');

ensure_quest_management_schema($pdo);

function requested_quest_id(array $data): int {
    $questId = (int)($data['id'] ?? 0);
    if ($questId < 1) respond(['ok' => false, 'error' => 'Choose a valid quest.'], 422);
    return $questId;
}

function requested_quest_card_id(array $data): int {
    $cardId = (int)($data['id'] ?? 0);
    if ($cardId < 1) respond(['ok' => false, 'error' => 'Choose a valid quest card.'], 422);
    return $cardId;
}

function validated_quest_fields(array $data): array {
    $title = trim((string)($data['title'] ?? ''));
    $description = trim((string)($data['description'] ?? ''));
    $difficulty = filter_var($data['difficulty'] ?? null, FILTER_VALIDATE_INT);
    $starValue = filter_var($data['star_value'] ?? null, FILTER_VALIDATE_INT);
    if ($title === '') respond(['ok' => false, 'error' => 'Add a quest title.'], 422);
    if (mb_strlen($title) > 500) respond(['ok' => false, 'error' => 'Quest titles must be 500 characters or fewer.'], 422);
    if (mb_strlen($description) > 1000) respond(['ok' => false, 'error' => 'Quest descriptions must be 1,000 characters or fewer.'], 422);
    if ($difficulty === false || $difficulty < 1 || $difficulty > 3) respond(['ok' => false, 'error' => 'Choose an easy, medium, or hard difficulty.'], 422);
    if ($starValue === false || $starValue < 0 || $starValue > 100000) respond(['ok' => false, 'error' => 'Gold Nautical Stars must be a whole number from 0 to 100,000.'], 422);
    return [
        'title' => $title,
        'description' => $description,
        'difficulty' => $difficulty,
        'active' => !empty($data['active']) ? 1 : 0,
        'star_value' => $starValue,
    ];
}

function validated_card_fields(PDO $pdo, array $data): array {
    $title = trim((string)($data['title'] ?? ''));
    if ($title === '') respond(['ok' => false, 'error' => 'Add a quest-card title.'], 422);
    if (mb_strlen($title) > 120) respond(['ok' => false, 'error' => 'Quest-card titles must be 120 characters or fewer.'], 422);

    $submittedSlots = is_array($data['slots'] ?? null) ? $data['slots'] : [];
    $questIds = [];
    foreach ([1, 2, 3] as $slotNumber) {
        $questId = (int)($submittedSlots[$slotNumber] ?? 0);
        if ($questId < 1) respond(['ok' => false, 'error' => 'Assign a quest to every card slot.'], 422);
        $questIds[$slotNumber] = $questId;
    }
    if (count(array_unique($questIds)) !== 3) respond(['ok' => false, 'error' => 'Use a different quest in each card slot.'], 422);

    $placeholders = implode(',', array_fill(0, count($questIds), '?'));
    $query = $pdo->prepare("SELECT * FROM quests WHERE id IN ($placeholders)");
    $query->execute(array_values($questIds));
    $quests = [];
    foreach ($query->fetchAll() as $quest) $quests[(int)$quest['id']] = $quest;
    foreach ($questIds as $slotNumber => $questId) {
        if (!isset($quests[$questId])) respond(['ok' => false, 'error' => 'One of the selected quests no longer exists.'], 409);
        if ((int)$quests[$questId]['difficulty'] !== $slotNumber) {
            respond(['ok' => false, 'error' => 'Each quest must match its easy, medium, or hard card slot.'], 422);
        }
    }

    return [
        'title' => $title,
        'active' => !empty($data['active']) ? 1 : 0,
        'quest_ids' => $questIds,
        'quests' => $quests,
    ];
}

if ($action === 'state') {
    $quests = quest_management_quests($pdo);
    $cards = quest_management_cards($pdo);
    $readyCards = 0;
    foreach ($cards as $card) {
        if ((int)$card['active'] !== 1 || count($card['slots']) !== 3) continue;
        $allActive = true;
        foreach ($card['slots'] as $slot) {
            if ((int)$slot['quest_active'] !== 1) $allActive = false;
        }
        if ($allActive) $readyCards++;
    }
    $activeQuests = count(array_filter($quests, fn($quest) => (int)$quest['active'] === 1));
    respond([
        'ok' => true,
        'quests' => $quests,
        'cards' => $cards,
        'stats' => [
            'quests' => count($quests),
            'active_quests' => $activeQuests,
            'ready_cards' => $readyCards,
        ],
    ]);
}

if ($action === 'create_quest') {
    $fields = validated_quest_fields($data);
    $query = $pdo->prepare('INSERT INTO quests(title,description,difficulty,active,star_value) VALUES(?,?,?,?,?)');
    $query->execute([$fields['title'], $fields['description'], $fields['difficulty'], $fields['active'], $fields['star_value']]);
    respond(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
}

if ($action === 'update_quest') {
    $questId = requested_quest_id($data);
    $current = quest_management_quest($pdo, $questId);
    $fields = validated_quest_fields($data);

    if ((int)$current['difficulty'] !== (int)$fields['difficulty']) {
        $slotQuery = $pdo->prepare('SELECT DISTINCT slot_number FROM quest_card_slots WHERE quest_id=?');
        $slotQuery->execute([$questId]);
        foreach ($slotQuery->fetchAll() as $slot) {
            if ((int)$slot['slot_number'] !== (int)$fields['difficulty']) {
                respond(['ok' => false, 'error' => 'Remove this quest from its current cards before changing its difficulty.'], 409);
            }
        }
    }

    try {
        $pdo->beginTransaction();
        $query = $pdo->prepare('UPDATE quests SET title=?,description=?,difficulty=?,active=?,star_value=? WHERE id=?');
        $query->execute([$fields['title'], $fields['description'], $fields['difficulty'], $fields['active'], $fields['star_value'], $questId]);

        $taskQuery = $pdo->prepare('SELECT quest_task_id FROM quest_card_slots WHERE quest_id=?');
        $taskQuery->execute([$questId]);
        foreach ($taskQuery->fetchAll() as $task) {
            quest_management_sync_compatibility_task($pdo, (int)$task['quest_task_id'], $fields);
        }
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
    respond(['ok' => true]);
}

if ($action === 'duplicate_quest') {
    $quest = quest_management_quest($pdo, requested_quest_id($data));
    $title = mb_substr('Copy of ' . (string)$quest['title'], 0, 500);
    $query = $pdo->prepare('INSERT INTO quests(title,description,difficulty,active,star_value) VALUES(?,?,?,?,?)');
    $query->execute([$title, $quest['description'], (int)$quest['difficulty'], 0, (int)$quest['star_value']]);
    respond(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
}

if ($action === 'toggle_quest') {
    $questId = requested_quest_id($data);
    quest_management_quest($pdo, $questId);
    $pdo->prepare('UPDATE quests SET active=IF(active=1,0,1) WHERE id=?')->execute([$questId]);
    respond(['ok' => true]);
}

if ($action === 'delete_quest') {
    $questId = requested_quest_id($data);
    quest_management_quest($pdo, $questId);
    $query = $pdo->prepare('SELECT COUNT(*) FROM quest_card_slots WHERE quest_id=?');
    $query->execute([$questId]);
    if ((int)$query->fetchColumn() > 0) {
        respond(['ok' => false, 'error' => 'This quest is assigned to a card. Remove it from every card before deleting it.'], 409);
    }
    $pdo->prepare('DELETE FROM quests WHERE id=?')->execute([$questId]);
    respond(['ok' => true]);
}

if ($action === 'create_card') {
    $fields = validated_card_fields($pdo, $data);
    try {
        $pdo->beginTransaction();
        $query = $pdo->prepare('INSERT INTO quest_cards(title,active) VALUES(?,?)');
        $query->execute([$fields['title'], $fields['active']]);
        $cardId = (int)$pdo->lastInsertId();
        $insertSlot = $pdo->prepare('INSERT INTO quest_card_slots(quest_card_id,slot_number,quest_id,quest_task_id) VALUES(?,?,?,?)');
        foreach ($fields['quest_ids'] as $slotNumber => $questId) {
            $taskId = quest_management_insert_compatibility_task($pdo, $cardId, $fields['quests'][$questId]);
            $insertSlot->execute([$cardId, $slotNumber, $questId, $taskId]);
        }
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
    respond(['ok' => true, 'id' => $cardId]);
}

if ($action === 'update_card') {
    $cardId = requested_quest_card_id($data);
    quest_management_card($pdo, $cardId);
    $fields = validated_card_fields($pdo, $data);
    $slotQuery = $pdo->prepare('SELECT * FROM quest_card_slots WHERE quest_card_id=?');
    $slotQuery->execute([$cardId]);
    $currentSlots = [];
    foreach ($slotQuery->fetchAll() as $slot) $currentSlots[(int)$slot['slot_number']] = $slot;

    try {
        $pdo->beginTransaction();
        $pdo->prepare('UPDATE quest_cards SET title=?,active=? WHERE id=?')->execute([$fields['title'], $fields['active'], $cardId]);
        $insertSlot = $pdo->prepare('INSERT INTO quest_card_slots(quest_card_id,slot_number,quest_id,quest_task_id) VALUES(?,?,?,?)');
        $updateSlot = $pdo->prepare('UPDATE quest_card_slots SET quest_id=?,quest_task_id=? WHERE quest_card_id=? AND slot_number=?');
        foreach ($fields['quest_ids'] as $slotNumber => $questId) {
            $quest = $fields['quests'][$questId];
            $current = $currentSlots[$slotNumber] ?? null;
            if ($current && (int)$current['quest_id'] === $questId) {
                quest_management_sync_compatibility_task($pdo, (int)$current['quest_task_id'], $quest);
                continue;
            }

            $taskId = quest_management_insert_compatibility_task($pdo, $cardId, $quest);
            if ($current) {
                $updateSlot->execute([$questId, $taskId, $cardId, $slotNumber]);
            } else {
                $insertSlot->execute([$cardId, $slotNumber, $questId, $taskId]);
            }
        }
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
    respond(['ok' => true]);
}

if ($action === 'toggle_card') {
    $cardId = requested_quest_card_id($data);
    quest_management_card($pdo, $cardId);
    $pdo->prepare('UPDATE quest_cards SET active=IF(active=1,0,1) WHERE id=?')->execute([$cardId]);
    respond(['ok' => true]);
}

if ($action === 'delete_card') {
    $cardId = requested_quest_card_id($data);
    quest_management_card($pdo, $cardId);
    $currentQuery = $pdo->prepare('SELECT COUNT(*) FROM rider_current_quests WHERE quest_card_id=?');
    $currentQuery->execute([$cardId]);
    $historyQuery = $pdo->prepare('SELECT COUNT(*) FROM completions c JOIN quest_tasks qt ON qt.id=c.quest_task_id WHERE qt.quest_card_id=?');
    $historyQuery->execute([$cardId]);
    if ((int)$currentQuery->fetchColumn() > 0 || (int)$historyQuery->fetchColumn() > 0) {
        respond(['ok' => false, 'error' => 'This card has rider history and cannot be deleted. Disable it instead.'], 409);
    }

    try {
        $pdo->beginTransaction();
        $pdo->prepare('DELETE FROM quest_card_slots WHERE quest_card_id=?')->execute([$cardId]);
        $pdo->prepare('DELETE FROM quest_task_registry WHERE quest_card_id=?')->execute([$cardId]);
        $pdo->prepare('DELETE FROM quest_tasks WHERE quest_card_id=?')->execute([$cardId]);
        $pdo->prepare('DELETE FROM quest_cards WHERE id=?')->execute([$cardId]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
    respond(['ok' => true]);
}

respond(['ok' => false, 'error' => 'Unknown action'], 404);
