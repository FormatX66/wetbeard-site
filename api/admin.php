<?php
require __DIR__ . '/bootstrap.php';

$pdo = db();
$data = body();
if (!admin_ok($data)) respond(['ok' => false, 'error' => 'Invalid admin password'], 401);
$action = (string)($_GET['action'] ?? 'dashboard');

function requested_rider_id(array $data): int {
    $riderId = (int)($data['rider_id'] ?? 0);
    if ($riderId < 1) respond(['ok' => false, 'error' => 'Choose a valid rider.'], 422);
    return $riderId;
}

function require_rider(PDO $pdo, int $riderId): array {
    $query = $pdo->prepare('SELECT * FROM riders WHERE id=?');
    $query->execute([$riderId]);
    $rider = $query->fetch();
    if (!$rider) respond(['ok' => false, 'error' => 'Rider not found.'], 404);
    return $rider;
}

function ensure_advanced_schema(PDO $pdo): void {
    $pdo->exec("CREATE TABLE IF NOT EXISTS site_settings (setting_key VARCHAR(80) PRIMARY KEY, setting_value TEXT NOT NULL, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS star_transfers (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,sender_rider_id INT NOT NULL,recipient_rider_id INT NOT NULL,amount INT UNSIGNED NOT NULL,reason VARCHAR(180) NOT NULL DEFAULT '',completion_id INT NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,INDEX idx_star_sender_day (sender_rider_id,created_at),INDEX idx_star_recipient (recipient_rider_id,created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

ensure_advanced_schema($pdo);

if ($action === 'advanced') {
    $settings = [];
    foreach ($pdo->query('SELECT setting_key,setting_value FROM site_settings')->fetchAll() as $row) $settings[$row['setting_key']] = $row['setting_value'];
    $transfers = $pdo->query('SELECT st.id,st.amount,st.reason,st.created_at,s.display_name sender_name,r.display_name recipient_name FROM star_transfers st JOIN riders s ON s.id=st.sender_rider_id JOIN riders r ON r.id=st.recipient_rider_id ORDER BY st.created_at DESC LIMIT 250')->fetchAll();
    $economy = [
        'stars_in_circulation' => (int)$pdo->query('SELECT COALESCE(SUM(points),0) FROM riders')->fetchColumn(),
        'stars_sent_today' => (int)$pdo->query('SELECT COALESCE(SUM(amount),0) FROM star_transfers WHERE created_at>=CURRENT_DATE')->fetchColumn(),
        'transfers' => (int)$pdo->query('SELECT COUNT(*) FROM star_transfers')->fetchColumn(),
    ];
    respond(['ok' => true, 'settings' => $settings, 'transfers' => $transfers, 'economy' => $economy]);
}

if ($action === 'save_settings') {
    $allowed = ['site_announcement','maintenance_mode','trading_enabled','daily_star_limit','timezone'];
    $query = $pdo->prepare('INSERT INTO site_settings(setting_key,setting_value) VALUES(?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)');
    foreach ($allowed as $key) {
        if (array_key_exists($key, $data)) $query->execute([$key, trim((string)$data[$key])]);
    }
    respond(['ok' => true]);
}

if ($action === 'dashboard') {
    $rides = $pdo->query('SELECT * FROM rides ORDER BY starts_at DESC LIMIT 50')->fetchAll();
    $cards = $pdo->query('SELECT qc.*,COUNT(qt.id) task_count FROM quest_cards qc LEFT JOIN quest_tasks qt ON qt.quest_card_id=qc.id GROUP BY qc.id ORDER BY qc.id DESC LIMIT 200')->fetchAll();
    $stats = [
        'riders' => (int)$pdo->query('SELECT COUNT(*) FROM riders')->fetchColumn(),
        'completions' => (int)$pdo->query('SELECT COUNT(*) FROM completions')->fetchColumn(),
        'messages' => (int)$pdo->query('SELECT COUNT(*) FROM messages')->fetchColumn(),
    ];
    respond(['ok' => true, 'rides' => $rides, 'cards' => $cards, 'stats' => $stats]);
}

if ($action === 'riders') {
    $riders = $pdo->query(
        "SELECT r.id,r.display_name,r.points,r.name_locked,r.created_at,r.updated_at,
            (SELECT COUNT(*) FROM completions c WHERE c.rider_id=r.id) completion_count,
            (SELECT COUNT(*) FROM reservations x WHERE x.rider_id=r.id) reservation_count,
            (SELECT COUNT(*) FROM messages m WHERE m.rider_id=r.id) message_count,
            (SELECT qc.title FROM rider_current_quests rcq JOIN quest_cards qc ON qc.id=rcq.quest_card_id WHERE rcq.rider_id=r.id LIMIT 1) current_quest
         FROM riders r
         ORDER BY r.updated_at DESC,r.id DESC
         LIMIT 500"
    )->fetchAll();
    $stats = [
        'riders' => (int)$pdo->query('SELECT COUNT(*) FROM riders')->fetchColumn(),
        'points' => (int)$pdo->query('SELECT COALESCE(SUM(points),0) FROM riders')->fetchColumn(),
        'completions' => (int)$pdo->query('SELECT COUNT(*) FROM completions')->fetchColumn(),
    ];
    respond(['ok' => true, 'riders' => $riders, 'stats' => $stats]);
}

if ($action === 'save_ride') {
    require_fields($data, ['title', 'starts_at', 'ends_at']);
    if (!empty($data['id'])) {
        $pdo->prepare('UPDATE rides SET title=?,description=?,location=?,starts_at=?,ends_at=?,status=? WHERE id=?')->execute([
            $data['title'], $data['description'] ?? '', $data['location'] ?? '', $data['starts_at'], $data['ends_at'], $data['status'] ?? 'scheduled', (int)$data['id']
        ]);
    } else {
        $pdo->prepare('INSERT INTO rides(title,description,location,starts_at,ends_at,status) VALUES(?,?,?,?,?,?)')->execute([
            $data['title'], $data['description'] ?? '', $data['location'] ?? '', $data['starts_at'], $data['ends_at'], $data['status'] ?? 'scheduled'
        ]);
    }
    respond(['ok' => true]);
}

if ($action === 'delete_ride') {
    $pdo->prepare('DELETE FROM rides WHERE id=?')->execute([(int)($data['id'] ?? 0)]);
    respond(['ok' => true]);
}

if ($action === 'clear_finished_rides') {
    $query = $pdo->prepare('DELETE FROM rides WHERE ends_at < NOW()');
    $query->execute();
    respond(['ok' => true, 'deleted' => $query->rowCount()]);
}

if ($action === 'toggle_card') {
    $pdo->prepare('UPDATE quest_cards SET active=IF(active=1,0,1) WHERE id=?')->execute([(int)($data['id'] ?? 0)]);
    respond(['ok' => true]);
}

if ($action === 'add_card') {
    require_fields($data, ['title', 'easy', 'medium', 'hard']);
    try {
        $pdo->beginTransaction();
        $pdo->prepare('INSERT INTO quest_cards(title,active) VALUES(?,1)')->execute([$data['title']]);
        $cardId = (int)$pdo->lastInsertId();
        $query = $pdo->prepare('INSERT INTO quest_tasks(quest_card_id,difficulty,task_text,points) VALUES(?,?,?,?)');
        $query->execute([$cardId, 1, $data['easy'], 10]);
        $query->execute([$cardId, 2, $data['medium'], 20]);
        $query->execute([$cardId, 3, $data['hard'], 30]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
    respond(['ok' => true, 'id' => $cardId]);
}

if ($action === 'update_rider') {
    $riderId = requested_rider_id($data);
    require_rider($pdo, $riderId);
    $name = trim((string)($data['display_name'] ?? ''));
    $points = filter_var($data['points'] ?? null, FILTER_VALIDATE_INT);
    $nameLocked = !empty($data['name_locked']) ? 1 : 0;
    if (mb_strlen($name) < 2 || mb_strlen($name) > 32) respond(['ok' => false, 'error' => 'Rider names must be 2–32 characters.'], 422);
    if ($points === false || $points < 0 || $points > 1000000) respond(['ok' => false, 'error' => 'Points must be between 0 and 1,000,000.'], 422);
    $pdo->prepare('UPDATE riders SET display_name=?,points=?,name_locked=? WHERE id=?')->execute([$name, $points, $nameLocked, $riderId]);
    respond(['ok' => true]);
}

if ($action === 'clear_current_quest') {
    $riderId = requested_rider_id($data);
    require_rider($pdo, $riderId);
    $pdo->prepare('DELETE FROM rider_current_quests WHERE rider_id=?')->execute([$riderId]);
    respond(['ok' => true]);
}

if ($action === 'clear_quest_history') {
    $riderId = requested_rider_id($data);
    require_rider($pdo, $riderId);
    try {
        $pdo->beginTransaction();
        $pdo->prepare('DELETE FROM completions WHERE rider_id=?')->execute([$riderId]);
        $pdo->prepare('DELETE FROM rider_current_quests WHERE rider_id=?')->execute([$riderId]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
    respond(['ok' => true]);
}

if ($action === 'reset_rider') {
    $riderId = requested_rider_id($data);
    require_rider($pdo, $riderId);
    try {
        $pdo->beginTransaction();
        $pdo->prepare('DELETE FROM kudos WHERE giver_rider_id=?')->execute([$riderId]);
        $pdo->prepare('DELETE FROM completions WHERE rider_id=?')->execute([$riderId]);
        $pdo->prepare('DELETE FROM rider_current_quests WHERE rider_id=?')->execute([$riderId]);
        $pdo->prepare('DELETE FROM reservations WHERE rider_id=?')->execute([$riderId]);
        $pdo->prepare('DELETE FROM messages WHERE rider_id=?')->execute([$riderId]);
        $pdo->prepare('UPDATE riders SET points=0,name_locked=0 WHERE id=?')->execute([$riderId]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
    respond(['ok' => true]);
}

if ($action === 'delete_rider') {
    $riderId = requested_rider_id($data);
    require_rider($pdo, $riderId);
    $pdo->prepare('DELETE FROM riders WHERE id=?')->execute([$riderId]);
    respond(['ok' => true]);
}

if ($action === 'delete_message') {
    $pdo->prepare('DELETE FROM messages WHERE id=?')->execute([(int)($data['id'] ?? 0)]);
    respond(['ok' => true]);
}

respond(['ok' => false, 'error' => 'Unknown action'], 404);
