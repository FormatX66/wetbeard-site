<?php
require __DIR__ . '/bootstrap.php';

$pdo = db();
$action = (string)($_GET['action'] ?? 'state');
$data = body();
$token = device_token();
$rider = rider($pdo, $token);
$riderId = (int)$rider['id'];

if ($action === 'health') respond(['ok' => true, 'php' => PHP_VERSION, 'time' => date(DATE_ATOM)]);

if ($action === 'state') {
    $rides = $pdo->query("SELECT r.*, (SELECT COUNT(*) FROM reservations x WHERE x.ride_id=r.id) reserved_count FROM rides r WHERE r.ends_at >= NOW() ORDER BY r.starts_at ASC LIMIT 12")->fetchAll();
    $liveRide = $pdo->query("SELECT * FROM rides WHERE starts_at<=NOW() AND ends_at>=NOW() AND status<>'cancelled' ORDER BY starts_at LIMIT 1")->fetch() ?: null;
    $leaderboard = $pdo->query("SELECT display_name,points FROM riders WHERE display_name<>'New Pirate' ORDER BY points DESC, updated_at ASC LIMIT 20")->fetchAll();
    $recent = $pdo->query("SELECT c.id,c.completed_at,c.points_awarded,qt.task_text,r.display_name FROM completions c JOIN quest_tasks qt ON qt.id=c.quest_task_id JOIN riders r ON r.id=c.rider_id ORDER BY c.completed_at DESC LIMIT 12")->fetchAll();
    $messages = $pdo->query("SELECT m.id,m.message,m.created_at,r.display_name FROM messages m JOIN riders r ON r.id=m.rider_id ORDER BY m.created_at DESC LIMIT 30")->fetchAll();

    $query = $pdo->prepare("SELECT qc.id card_id,qc.title,qt.id task_id,qt.task_text,qt.points FROM rider_current_quests rcq JOIN quest_cards qc ON qc.id=rcq.quest_card_id JOIN quest_tasks qt ON qt.quest_card_id=qc.id WHERE rcq.rider_id=? ORDER BY qt.difficulty,qt.id");
    $query->execute([$riderId]);
    $currentQuest = $query->fetchAll();

    $query = $pdo->prepare('SELECT ride_id FROM reservations WHERE rider_id=?');
    $query->execute([$riderId]);
    $reservedRideIds = array_map('intval', array_column($query->fetchAll(), 'ride_id'));

    $query = $pdo->prepare('SELECT quest_task_id FROM completions WHERE rider_id=?');
    $query->execute([$riderId]);
    $completedTaskIds = array_map('intval', array_column($query->fetchAll(), 'quest_task_id'));

    $query = $pdo->prepare(
        "SELECT qc.id card_id,qc.title,MAX(c.completed_at) completed_at,COUNT(qt.id) task_count,COUNT(c.id) completed_tasks,SUM(qt.points) total_points
         FROM quest_cards qc
         JOIN quest_tasks qt ON qt.quest_card_id=qc.id
         LEFT JOIN completions c ON c.quest_task_id=qt.id AND c.rider_id=?
         GROUP BY qc.id,qc.title
         HAVING completed_tasks=task_count AND task_count>0
         ORDER BY completed_at DESC
         LIMIT 120"
    );
    $query->execute([$riderId]);
    $collection = $query->fetchAll();
    $collectionIds = array_map('intval', array_column($collection, 'card_id'));
    $tasksByCard = [];
    if ($collectionIds) {
        $placeholders = implode(',', array_fill(0, count($collectionIds), '?'));
        $query = $pdo->prepare("SELECT quest_card_id,task_text,points FROM quest_tasks WHERE quest_card_id IN ($placeholders) ORDER BY quest_card_id,difficulty,id");
        $query->execute($collectionIds);
        foreach ($query->fetchAll() as $task) {
            $tasksByCard[(int)$task['quest_card_id']][] = [
                'text' => $task['task_text'],
                'points' => (int)$task['points'],
            ];
        }
    }
    foreach ($collection as &$card) {
        $cardId = (int)$card['card_id'];
        $card['card_id'] = $cardId;
        $card['total_points'] = (int)$card['total_points'];
        $card['tasks'] = $tasksByCard[$cardId] ?? [];
    }
    unset($card);

    respond([
        'ok' => true,
        'rider' => $rider,
        'rides' => $rides,
        'live_ride' => $liveRide,
        'leaderboard' => $leaderboard,
        'recent' => $recent,
        'messages' => array_reverse($messages),
        'current_quest' => $currentQuest,
        'reserved_ride_ids' => $reservedRideIds,
        'completed_task_ids' => $completedTaskIds,
        'collection' => $collection,
    ]);
}

