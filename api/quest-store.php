<?php

function quest_management_schema_ready(PDO $pdo): bool {
    $query = $pdo->query(
        "SELECT COUNT(*)
         FROM information_schema.tables
         WHERE table_schema=DATABASE()
           AND table_name IN ('quests','quest_card_slots','quest_task_registry')"
    );
    if ((int)$query->fetchColumn() !== 3) return false;

    $unmigrated = $pdo->query(
        'SELECT COUNT(*)
         FROM quest_tasks qt
         LEFT JOIN quest_task_registry qtr ON qtr.quest_task_id=qt.id
         WHERE qtr.quest_task_id IS NULL'
    );
    return (int)$unmigrated->fetchColumn() === 0;
}

function ensure_quest_management_schema(PDO $pdo): void {
    $schemaQuery = $pdo->query(
        "SELECT COUNT(*)
         FROM information_schema.tables
         WHERE table_schema=DATABASE()
           AND table_name IN ('quests','quest_card_slots','quest_task_registry')"
    );
    if ((int)$schemaQuery->fetchColumn() < 3) {
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS quests (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                title VARCHAR(500) NOT NULL,
                description TEXT NOT NULL,
                difficulty TINYINT UNSIGNED NOT NULL,
                active TINYINT(1) NOT NULL DEFAULT 1,
                star_value INT UNSIGNED NOT NULL DEFAULT 10,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY quests_active_difficulty (active,difficulty)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS quest_card_slots (
                quest_card_id BIGINT UNSIGNED NOT NULL,
                slot_number TINYINT UNSIGNED NOT NULL,
                quest_id BIGINT UNSIGNED NOT NULL,
                quest_task_id BIGINT UNSIGNED NOT NULL,
                PRIMARY KEY (quest_card_id,slot_number),
                UNIQUE KEY quest_card_slots_task (quest_task_id),
                KEY quest_card_slots_quest (quest_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS quest_task_registry (
                quest_task_id BIGINT UNSIGNED NOT NULL,
                quest_card_id BIGINT UNSIGNED NOT NULL,
                quest_id BIGINT UNSIGNED NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (quest_task_id),
                KEY quest_task_registry_card (quest_card_id),
                KEY quest_task_registry_quest (quest_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
    }
    $pdo->exec(
        'INSERT IGNORE INTO quest_task_registry(quest_task_id,quest_card_id,quest_id)
         SELECT quest_task_id,quest_card_id,quest_id FROM quest_card_slots'
    );

    $legacyTasks = $pdo->query(
        'SELECT qt.id,qt.quest_card_id,qt.task_text,qt.difficulty,qt.points
         FROM quest_tasks qt
         LEFT JOIN quest_task_registry qtr ON qtr.quest_task_id=qt.id
         WHERE qtr.quest_task_id IS NULL
         ORDER BY qt.quest_card_id,qt.difficulty,qt.id'
    )->fetchAll();
    if (!$legacyTasks) return;

    $usedSlots = [];
    foreach ($pdo->query('SELECT quest_card_id,slot_number FROM quest_card_slots')->fetchAll() as $slot) {
        $usedSlots[(int)$slot['quest_card_id']][(int)$slot['slot_number']] = true;
    }

    $insertQuest = $pdo->prepare(
        'INSERT INTO quests(title,description,difficulty,active,star_value) VALUES(?,?,?,?,?)'
    );
    $insertSlot = $pdo->prepare(
        'INSERT INTO quest_card_slots(quest_card_id,slot_number,quest_id,quest_task_id) VALUES(?,?,?,?)'
    );
    $insertRegistry = $pdo->prepare(
        'INSERT INTO quest_task_registry(quest_task_id,quest_card_id,quest_id) VALUES(?,?,?)'
    );

    try {
        $pdo->beginTransaction();
        foreach ($legacyTasks as $task) {
            $cardId = (int)$task['quest_card_id'];
            $slotNumber = (int)$task['difficulty'];
            if ($slotNumber < 1 || isset($usedSlots[$cardId][$slotNumber])) {
                $slotNumber = 1;
                while (isset($usedSlots[$cardId][$slotNumber])) $slotNumber++;
            }

            $difficulty = min(3, max(1, (int)$task['difficulty']));
            $insertQuest->execute([
                (string)$task['task_text'],
                '',
                $difficulty,
                1,
                max(0, (int)$task['points']),
            ]);
            $questId = (int)$pdo->lastInsertId();
            $insertSlot->execute([$cardId, $slotNumber, $questId, (int)$task['id']]);
            $insertRegistry->execute([(int)$task['id'], $cardId, $questId]);
            $usedSlots[$cardId][$slotNumber] = true;
        }
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
}

function quest_management_quest(PDO $pdo, int $questId): array {
    $query = $pdo->prepare('SELECT * FROM quests WHERE id=?');
    $query->execute([$questId]);
    $quest = $query->fetch();
    if (!$quest) respond(['ok' => false, 'error' => 'Quest not found.'], 404);
    return $quest;
}

function quest_management_card(PDO $pdo, int $cardId): array {
    $query = $pdo->prepare('SELECT * FROM quest_cards WHERE id=?');
    $query->execute([$cardId]);
    $card = $query->fetch();
    if (!$card) respond(['ok' => false, 'error' => 'Quest card not found.'], 404);
    return $card;
}

function quest_management_quests(PDO $pdo): array {
    return $pdo->query(
        'SELECT q.*,COUNT(qcs.quest_card_id) card_count
         FROM quests q
         LEFT JOIN quest_card_slots qcs ON qcs.quest_id=q.id
         GROUP BY q.id
         ORDER BY q.difficulty,q.title,q.id'
    )->fetchAll();
}

function quest_management_cards(PDO $pdo): array {
    $cards = $pdo->query(
        'SELECT qc.*,COUNT(qcs.slot_number) slot_count
         FROM quest_cards qc
         LEFT JOIN quest_card_slots qcs ON qcs.quest_card_id=qc.id
         GROUP BY qc.id
         ORDER BY qc.id DESC'
    )->fetchAll();
    $byId = [];
    foreach ($cards as $index => &$card) {
        $card['slots'] = [];
        $byId[(int)$card['id']] = $index;
    }
    unset($card);

    $slots = $pdo->query(
        'SELECT qcs.quest_card_id,qcs.slot_number,qcs.quest_id,qcs.quest_task_id,
                q.title quest_title,q.difficulty,q.active quest_active,q.star_value
         FROM quest_card_slots qcs
         JOIN quests q ON q.id=qcs.quest_id
         ORDER BY qcs.quest_card_id,qcs.slot_number'
    )->fetchAll();
    foreach ($slots as $slot) {
        $cardId = (int)$slot['quest_card_id'];
        if (isset($byId[$cardId])) $cards[$byId[$cardId]]['slots'][] = $slot;
    }
    return $cards;
}

function quest_management_insert_compatibility_task(PDO $pdo, int $cardId, array $quest): int {
    $query = $pdo->prepare(
        'INSERT INTO quest_tasks(quest_card_id,difficulty,task_text,points) VALUES(?,?,?,?)'
    );
    $query->execute([
        $cardId,
        (int)$quest['difficulty'],
        (string)$quest['title'],
        (int)$quest['star_value'],
    ]);
    $taskId = (int)$pdo->lastInsertId();
    $registry = $pdo->prepare(
        'INSERT INTO quest_task_registry(quest_task_id,quest_card_id,quest_id) VALUES(?,?,?)'
    );
    $registry->execute([$taskId, $cardId, (int)$quest['id']]);
    return $taskId;
}

function quest_management_sync_compatibility_task(PDO $pdo, int $taskId, array $quest): void {
    $query = $pdo->prepare('UPDATE quest_tasks SET difficulty=?,task_text=?,points=? WHERE id=?');
    $query->execute([
        (int)$quest['difficulty'],
        (string)$quest['title'],
        (int)$quest['star_value'],
        $taskId,
    ]);
}
