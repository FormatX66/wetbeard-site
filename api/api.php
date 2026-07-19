<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/quest-store.php';

$action = (string)($_GET['action'] ?? 'state');

if ($action === 'health') {
    db();
    respond(['ok' => true, 'php' => PHP_VERSION, 'time' => date(DATE_ATOM)]);
}

$pdo = db();
$data = body();
$token = device_token();
$rider = rider($pdo, $token);
$riderId = (int)$rider['id'];
$questSchemaReady = quest_management_schema_ready($pdo);

function ensure_star_schema(PDO $pdo): void {
    $pdo->exec("CREATE TABLE IF NOT EXISTS star_transfers (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        sender_rider_id INT NOT NULL,
        recipient_rider_id INT NOT NULL,
        amount INT UNSIGNED NOT NULL,
        reason VARCHAR(180) NOT NULL DEFAULT '',
        completion_id INT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_star_sender_day (sender_rider_id,created_at),
        INDEX idx_star_recipient (recipient_rider_id,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS card_holdings (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        quest_card_id INT NOT NULL,
        owner_rider_id INT NOT NULL,
        acquired_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        acquisition_type VARCHAR(20) NOT NULL DEFAULT 'quest',
        UNIQUE KEY uq_owner_card (owner_rider_id,quest_card_id),
        INDEX idx_holding_owner (owner_rider_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS card_listings (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        holding_id BIGINT UNSIGNED NOT NULL,
        seller_rider_id INT NOT NULL,
        price INT UNSIGNED NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        buyer_rider_id INT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        UNIQUE KEY uq_active_holding (holding_id,status),
        INDEX idx_listing_status (status,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS site_settings (setting_key VARCHAR(80) PRIMARY KEY,setting_value TEXT NOT NULL,updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

ensure_star_schema($pdo);
$dailyStarLimit = (int)($pdo->query("SELECT setting_value FROM site_settings WHERE setting_key='daily_star_limit'")->fetchColumn() ?: 100);
$dailyStarLimit = max(1, min(1000, $dailyStarLimit));
$tradingEnabled = ($pdo->query("SELECT setting_value FROM site_settings WHERE setting_key='trading_enabled'")->fetchColumn() ?: '1') !== '0';

if ($action === 'state') {
    $rides = $pdo->query("SELECT r.*, (SELECT COUNT(*) FROM reservations x WHERE x.ride_id=r.id) reserved_count FROM rides r WHERE r.ends_at >= NOW() ORDER BY r.starts_at ASC LIMIT 12")->fetchAll();
    $liveRide = $pdo->query("SELECT * FROM rides WHERE starts_at<=NOW() AND ends_at>=NOW() AND status<>'cancelled' ORDER BY starts_at LIMIT 1")->fetch() ?: null;
    $leaderboard = $pdo->query("SELECT display_name,points FROM riders WHERE display_name<>'New Pirate' ORDER BY points DESC, updated_at ASC LIMIT 20")->fetchAll();
    $recent = $pdo->query("SELECT c.id,c.rider_id recipient_rider_id,c.completed_at,c.points_awarded,qt.task_text,r.display_name FROM completions c JOIN quest_tasks qt ON qt.id=c.quest_task_id JOIN riders r ON r.id=c.rider_id ORDER BY c.completed_at DESC LIMIT 12")->fetchAll();
    $messages = $pdo->query("SELECT m.id,m.rider_id,m.message,m.created_at,r.display_name FROM messages m JOIN riders r ON r.id=m.rider_id ORDER BY m.created_at DESC LIMIT 30")->fetchAll();
    $starSentTodayQuery = $pdo->prepare('SELECT COALESCE(SUM(amount),0) FROM star_transfers WHERE sender_rider_id=? AND created_at>=CURRENT_DATE');
    $starSentTodayQuery->execute([$riderId]);
    $starSentToday = (int)$starSentTodayQuery->fetchColumn();
    $starHistoryQuery = $pdo->prepare('SELECT st.amount,st.reason,st.created_at,r.display_name recipient_name FROM star_transfers st JOIN riders r ON r.id=st.recipient_rider_id WHERE st.sender_rider_id=? ORDER BY st.created_at DESC LIMIT 20');
    $starHistoryQuery->execute([$riderId]);

    $query = $questSchemaReady
        ? $pdo->prepare(
            "SELECT qc.id card_id,qc.title,qcs.quest_task_id task_id,q.title task_text,q.star_value points
             FROM rider_current_quests rcq
             JOIN quest_cards qc ON qc.id=rcq.quest_card_id
             JOIN quest_card_slots qcs ON qcs.quest_card_id=qc.id
             JOIN quests q ON q.id=qcs.quest_id
             WHERE rcq.rider_id=?
             ORDER BY qcs.slot_number"
        )
        : $pdo->prepare("SELECT qc.id card_id,qc.title,qt.id task_id,qt.task_text,qt.points FROM rider_current_quests rcq JOIN quest_cards qc ON qc.id=rcq.quest_card_id JOIN quest_tasks qt ON qt.quest_card_id=qc.id WHERE rcq.rider_id=? ORDER BY qt.difficulty,qt.id");
    $query->execute([$riderId]);
    $currentQuest = $query->fetchAll();

    $query = $pdo->prepare('SELECT ride_id FROM reservations WHERE rider_id=?');
    $query->execute([$riderId]);
    $reservedRideIds = array_map('intval', array_column($query->fetchAll(), 'ride_id'));

    $query = $pdo->prepare('SELECT quest_task_id FROM completions WHERE rider_id=?');
    $query->execute([$riderId]);
    $completedTaskIds = array_map('intval', array_column($query->fetchAll(), 'quest_task_id'));

    $query = $questSchemaReady
        ? $pdo->prepare(
            "SELECT qc.id card_id,qc.title,MAX(c.completed_at) completed_at,COUNT(qcs.quest_task_id) task_count,COUNT(c.id) completed_tasks,SUM(q.star_value) total_points
             FROM quest_cards qc
             JOIN quest_card_slots qcs ON qcs.quest_card_id=qc.id
             JOIN quests q ON q.id=qcs.quest_id
             LEFT JOIN completions c ON c.quest_task_id=qcs.quest_task_id AND c.rider_id=?
             GROUP BY qc.id,qc.title
             HAVING completed_tasks=task_count AND task_count>0
             ORDER BY completed_at DESC
             LIMIT 120"
        )
        : $pdo->prepare(
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
        $query = $questSchemaReady
            ? $pdo->prepare(
                "SELECT qcs.quest_card_id,q.title task_text,q.star_value points
                 FROM quest_card_slots qcs
                 JOIN quests q ON q.id=qcs.quest_id
                 WHERE qcs.quest_card_id IN ($placeholders)
                 ORDER BY qcs.quest_card_id,qcs.slot_number"
            )
            : $pdo->prepare("SELECT quest_card_id,task_text,points FROM quest_tasks WHERE quest_card_id IN ($placeholders) ORDER BY quest_card_id,difficulty,id");
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
    foreach ($collection as $card) {
        $pdo->prepare("INSERT IGNORE INTO card_holdings(quest_card_id,owner_rider_id,acquisition_type) VALUES(?,?,'quest')")->execute([(int)$card['card_id'], $riderId]);
    }
    $inventoryQuery = $pdo->prepare("SELECT h.id holding_id,h.quest_card_id card_id,qc.title,l.id listing_id,l.price FROM card_holdings h JOIN quest_cards qc ON qc.id=h.quest_card_id LEFT JOIN card_listings l ON l.holding_id=h.id AND l.status='active' WHERE h.owner_rider_id=? ORDER BY h.acquired_at DESC");
    $inventoryQuery->execute([$riderId]);
    $market = $pdo->query("SELECT l.id listing_id,l.price,h.quest_card_id card_id,qc.title,r.display_name seller_name,l.seller_rider_id FROM card_listings l JOIN card_holdings h ON h.id=l.holding_id JOIN quest_cards qc ON qc.id=h.quest_card_id JOIN riders r ON r.id=l.seller_rider_id WHERE l.status='active' ORDER BY l.created_at DESC LIMIT 100")->fetchAll();

    respond([
        'ok' => true,
        'rider' => $rider,
        'rides' => $rides,
        'live_ride' => $liveRide,
        'leaderboard' => $leaderboard,
        'recent' => $recent,
        'messages' => $messages,
        'current_quest' => $currentQuest,
        'reserved_ride_ids' => $reservedRideIds,
        'completed_task_ids' => $completedTaskIds,
        'collection' => $collection,
        'star_sending' => [
            'daily_limit' => $dailyStarLimit,
            'sent_today' => $starSentToday,
            'remaining_today' => max(0, $dailyStarLimit - $starSentToday),
            'resets_at' => date('Y-m-d 00:00:00', strtotime('tomorrow')),
            'history' => $starHistoryQuery->fetchAll(),
        ],
        'card_inventory' => $inventoryQuery->fetchAll(),
        'card_market' => $market,
        'trading_enabled' => $tradingEnabled,
    ]);
}

if ($action === 'list_card') {
    if (!$tradingEnabled) respond(['ok'=>false,'error'=>'Quest card trading is currently disabled.'],409);
    require_fields($data, ['holding_id','price']);
    $holdingId=(int)$data['holding_id']; $price=filter_var($data['price'],FILTER_VALIDATE_INT);
    if($price===false||$price<1||$price>1000000) respond(['ok'=>false,'error'=>'Choose a price from 1 to 1,000,000 Gold Nautical Stars.'],422);
    $q=$pdo->prepare('SELECT id FROM card_holdings WHERE id=? AND owner_rider_id=?');$q->execute([$holdingId,$riderId]);
    if(!$q->fetch()) respond(['ok'=>false,'error'=>'Card not found in your collection.'],404);
    $pdo->prepare("INSERT INTO card_listings(holding_id,seller_rider_id,price,status) VALUES(?,?,?,'active')")->execute([$holdingId,$riderId,$price]);
    respond(['ok'=>true]);
}

if ($action === 'cancel_listing') {
    $pdo->prepare("UPDATE card_listings SET status='cancelled',completed_at=NOW() WHERE id=? AND seller_rider_id=? AND status='active'")->execute([(int)($data['listing_id']??0),$riderId]);
    respond(['ok'=>true]);
}

if ($action === 'buy_card') {
    if (!$tradingEnabled) respond(['ok'=>false,'error'=>'Quest card trading is currently disabled.'],409);
    require_fields($data,['listing_id']);
    try {
        $pdo->beginTransaction();
        $q=$pdo->prepare("SELECT l.*,h.quest_card_id FROM card_listings l JOIN card_holdings h ON h.id=l.holding_id WHERE l.id=? AND l.status='active' FOR UPDATE");$q->execute([(int)$data['listing_id']]);$listing=$q->fetch();
        if(!$listing) throw new RuntimeException('This card is no longer available.');
        if((int)$listing['seller_rider_id']===$riderId) throw new RuntimeException('You already own this card.');
        $balanceQ=$pdo->prepare('SELECT points FROM riders WHERE id=? FOR UPDATE');$balanceQ->execute([$riderId]);$balance=(int)$balanceQ->fetchColumn();
        if($balance<(int)$listing['price']) throw new RuntimeException('You do not have enough Gold Nautical Stars.');
        $ownedQ=$pdo->prepare('SELECT id FROM card_holdings WHERE owner_rider_id=? AND quest_card_id=?');$ownedQ->execute([$riderId,(int)$listing['quest_card_id']]);
        if($ownedQ->fetch()) throw new RuntimeException('You already have this quest card.');
        $pdo->prepare('UPDATE riders SET points=points-? WHERE id=?')->execute([(int)$listing['price'],$riderId]);
        $pdo->prepare('UPDATE riders SET points=points+? WHERE id=?')->execute([(int)$listing['price'],(int)$listing['seller_rider_id']]);
        $pdo->prepare("UPDATE card_holdings SET owner_rider_id=?,acquisition_type='trade',acquired_at=NOW() WHERE id=?")->execute([$riderId,(int)$listing['holding_id']]);
        $pdo->prepare("UPDATE card_listings SET status='sold',buyer_rider_id=?,completed_at=NOW() WHERE id=?")->execute([$riderId,(int)$listing['id']]);
        $pdo->commit(); respond(['ok'=>true]);
    } catch(RuntimeException $error){if($pdo->inTransaction())$pdo->rollBack();respond(['ok'=>false,'error'=>$error->getMessage()],409);} catch(Throwable $error){if($pdo->inTransaction())$pdo->rollBack();throw $error;}
}

if ($action === 'send_stars') {
    require_fields($data, ['recipient_rider_id', 'amount']);
    $recipientId = (int)$data['recipient_rider_id'];
    $amount = filter_var($data['amount'], FILTER_VALIDATE_INT);
    $reason = trim((string)($data['reason'] ?? ''));
    $completionId = !empty($data['completion_id']) ? (int)$data['completion_id'] : null;
    if ($recipientId < 1 || $recipientId === $riderId) respond(['ok' => false, 'error' => 'Choose another rider.'], 422);
    if ($amount === false || $amount < 1 || $amount > $dailyStarLimit) respond(['ok' => false, 'error' => "Send between 1 and {$dailyStarLimit} Gold Nautical Stars."], 422);
    if (mb_strlen($reason) > 180) respond(['ok' => false, 'error' => 'Reason is too long.'], 422);
    try {
        $pdo->beginTransaction();
        $senderQuery = $pdo->prepare('SELECT points FROM riders WHERE id=? FOR UPDATE');
        $senderQuery->execute([$riderId]);
        $senderBalance = (int)$senderQuery->fetchColumn();
        $recipientQuery = $pdo->prepare('SELECT id FROM riders WHERE id=? FOR UPDATE');
        $recipientQuery->execute([$recipientId]);
        if (!$recipientQuery->fetchColumn()) throw new RuntimeException('Recipient not found.');
        $sentQuery = $pdo->prepare('SELECT COALESCE(SUM(amount),0) FROM star_transfers WHERE sender_rider_id=? AND created_at>=CURRENT_DATE');
        $sentQuery->execute([$riderId]);
        $sentToday = (int)$sentQuery->fetchColumn();
        if ($sentToday + $amount > $dailyStarLimit) throw new RuntimeException("That exceeds your {$dailyStarLimit}-star daily sending limit.");
        if ($senderBalance < $amount) throw new RuntimeException('You do not have enough Gold Nautical Stars.');
        $pdo->prepare('UPDATE riders SET points=points-? WHERE id=?')->execute([$amount, $riderId]);
        $pdo->prepare('UPDATE riders SET points=points+? WHERE id=?')->execute([$amount, $recipientId]);
        $pdo->prepare('INSERT INTO star_transfers(sender_rider_id,recipient_rider_id,amount,reason,completion_id) VALUES(?,?,?,?,?)')->execute([$riderId, $recipientId, $amount, $reason, $completionId]);
        $pdo->commit();
        respond(['ok' => true, 'remaining_today' => $dailyStarLimit - $sentToday - $amount]);
    } catch (RuntimeException $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        respond(['ok' => false, 'error' => $error->getMessage()], 409);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
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
    $card = $questSchemaReady
        ? $pdo->query(
            'SELECT qc.id
             FROM quest_cards qc
             JOIN quest_card_slots qcs ON qcs.quest_card_id=qc.id
             JOIN quests q ON q.id=qcs.quest_id
             WHERE qc.active=1
             GROUP BY qc.id
             HAVING COUNT(qcs.slot_number)=3 AND SUM(q.active=1)=3
             ORDER BY RAND()
             LIMIT 1'
        )->fetch()
        : $pdo->query('SELECT id FROM quest_cards WHERE active=1 ORDER BY RAND() LIMIT 1')->fetch();
    if (!$card) respond(['ok' => false, 'error' => 'No active quest cards'], 409);
    $query = $pdo->prepare('INSERT INTO rider_current_quests(rider_id,quest_card_id) VALUES(?,?) ON DUPLICATE KEY UPDATE quest_card_id=VALUES(quest_card_id),assigned_at=CURRENT_TIMESTAMP');
    $query->execute([$riderId, (int)$card['id']]);
    respond(['ok' => true, 'quest_card_id' => (int)$card['id']]);
}

if ($action === 'complete_task') {
    require_fields($data, ['task_id']);
    $taskId = (int)$data['task_id'];
    $query = $questSchemaReady
        ? $pdo->prepare('SELECT q.star_value points FROM quest_card_slots qcs JOIN quests q ON q.id=qcs.quest_id WHERE qcs.quest_task_id=?')
        : $pdo->prepare('SELECT points FROM quest_tasks WHERE id=?');
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

respond(['ok' => false, 'error' => 'Unknown action'], 404);
