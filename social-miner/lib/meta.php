<?php
declare(strict_types=1);

final class MetaClient {
    public function __construct(
        private readonly string $platform,
        private readonly string $token,
        private readonly string $version = 'v23.0',
        private readonly ?string $instagramHost = null,
    ) {}

    private function host(): string {
        if ($this->platform === 'instagram') {
            return $this->instagramHost ?: 'graph.instagram.com';
        }
        return 'graph.facebook.com';
    }

    private function request(string $url): array {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->token,
                'Accept: application/json',
                'User-Agent: SocialMiner/' . MINER_VERSION,
            ],
        ]);
        $body = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        if ($body === false) throw new RuntimeException('Meta request failed: ' . $error);
        $json = json_decode($body, true);
        if (!is_array($json)) throw new RuntimeException('Meta returned non-JSON response (HTTP ' . $status . ').');
        if ($status >= 400 || isset($json['error'])) {
            $msg = $json['error']['message'] ?? ('HTTP ' . $status);
            $code = $json['error']['code'] ?? null;
            throw new RuntimeException('Meta API error' . ($code ? " {$code}" : '') . ': ' . $msg);
        }
        return $json;
    }

    private function firstUrl(string $id, string $edge, array $params): string {
        $base = 'https://' . $this->host() . '/' . rawurlencode($this->version) . '/' . rawurlencode($id) . '/' . rawurlencode($edge);
        return $base . '?' . http_build_query($params, '', '&', PHP_QUERY_RFC3986);
    }

    private function paged(string $url, int $maxPages = 100): array {
        $items = [];
        $page = 0;
        while ($url !== '' && $page < $maxPages) {
            $page++;
            $json = $this->request($url);
            foreach (($json['data'] ?? []) as $item) if (is_array($item)) $items[] = $item;
            $next = $json['paging']['next'] ?? '';
            $url = is_string($next) ? $next : '';
        }
        return $items;
    }

    public function fetchComments(string $mediaId): array {
        return $this->platform === 'instagram'
            ? $this->fetchInstagramComments($mediaId)
            : $this->fetchFacebookComments($mediaId);
    }

    private function fetchInstagramComments(string $mediaId): array {
        $fields = 'id,text,timestamp,like_count,from';
        $top = $this->paged($this->firstUrl($mediaId, 'comments', ['fields' => $fields, 'limit' => 100]));
        $out = [];
        foreach ($top as $comment) {
            $comment['_parent_id'] = '';
            $out[] = $comment;
            $cid = (string)($comment['id'] ?? '');
            if ($cid === '') continue;
            try {
                $replies = $this->paged($this->firstUrl($cid, 'replies', ['fields' => $fields, 'limit' => 100]), 20);
                foreach ($replies as $reply) {
                    $reply['_parent_id'] = $cid;
                    $out[] = $reply;
                }
            } catch (Throwable $e) {
                // Keep top-level comments if the token/media combination does not expose replies.
            }
        }
        return $out;
    }

    private function fetchFacebookComments(string $postId): array {
        $fields = 'id,message,created_time,from,like_count,parent,permalink_url';
        $top = $this->paged($this->firstUrl($postId, 'comments', ['fields' => $fields, 'filter' => 'stream', 'limit' => 100]));
        $seen = [];
        $out = [];
        foreach ($top as $comment) {
            $cid = (string)($comment['id'] ?? '');
            if ($cid === '' || isset($seen[$cid])) continue;
            $seen[$cid] = true;
            $comment['_parent_id'] = (string)($comment['parent']['id'] ?? '');
            $out[] = $comment;
            try {
                $replies = $this->paged($this->firstUrl($cid, 'comments', ['fields' => $fields, 'limit' => 100]), 20);
                foreach ($replies as $reply) {
                    $rid = (string)($reply['id'] ?? '');
                    if ($rid === '' || isset($seen[$rid])) continue;
                    $seen[$rid] = true;
                    $reply['_parent_id'] = $cid;
                    $out[] = $reply;
                }
            } catch (Throwable $e) {
                // Continue even if replies are not available.
            }
        }
        return $out;
    }
}

function normalize_meta_comment(string $platform, string $mediaId, array $item): array {
    $from = is_array($item['from'] ?? null) ? $item['from'] : [];
    $text = $platform === 'instagram' ? (string)($item['text'] ?? '') : (string)($item['message'] ?? '');
    $analysis = analyze_comment($text);
    return [
        'platform' => $platform,
        'external_comment_id' => (string)($item['id'] ?? ''),
        'external_media_id' => $mediaId,
        'parent_external_id' => (string)($item['_parent_id'] ?? ($item['parent']['id'] ?? '')),
        'user_id' => (string)($from['id'] ?? ''),
        'username' => (string)($from['username'] ?? $from['name'] ?? ''),
        'text' => $text,
        'created_time' => (string)($item['timestamp'] ?? $item['created_time'] ?? ''),
        'like_count' => (int)($item['like_count'] ?? 0),
        'permalink' => (string)($item['permalink_url'] ?? ''),
        'risk_level' => $analysis['risk_level'],
        'flags_json' => json_encode($analysis['flags'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        'raw_json' => json_encode($item, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
    ];
}

function sync_watch(array $watch): int {
    $platform = (string)$watch['platform'];
    $tokenKey = $platform === 'instagram' ? 'instagram_token' : 'facebook_token';
    $token = setting($tokenKey, '') ?? '';
    if ($token === '') throw new RuntimeException("No {$platform} access token configured.");
    $version = setting('meta_api_version', 'v23.0') ?: 'v23.0';
    $igHost = setting('instagram_host', 'graph.instagram.com') ?: 'graph.instagram.com';
    $client = new MetaClient($platform, $token, $version, $igHost);
    $items = $client->fetchComments((string)$watch['external_id']);
    $count = 0;
    foreach ($items as $item) {
        $row = normalize_meta_comment($platform, (string)$watch['external_id'], $item);
        if ($row['external_comment_id'] === '') continue;
        comment_upsert($row);
        $count++;
    }
    watch_touch_sync((int)$watch['id']);
    return $count;
}
