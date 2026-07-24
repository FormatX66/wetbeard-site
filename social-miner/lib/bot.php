<?php
declare(strict_types=1);

function bot_identity_key(array $row): string {
    $platform = strtolower(trim((string)($row['platform'] ?? 'unknown')));
    $userId = trim((string)($row['user_id'] ?? ''));
    $username = strtolower(trim((string)($row['username'] ?? '')));
    return $platform . ':' . ($userId !== '' ? 'id:' . $userId : 'user:' . $username);
}

function bot_report_key(string $identity): string {
    return substr(hash('sha256', $identity), 0, 24);
}

function bot_normalize_text(string $text): string {
    $text = strtolower(trim($text));
    $text = preg_replace('~https?://\S+|www\.\S+~i', '<url>', $text) ?? $text;
    $text = preg_replace('/\s+/u', ' ', $text) ?? $text;
    $text = preg_replace('/[^\p{L}\p{N}<>' . "'" . ' ]+/u', '', $text) ?? $text;
    return trim($text);
}

function bot_timestamp(array $row): ?int {
    $value = trim((string)($row['created_time'] ?? $row['collected_at'] ?? ''));
    if ($value === '') return null;
    $t = strtotime($value);
    return $t === false ? null : $t;
}

function bot_median(array $values): ?float {
    if (!$values) return null;
    sort($values, SORT_NUMERIC);
    $n = count($values);
    $m = intdiv($n, 2);
    return $n % 2 ? (float)$values[$m] : ((float)$values[$m - 1] + (float)$values[$m]) / 2.0;
}

function bot_mean(array $values): float {
    return $values ? array_sum($values) / count($values) : 0.0;
}

function bot_stddev(array $values): float {
    $n = count($values);
    if ($n < 2) return 0.0;
    $mean = bot_mean($values);
    $sum = 0.0;
    foreach ($values as $v) $sum += ((float)$v - $mean) ** 2;
    return sqrt($sum / $n);
}

function bot_generated_username_signal(string $username): bool {
    $u = strtolower(trim($username));
    if ($u === '' || strlen($u) < 5) return false;
    if (preg_match('/[a-z]{2,}[._-]?\d{5,}$/i', $u)) return true;
    if (preg_match('/^[a-z]{2,}[._-][a-z]{2,}[._-]?\d{4,}$/i', $u)) return true;
    if (preg_match('/^[a-z0-9]{14,}$/i', $u) && preg_match('/[a-z]/i', $u) && preg_match('/\d/', $u)) return true;
    return false;
}

