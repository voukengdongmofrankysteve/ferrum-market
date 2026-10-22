<?php

namespace App\Support;

use App\Models\Publisher;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Throwable;

/**
 * The extensions made by Vyloxi live in resources/official as .fext packages. On a host with no shell there is no
 * "php artisan db:seed", so the first web request after a deploy publishes them (once per change of that folder).
 */
class Official
{
    public const EMAIL = 'official@ferrum.vyloxi.com';

    /** @return array{published: int, skipped: int, failed: int} */
    public static function sync(?string $dir = null, bool $force = false): array
    {
        $dir ??= resource_path('official');
        $result = ['published' => 0, 'skipped' => 0, 'failed' => 0];
        $files = glob($dir.'/*.fext') ?: [];
        if (! $files) {
            return $result;
        }
        sort($files);
        $sig = md5(implode('|', array_map(fn ($f) => basename($f).':'.filesize($f), $files)));
        $marker = storage_path('app/official.sig');
        if (! $force && is_file($marker) && trim((string) file_get_contents($marker)) === $sig) {
            return $result;
        }

        @mkdir(dirname($marker), 0775, true);
        $lock = @fopen(storage_path('app/official.lock'), 'c');
        if (! $lock || ! flock($lock, LOCK_EX | LOCK_NB)) {
            return $result; // another request is already doing it
        }
        try {
            $user = User::where('email', self::EMAIL)->first();
            if (! $user) {
                $user = new User(['name' => 'Vyloxi', 'email' => self::EMAIL, 'password' => Str::random(64)]);
                $user->forceFill(['is_admin' => true, 'email_verified_at' => now()])->save();
            }
            $pub = Publisher::where('slug', 'vyloxi')->first();
            if (! $pub) {
                $pub = new Publisher(['slug' => 'vyloxi', 'name' => 'Vyloxi']);
                $pub->forceFill(['user_id' => $user->id, 'verified' => true])->save();
            }
            foreach ($files as $file) {
                try {
                    Publishing::publishRaw($user, (string) file_get_contents($file));
                    $result['published']++;
                } catch (InvalidArgumentException $e) {
                    str_contains($e->getMessage(), 'is not newer') ? $result['skipped']++ : $result['failed']++;
                    if (! str_contains($e->getMessage(), 'is not newer')) {
                        Log::warning('Official extension '.basename($file).': '.$e->getMessage());
                    }
                } catch (Throwable $e) {
                    $result['failed']++;
                    Log::warning('Official extension '.basename($file).': '.$e->getMessage());
                }
            }
            // A forced run (tests, a manual call) leaves the marker alone, so the next web request still checks.
            if ($result['failed'] === 0 && ! $force) {
                file_put_contents($marker, $sig);
            }
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }

        return $result;
    }
}
