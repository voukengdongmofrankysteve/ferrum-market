<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class AiUsage extends Model
{
    protected $guarded = [];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Adds one request to today's row for this person and model. */
    public static function record(int $userId, string $model, int $in, int $out, int $costMicro): void
    {
        $day = now()->toDateString();
        DB::transaction(function () use ($userId, $model, $in, $out, $costMicro, $day) {
            $row = static::where(['user_id' => $userId, 'day' => $day, 'model' => $model])->lockForUpdate()->first();
            if (! $row) {
                static::create(['user_id' => $userId, 'day' => $day, 'model' => $model, 'requests' => 1, 'input_tokens' => max(0, $in), 'output_tokens' => max(0, $out), 'cost_micro' => max(0, $costMicro)]);

                return;
            }
            $row->update([
                'requests' => $row->requests + 1,
                'input_tokens' => $row->input_tokens + max(0, $in),
                'output_tokens' => $row->output_tokens + max(0, $out),
                'cost_micro' => $row->cost_micro + max(0, $costMicro),
            ]);
        });
    }

    /** Tokens one person has used today. */
    public static function tokensToday(int $userId): int
    {
        $r = static::where('user_id', $userId)->where('day', now()->toDateString())->selectRaw('COALESCE(SUM(input_tokens + output_tokens), 0) as t')->value('t');

        return (int) $r;
    }

    /** What everybody together has cost this calendar month, in millionths of a dollar. */
    public static function monthCostMicro(): int
    {
        return (int) static::where('day', '>=', now()->startOfMonth()->toDateString())->sum('cost_micro');
    }
}
