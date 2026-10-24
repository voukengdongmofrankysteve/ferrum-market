<?php

namespace App\Support;

use App\Models\AiSetting;
use App\Models\AiUsage;
use App\Models\User;

/** The rules of the built-in AI plan: which models, how much each person may use, and the monthly spending cap. */
class AiGateway
{
    public static function enabled(): bool
    {
        return (bool) AiSetting::read('enabled', config('ai.enabled'));
    }

    public static function upstreamUrl(): string
    {
        return rtrim((string) AiSetting::read('upstream_url', config('ai.upstream_url')), '/');
    }

    public static function upstreamKey(): ?string
    {
        return AiSetting::readSecret('upstream_key');
    }

    /** @return array<int, array<string, mixed>> */
    public static function models(): array
    {
        $m = AiSetting::read('models', config('ai.models'));

        return is_array($m) ? array_values(array_filter($m, fn ($x) => is_array($x) && ! empty($x['id']) && ! empty($x['upstream']))) : [];
    }

    public static function model(string $id): ?array
    {
        foreach (static::models() as $m) {
            if ($m['id'] === $id) {
                return $m;
            }
        }

        return null;
    }

    /** The models this person's plan may use. */
    public static function modelsFor(User $u): array
    {
        $plan = static::plan($u);

        return array_values(array_filter(static::models(), fn ($m) => in_array($plan, (array) ($m['plans'] ?? ['free', 'pro']), true)));
    }

    public static function plan(User $u): string
    {
        return in_array($u->ai_plan, ['free', 'pro', 'blocked'], true) ? $u->ai_plan : 'free';
    }

    public static function dailyLimit(User $u): int
    {
        if ($u->ai_daily_tokens !== null) {
            return (int) $u->ai_daily_tokens;
        }
        $plan = static::plan($u);
        if ($plan === 'blocked') {
            return 0;
        }

        return (int) AiSetting::read($plan === 'pro' ? 'pro_daily_tokens' : 'free_daily_tokens', config($plan === 'pro' ? 'ai.pro_daily_tokens' : 'ai.free_daily_tokens'));
    }

    public static function monthlyCapMicro(): int
    {
        return (int) round(((float) AiSetting::read('monthly_cap_usd', config('ai.monthly_cap_usd'))) * 1_000_000);
    }

    public static function perMinute(): int
    {
        return max(1, (int) AiSetting::read('per_minute', config('ai.per_minute')));
    }

    public static function maxInputChars(): int
    {
        return max(1000, (int) AiSetting::read('max_input_chars', config('ai.max_input_chars')));
    }

    /** What the person sees about their allowance. */
    public static function status(User $u): array
    {
        $limit = static::dailyLimit($u);
        $used = AiUsage::tokensToday($u->id);

        return [
            'plan' => static::plan($u),
            'daily_tokens' => $limit,
            'used_today' => $used,
            'remaining_today' => max(0, $limit - $used),
            'resets_at' => now()->addDay()->startOfDay()->toIso8601String(),
            'paused' => ! static::enabled() || AiUsage::monthCostMicro() >= static::monthlyCapMicro(),
        ];
    }

    /** Why this person cannot use the AI right now, or null when they can. */
    public static function refusal(User $u): ?array
    {
        if (! static::enabled()) {
            return ['status' => 503, 'error' => 'The built-in AI is switched off for now.', 'code' => 'disabled'];
        }
        if (static::plan($u) === 'blocked') {
            return ['status' => 403, 'error' => 'The built-in AI is not available for this account.', 'code' => 'blocked'];
        }
        if (! static::upstreamKey()) {
            return ['status' => 503, 'error' => 'The built-in AI is not set up yet.', 'code' => 'not_configured'];
        }
        if (AiUsage::monthCostMicro() >= static::monthlyCapMicro()) {
            return ['status' => 503, 'error' => 'The built-in AI has reached its limit for this month and is paused until the 1st. You can still add your own key in the AI settings.', 'code' => 'monthly_cap'];
        }
        if (static::dailyLimit($u) - AiUsage::tokensToday($u->id) <= 0) {
            return ['status' => 429, 'error' => 'You used your AI allowance for today. It resets at midnight (UTC), or you can add your own key in the AI settings.', 'code' => 'daily_limit'];
        }

        return null;
    }

    /** Cost in millionths of a dollar for a model, from the configured price per million tokens. */
    public static function costMicro(array $model, int $in, int $out): int
    {
        return (int) round(($in * (float) ($model['in'] ?? 0)) + ($out * (float) ($model['out'] ?? 0)));
    }

    /** A rough token count when the provider reports none (about four characters to a token). */
    public static function estimateTokens(string $text): int
    {
        return (int) ceil(mb_strlen($text) / 4);
    }
}
