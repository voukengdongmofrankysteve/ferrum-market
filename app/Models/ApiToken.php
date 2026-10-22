<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiToken extends Model
{
    protected $guarded = [];

    protected $casts = ['last_used_at' => 'datetime'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Makes a token: returns the plain text (shown once) and stores only its hash. */
    public static function issue(User $user, string $label): string
    {
        $plain = 'fxt_'.bin2hex(random_bytes(24));
        static::create(['user_id' => $user->id, 'token_hash' => hash('sha256', $plain), 'label' => mb_substr($label, 0, 80)]);

        return $plain;
    }

    public static function userFor(string $plain): ?User
    {
        if (! str_starts_with($plain, 'fxt_')) {
            return null;
        }
        $t = static::where('token_hash', hash('sha256', $plain))->first();
        if (! $t) {
            return null;
        }
        $t->forceFill(['last_used_at' => now()])->save();

        return $t->user;
    }
}
