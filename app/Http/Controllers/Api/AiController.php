<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiUsage;
use App\Models\ApiToken;
use App\Models\User;
use App\Support\AiGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * The built-in AI plan: an OpenAI compatible endpoint in front of the provider the administrator chose.
 * The provider key never leaves this server. Each person has a daily allowance, there is a monthly
 * spending cap for everybody, and the Ferrum editor signs in with the same token it uses for the marketplace.
 */
class AiController extends Controller
{
    private function need(Request $r): User
    {
        $t = $r->bearerToken();
        $u = $t ? ApiToken::userFor($t) : null;

        return $u ?? abort(response()->json(['error' => 'Sign in first.', 'code' => 'auth'], 401));
    }

    /** The models this person may use, and how much of today's allowance is left. */
    public function models(Request $r): JsonResponse
    {
        $u = $this->need($r);

        return response()->json([
            'models' => array_map(fn ($m) => ['id' => $m['id'], 'label' => $m['label'] ?? $m['id'], 'note' => $m['note'] ?? '', 'max_output' => (int) ($m['max_output'] ?? 4096)], AiGateway::modelsFor($u)),
            'status' => AiGateway::status($u),
        ]);
    }

    public function chat(Request $r): Response
    {
        $u = $this->need($r);
        if ($why = AiGateway::refusal($u)) {
            return response()->json(['error' => $why['error'], 'code' => $why['code']], $why['status']);
        }

        $in = $r->json()->all();
        $allowed = AiGateway::modelsFor($u);
        $alias = (string) ($in['model'] ?? ($allowed[0]['id'] ?? ''));
        $model = AiGateway::model($alias);
        if (! $model || ! in_array($model['id'], array_column($allowed, 'id'), true)) {
            return response()->json(['error' => 'That model is not part of your plan. Choose one from the list.', 'code' => 'model'], 403);
        }

        $messages = $in['messages'] ?? null;
        if (! is_array($messages) || $messages === [] || count($messages) > 800) {
            return response()->json(['error' => 'Send a list of messages.', 'code' => 'bad_request'], 422);
        }
        $size = strlen((string) json_encode($messages));
        if ($size > AiGateway::maxInputChars()) {
            return response()->json(['error' => 'This conversation is too long for the built-in AI. Start a new chat or summarise it first.', 'code' => 'too_long'], 413);
        }

        $remaining = max(0, AiGateway::dailyLimit($u) - AiUsage::tokensToday($u->id));
        $estimateIn = AiGateway::estimateTokens((string) json_encode($messages));
        $cap = (int) ($model['max_output'] ?? 4096);
        $want = isset($in['max_tokens']) ? (int) $in['max_tokens'] : $cap;
        // A request may not run far past what is left of today's allowance.
        $maxTokens = max(64, min($want, $cap, max(256, $remaining - $estimateIn + 2048)));

        $up = [
            'model' => $model['upstream'],
            'messages' => $messages,
            'max_tokens' => $maxTokens,
            'stream' => (bool) ($in['stream'] ?? false),
        ];
        if (isset($in['tools']) && is_array($in['tools']) && count($in['tools']) <= 80 && strlen((string) json_encode($in['tools'])) < 400000) {
            $up['tools'] = $in['tools'];
            if (isset($in['tool_choice'])) {
                $up['tool_choice'] = $in['tool_choice'];
            }
        }
        foreach (['temperature' => [0, 2], 'top_p' => [0, 1]] as $k => [$lo, $hi]) {
            if (isset($in[$k]) && is_numeric($in[$k])) {
                $up[$k] = max($lo, min($hi, (float) $in[$k]));
            }
        }
        if (isset($in['stop']) && is_array($in['stop'])) {
            $up['stop'] = array_slice(array_map('strval', $in['stop']), 0, 4);
        }
        if (isset($in['response_format']) && is_array($in['response_format'])) {
            $up['response_format'] = $in['response_format'];
        }
        if ($up['stream']) {
            $up['stream_options'] = ['include_usage' => true];
        }
        // OpenRouter reports the real cost when asked; other providers ignore this field.
        $up['usage'] = ['include' => true];

        $http = $this->http();
        $url = AiGateway::upstreamUrl().'/chat/completions';

        try {
            if (! $up['stream']) {
                $resp = $http->post($url, $up);
                if ($resp->failed()) {
                    return $this->upstreamError($resp->status(), (string) $resp->body());
                }
                $data = (array) $resp->json();
                $usage = (array) ($data['usage'] ?? []);
                $this->record($u, $model, $usage, $estimateIn, AiGateway::estimateTokens((string) ($data['choices'][0]['message']['content'] ?? '')));
                $data['model'] = $model['id'];

                return response()->json($data);
            }

            $resp = $http->withOptions(['stream' => true])->post($url, $up);
            if ($resp->failed()) {
                return $this->upstreamError($resp->status(), (string) $resp->body());
            }
        } catch (Throwable $e) {
            Log::warning('ai upstream: '.$e->getMessage());

            return response()->json(['error' => 'The AI service could not be reached. Try again in a moment.', 'code' => 'upstream'], 502);
        }

        return response()->stream(function () use ($resp, $u, $model, $estimateIn) {
            ignore_user_abort(true);
            $body = $resp->toPsrResponse()->getBody();
            $buf = '';
            $usage = [];
            $chars = 0;
            try {
                while (! $body->eof()) {
                    $chunk = $body->read(4096);
                    if ($chunk === '') {
                        continue;
                    }
                    echo $chunk;
                    if (ob_get_level() > 0) {
                        @ob_flush();
                    }
                    flush();
                    $buf .= $chunk;
                    while (($nl = strpos($buf, "\n")) !== false) {
                        $line = trim(substr($buf, 0, $nl));
                        $buf = substr($buf, $nl + 1);
                        if (! str_starts_with($line, 'data:')) {
                            continue;
                        }
                        $json = trim(substr($line, 5));
                        if ($json === '' || $json === '[DONE]') {
                            continue;
                        }
                        $ev = json_decode($json, true);
                        if (! is_array($ev)) {
                            continue;
                        }
                        if (! empty($ev['usage']) && is_array($ev['usage'])) {
                            $usage = $ev['usage'];
                        }
                        $d = $ev['choices'][0]['delta'] ?? [];
                        $chars += strlen((string) ($d['content'] ?? '')) + strlen((string) ($d['reasoning'] ?? ''));
                        foreach ((array) ($d['tool_calls'] ?? []) as $tc) {
                            $chars += strlen((string) ($tc['function']['arguments'] ?? '')) + strlen((string) ($tc['function']['name'] ?? ''));
                        }
                    }
                    if (connection_aborted()) {
                        break;
                    }
                }
            } finally {
                $this->record($u, $model, $usage, $estimateIn, (int) ceil($chars / 4));
            }
        }, 200, ['Content-Type' => 'text/event-stream', 'Cache-Control' => 'no-cache, no-transform', 'X-Accel-Buffering' => 'no', 'Connection' => 'keep-alive']);
    }