function build_bot_reports(array $comments): array {
    $groups = [];
    $textAccounts = [];

    foreach ($comments as $row) {
        if (!is_array($row)) continue;
        $identity = bot_identity_key($row);
        $groups[$identity][] = $row;
        $norm = bot_normalize_text((string)($row['text'] ?? ''));
        if ($norm !== '' && strlen($norm) >= 4) $textAccounts[$norm][$identity] = true;
    }

    $reports = [];
    foreach ($groups as $identity => $rows) {
        usort($rows, fn($a,$b) => (bot_timestamp($a) ?? PHP_INT_MAX) <=> (bot_timestamp($b) ?? PHP_INT_MAX));
        $n = count($rows);
        if ($n === 0) continue;

        $platform = (string)($rows[0]['platform'] ?? '');
        $username = (string)($rows[0]['username'] ?? '');
        $userId = (string)($rows[0]['user_id'] ?? '');
        $texts = [];
        $textCounts = [];
        $linkCount = 0;
        $lengths = [];
        $sharedCount = 0;
        $highRisk = 0;
        $mediumRisk = 0;
        $times = [];

        foreach ($rows as $row) {
            $text = trim((string)($row['text'] ?? ''));
            $norm = bot_normalize_text($text);
            if ($norm !== '') {
                $texts[] = $norm;
                $textCounts[$norm] = ($textCounts[$norm] ?? 0) + 1;
                if (count($textAccounts[$norm] ?? []) >= 2) $sharedCount++;
            }
            if (preg_match('~https?://|www\.~i', $text)) $linkCount++;
            $lengths[] = strlen($text);
            $risk = (string)($row['risk_level'] ?? 'none');
            if ($risk === 'high') $highRisk++;
            if ($risk === 'medium') $mediumRisk++;
            $t = bot_timestamp($row);
            if ($t !== null) $times[] = $t;
        }

        $uniqueTexts = count(array_unique($texts));
        $duplicateRatio = count($texts) > 0 ? max(0.0, (count($texts) - $uniqueTexts) / count($texts)) : 0.0;
        $sharedRatio = count($texts) > 0 ? $sharedCount / count($texts) : 0.0;
        $linkRatio = $n > 0 ? $linkCount / $n : 0.0;

        sort($times, SORT_NUMERIC);
        $intervals = [];
        for ($i = 1; $i < count($times); $i++) {
            $delta = $times[$i] - $times[$i - 1];
            if ($delta >= 0) $intervals[] = $delta;
        }
        $under10 = 0; $under60 = 0;
        foreach ($intervals as $d) {
            if ($d <= 10) $under10++;
            if ($d <= 60) $under60++;
        }
        $burst10Ratio = $intervals ? $under10 / count($intervals) : 0.0;
        $burst60Ratio = $intervals ? $under60 / count($intervals) : 0.0;
        $intervalMean = bot_mean($intervals);
        $intervalCv = ($intervalMean > 0 && count($intervals) >= 3) ? bot_stddev($intervals) / $intervalMean : null;
        $regularity = $intervalCv === null ? 0.0 : max(0.0, min(1.0, (0.50 - $intervalCv) / 0.50));

        $signals = [];
        $score = 0.0;
        $addSignal = function(string $name, float $points, string $value, string $explanation) use (&$signals, &$score): void {
            $points = max(0.0, $points);
            if ($points <= 0.01) return;
            $score += $points;
            $signals[] = ['name'=>$name,'points'=>round($points,1),'value'=>$value,'explanation'=>$explanation];
        };

        $addSignal('Repeated comments', 30.0 * min(1.0, $duplicateRatio / 0.75), round($duplicateRatio * 100) . '% duplicate', 'Repeated or near-identical normalized comments from the same account.');
        $addSignal('Cross-account phrase reuse', 22.0 * min(1.0, $sharedRatio / 0.75), round($sharedRatio * 100) . '% shared', 'The same normalized text also appears under other accounts in this dataset.');
        $addSignal('Burst posting', 12.0 * $burst60Ratio + 7.0 * $burst10Ratio, round($burst60Ratio * 100) . '% ≤60s; ' . round($burst10Ratio * 100) . '% ≤10s', 'A large share of consecutive comments arrived within short intervals.');
        if (count($intervals) >= 3) $addSignal('Regular timing', 11.0 * $regularity, $intervalCv === null ? 'n/a' : 'interval CV ' . number_format($intervalCv, 2), 'Highly uniform posting intervals can be consistent with scheduling or automation.');
        $addSignal('Link-heavy behavior', 8.0 * $linkRatio, round($linkRatio * 100) . '% with links', 'A high share of comments contain links.');
        $volumePoints = $n >= 20 ? 8.0 : ($n >= 10 ? 6.0 : ($n >= 5 ? 3.0 : 0.0));
        $addSignal('High comment volume', $volumePoints, (string)$n . ' comments', 'High posting volume raises automation suspicion when combined with other signals.');
        if (bot_generated_username_signal($username)) $addSignal('Generated-looking username', 4.0, $username, 'Username structure resembles a machine-generated naming pattern. This is a weak signal by itself.');

        $score = (int)round(min(100.0, $score));
        $label = match (true) {
            $score >= 75 => 'Highly likely automated',
            $score >= 50 => 'Suspicious automation',
            $score >= 25 => 'Some automation signals',
            default => 'Likely human / insufficient automation signals',
        };

        $timestampCoverage = $n > 0 ? count($times) / $n : 0.0;
        $confidenceScore = min(1.0, ($n / 8.0)) * (0.65 + 0.35 * $timestampCoverage);
        $confidence = $confidenceScore >= 0.75 ? 'high' : ($confidenceScore >= 0.40 ? 'medium' : 'low');

        arsort($textCounts);
        $commonTexts = [];
        foreach (array_slice($textCounts, 0, 8, true) as $text => $count) {
            $commonTexts[] = [
                'text'=>$text,
                'count'=>$count,
                'accounts_using_text'=>count($textAccounts[$text] ?? []),
            ];
        }

        $sampleRows = array_slice(array_reverse($rows), 0, 100);
        $samples = array_map(fn($r) => [
            'text'=>(string)($r['text'] ?? ''),
            'created_time'=>(string)($r['created_time'] ?? $r['collected_at'] ?? ''),
            'risk_level'=>(string)($r['risk_level'] ?? 'none'),
            'source_type'=>(string)($r['source_type'] ?? 'api'),
            'source_file'=>(string)($r['source_file'] ?? ''),
            'permalink'=>(string)($r['permalink'] ?? ''),
        ], $sampleRows);

        $first = $times ? gmdate('c', min($times)) : '';
        $latest = $times ? gmdate('c', max($times)) : '';
        $reports[] = [
            'report_id'=>bot_report_key($identity),
            'identity'=>$identity,
            'platform'=>$platform,
            'username'=>$username,
            'user_id'=>$userId,
            'bot_percentage'=>$score,
            'label'=>$label,
            'confidence'=>$confidence,
            'comment_count'=>$n,
            'high_risk_count'=>$highRisk,
            'medium_risk_count'=>$mediumRisk,
            'first_activity'=>$first,
            'latest_activity'=>$latest,
            'metrics'=>[
                'unique_text_count'=>$uniqueTexts,
                'duplicate_ratio'=>round($duplicateRatio,4),
                'cross_account_shared_ratio'=>round($sharedRatio,4),
                'link_ratio'=>round($linkRatio,4),
                'timestamp_coverage'=>round($timestampCoverage,4),
                'interval_count'=>count($intervals),
                'median_interval_seconds'=>bot_median($intervals),
                'minimum_interval_seconds'=>$intervals ? min($intervals) : null,
                'burst_10s_ratio'=>round($burst10Ratio,4),
                'burst_60s_ratio'=>round($burst60Ratio,4),
                'interval_cv'=>$intervalCv === null ? null : round($intervalCv,4),
                'average_comment_length'=>round(bot_mean($lengths),1),
            ],
            'signals'=>$signals,
            'common_texts'=>$commonTexts,
            'comments'=>$samples,
            'methodology_note'=>'Heuristic behavioral estimate from collected comment text/timing only. It cannot prove an account is automated and does not use IP, device, login, or Meta-internal signals.',
        ];
    }

    usort($reports, fn($a,$b) => [$b['bot_percentage'],$b['comment_count']] <=> [$a['bot_percentage'],$a['comment_count']]);
    return $reports;
}

function find_bot_report(array $comments, string $reportId): ?array {
    foreach (build_bot_reports($comments) as $report) {
        if (hash_equals((string)$report['report_id'], $reportId)) return $report;
    }
    return null;
}
