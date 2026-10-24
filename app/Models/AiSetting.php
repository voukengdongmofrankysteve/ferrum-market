<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;
use Throwable;

/** A key and value the administrator can change without touching files. Secrets are stored encrypted. */
class AiSetting extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    public static function read(string $key, mixed $default = null): mixed
    {
        try {
            if (! Schema::hasTable('ai_settings')) {
                return $default;
            }
            $row = static::find($key);

            return $row && $row->value !== null ? json_decode($row->value, true) : $default;
        } catch (Throwable) {
            return $default;
        }
    }

    public static function put(string $key, mixed $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => json_encode($value)]);
    }

    public static function forget(string $key): void
    {
        static::where('key', $key)->delete();
    }

    public static function putSecret(string $key, string $plain): void
    {
        static::put($key, Crypt::encryptString($plain));
    }

    public static function readSecret(string $key): ?string
    {
        $v = static::read($key);
        if (! is_string($v) || $v === '') {
            return null;
        }
        try {
            return Crypt::decryptString($v);
        } catch (Throwable) {
            return null;
        }
    }
}
