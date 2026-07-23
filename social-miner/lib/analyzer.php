<?php
declare(strict_types=1);

function analyze_comment(string $text): array {
    $normalized = strtolower($text);
    $flags = [];
    $score = 0;

    $secondPerson = preg_match('/\b(you|youre|you\'re|your|u)\b/u', $normalized) === 1;
    $violent = preg_match('/\b(kill|shoot|stab|hurt|beat|smash|attack|murder|dead|die)\w*\b/u', $normalized) === 1;
    $intent = preg_match('/\b(i\s*(?:will|ll|\'ll|am going to|m gonna)|we\s*(?:will|ll|\'ll|are going to))\b/u', $normalized) === 1;
    $location = preg_match('/\b(find you|know where|come to your|show up|at your house|your address)\b/u', $normalized) === 1;
    $harass = preg_match('/\b(loser|idiot|moron|pathetic|worthless|piece of shit|fuck you)\b/u', $normalized) === 1;

    if ($violent) { $flags[] = 'violence-language'; $score += 2; }
    if ($violent && $secondPerson) { $flags[] = 'directed-violence'; $score += 3; }
    if ($violent && $intent) { $flags[] = 'stated-intent'; $score += 4; }
    if ($location) { $flags[] = 'location-or-pursuit'; $score += 4; }
    if ($harass) { $flags[] = 'harassment-language'; $score += 1; }

    $customRaw = setting('custom_flag_terms', '') ?? '';
    $customTerms = array_values(array_filter(array_map('trim', preg_split('/[\r\n,]+/', $customRaw) ?: [])));
    foreach ($customTerms as $term) {
        if ($term !== '' && stripos($text, $term) !== false) {
            $flags[] = 'custom:' . $term;
            $score += 3;
        }
    }

    $level = match (true) {
        $score >= 7 => 'high',
        $score >= 4 => 'medium',
        $score >= 1 => 'low',
        default => 'none',
    };

    return ['risk_level' => $level, 'flags' => array_values(array_unique($flags)), 'score' => $score];
}