    private function http(): PendingRequest
    {
        return Http::withToken((string) AiGateway::upstreamKey())
            ->withHeaders(['HTTP-Referer' => 'https://ferrum.vyloxi.com', 'X-Title' => 'Ferrum'])
            ->acceptJson()
            ->connectTimeout(15)
            ->timeout(300);
    }

    /** Writes the usage of one request; the provider's own numbers win over the estimates. */
    private function record(User $u, array $model, array $usage, int $estimateIn, int $estimateOut): void
    {
        $in = (int) ($usage['prompt_tokens'] ?? $estimateIn);
        $out = (int) ($usage['completion_tokens'] ?? $estimateOut);
        $cost = isset($usage['cost']) && is_numeric($usage['cost']) ? (int) round(((float) $usage['cost']) * 1_000_000) : AiGateway::costMicro($model, $in, $out);
        try {
            AiUsage::record($u->id, $model['id'], $in, $out, $cost);
        } catch (Throwable $e) {
            report($e);
        }
    }

    /** What the person is told when the provider refuses; the details stay in the log. */
    private function upstreamError(int $status, string $body): JsonResponse
    {
        Log::warning('ai upstream answered '.$status.': '.mb_substr($body, 0, 300));
        if ($status === 429) {
            return response()->json(['error' => 'The AI provider is busy. Try again in a moment.', 'code' => 'busy'], 429);
        }
        if ($status === 400 || $status === 413 || $status === 422) {
            $msg = (string) (json_decode($body, true)['error']['message'] ?? 'The request was refused.');

            return response()->json(['error' => mb_substr($msg, 0, 300), 'code' => 'bad_request'], 400);
        }
        if (in_array($status, [401, 402, 403], true)) {
            return response()->json(['error' => 'The built-in AI is not available right now.', 'code' => 'unavailable'], 503);
        }

        return response()->json(['error' => 'The AI service had a problem. Try again in a moment.', 'code' => 'upstream'], 502);
    }
}