if ($action === 'set_name') {
    require_fields($data, ['display_name']);
    $name = trim((string)$data['display_name']);
    if (mb_strlen($name) < 2 || mb_strlen($name) > 32) respond(['ok' => false, 'error' => 'Name must be 2–32 characters'], 422);
    if ((int)$rider['name_locked'] === 1) respond(['ok' => false, 'error' => 'Name is locked after your first reservation'], 409);
    $query = $pdo->prepare('UPDATE riders SET display_name=? WHERE id=?');
    $query->execute([$name, $riderId]);
    respond(['ok' => true, 'display_name' => $name]);
}

if ($action === 'reserve') {
    require_fields($data, ['ride_id']);
    $rideId = (int)$data['ride_id'];
    $query = $pdo->prepare("SELECT id FROM rides WHERE id=? AND starts_at>NOW() AND status<>'cancelled'");
    $query->execute([$rideId]);
    if (!$query->fetch()) respond(['ok' => false, 'error' => 'Ride is unavailable'], 409);
    $query = $pdo->prepare('INSERT IGNORE INTO reservations(ride_id,rider_id) VALUES(?,?)');
    $query->execute([$rideId, $riderId]);
    $pdo->prepare('UPDATE riders SET name_locked=1 WHERE id=?')->execute([$riderId]);
    respond(['ok' => true]);
}

if ($action === 'unreserve') {
    require_fields($data, ['ride_id']);
    $pdo->prepare('DELETE FROM reservations WHERE ride_id=? AND rider_id=?')->execute([(int)$data['ride_id'], $riderId]);
    respond(['ok' => true]);
}

if ($action === 'draw_quest') {
    $card = $pdo->query('SELECT id FROM quest_cards WHERE active=1 ORDER BY RAND() LIMIT 1')->fetch();
    if (!$card) respond(['ok' => false, 'error' => 'No active quest cards'], 409);
    $query = $pdo->prepare('INSERT INTO rider_current_quests(rider_id,quest_card_id) VALUES(?,?) ON DUPLICATE KEY UPDATE quest_card_id=VALUES(quest_card_id),assigned_at=CURRENT_TIMESTAMP');
    $query->execute([$riderId, (int)$card['id']]);
    respond(['ok' => true, 'quest_card_id' => (int)$card['id']]);
}

if ($action === 'complete_task') {
    require_fields($data, ['task_id']);
    $taskId = (int)$data['task_id'];
    $query = $pdo->prepare('SELECT points FROM quest_tasks WHERE id=?');
    $query->execute([$taskId]);
    $task = $query->fetch();
    if (!$task) respond(['ok' => false, 'error' => 'Quest task not found'], 404);
    try {
        $pdo->beginTransaction();
        $query = $pdo->prepare('INSERT INTO completions(rider_id,quest_task_id,points_awarded) VALUES(?,?,?)');
        $query->execute([$riderId, $taskId, (int)$task['points']]);
        $pdo->prepare('UPDATE riders SET points=points+? WHERE id=?')->execute([(int)$task['points'], $riderId]);
        $pdo->commit();
    } catch (PDOException $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if ($error->getCode() === '23000') respond(['ok' => false, 'error' => 'Task already completed'], 409);
        throw $error;
    }
    respond(['ok' => true, 'points_awarded' => (int)$task['points']]);
}

if ($action === 'message') {
    require_fields($data, ['message']);
    $message = trim((string)$data['message']);
    if (mb_strlen($message) > 180) respond(['ok' => false, 'error' => 'Message is too long'], 422);
    $pdo->prepare('INSERT INTO messages(rider_id,message) VALUES(?,?)')->execute([$riderId, $message]);
    respond(['ok' => true]);
}

if ($action === 'kudos') {
    require_fields($data, ['completion_id']);
    try {
        $pdo->prepare('INSERT INTO kudos(completion_id,giver_rider_id) VALUES(?,?)')->execute([(int)$data['completion_id'], $riderId]);
    } catch (PDOException $error) {
        if ($error->getCode() === '23000') respond(['ok' => false, 'error' => 'Already gave kudos'], 409);
        throw $error;
    }
    respond(['ok' => true]);
}

respond(['ok' => false, 'error' => 'Unknown action'], 404);
