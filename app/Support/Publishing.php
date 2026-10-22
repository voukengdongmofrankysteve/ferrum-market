<?php

namespace App\Support;

use App\Models\Extension;
use App\Models\ExtensionVersion;
use App\Models\Publisher;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use JsonException;

/** The rules for creating publishers, publishing versions and reviewing. Used by the website and the API. */
final class Publishing
{
    public const RESERVED = ['ferrum', 'admin', 'official', 'vyloxi', 'marketplace', 'support'];

    public static function createPublisher(User $user, string $slug, string $name): Publisher
    {
        $slug = strtolower(trim($slug));
        if (! preg_match('/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/', $slug)) {
            throw new InvalidArgumentException('The publisher id must be 3 to 40 characters: lower case letters, digits and dashes.');
        }
        if (in_array($slug, self::RESERVED, true) && ! $user->is_admin) {
            throw new InvalidArgumentException('That publisher id is reserved.');
        }
        if (Publisher::where('slug', $slug)->exists()) {
            throw new InvalidArgumentException('That publisher id is taken.');
        }
        if ($user->publishers()->count() >= 5) {
            throw new InvalidArgumentException('An account can have 5 publishers at most.');
        }

        return Publisher::create(['slug' => $slug, 'name' => mb_substr(trim($name) !== '' ? trim($name) : $slug, 0, 80), 'user_id' => $user->id]);
    }

    /** Validates raw package text and stores it as a new version. @return array{extension: Extension, version: string} */
    public static function publishRaw(User $user, string $raw): array
    {
        try {
            $json = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new InvalidArgumentException('The file is not valid JSON.');
        }
        $checked = Bundle::validate($json);
        $m = $checked['manifest'];

        $pub = Publisher::where('slug', $m['publisher'])->first();
        if (! $pub) {
            throw new InvalidArgumentException('The publisher "'.$m['publisher'].'" does not exist yet. Create it first.');
        }
        if ($pub->user_id !== $user->id && ! $user->is_admin) {
            throw new InvalidArgumentException('You do not own the publisher "'.$m['publisher'].'".');
        }
        $cat = $m['categories'][0] ?? 'Other';

        return DB::transaction(function () use ($pub, $m, $cat, $checked, $raw) {
            $ext = Extension::where('publisher_id', $pub->id)->where('name', $m['name'])->first();
            if ($ext) {
                $latest = $ext->latest();
                if ($latest && Version::compare($m['version'], $latest->version) <= 0) {
                    throw new InvalidArgumentException('Version '.$m['version'].' is not newer than the latest published version ('.$latest->version.').');
                }
                $ext->update(['display_name' => $m['displayName'], 'description' => $m['description'], 'category' => $cat, 'repo_url' => $m['repository'] ?? null, 'has_icon' => $checked['icon'] !== null, 'unpublished' => false]);
            } else {
                $ext = Extension::create(['publisher_id' => $pub->id, 'name' => $m['name'], 'display_name' => $m['displayName'], 'description' => $m['description'], 'category' => $cat, 'repo_url' => $m['repository'] ?? null, 'has_icon' => $checked['icon'] !== null]);
            }
            $v = ExtensionVersion::create(['extension_id' => $ext->id, 'version' => $m['version'], 'manifest' => $m, 'readme' => $checked['readme'], 'changelog' => $checked['changelog'], 'size' => $checked['size'], 'permissions' => implode(',', (array) ($m['permissions'] ?? []))]);
            Storage::disk('local')->put($v->bundlePath(), $raw);
            if ($checked['icon'] !== null) {
                Storage::disk('local')->put('icons/'.$ext->id.'.png', $checked['icon']);
            }

            return ['extension' => $ext, 'version' => $m['version']];
        });
    }

    public static function review(Extension $ext, User $user, int $stars, string $body): void
    {
        if ($stars < 1 || $stars > 5) {
            throw new InvalidArgumentException('Give 1 to 5 stars.');
        }
        $body = trim($body);
        if (mb_strlen($body) > 1000) {
            throw new InvalidArgumentException('A review is 1000 characters at most.');
        }
        DB::transaction(function () use ($ext, $user, $stars, $body) {
            $old = Review::where('extension_id', $ext->id)->where('user_id', $user->id)->first();
            if ($old) {
                $ext->decrement('rating_sum', $old->stars);
                $old->update(['stars' => $stars, 'body' => $body]);
            } else {
                Review::create(['extension_id' => $ext->id, 'user_id' => $user->id, 'stars' => $stars, 'body' => $body]);
                $ext->increment('rating_count');
            }
            $ext->increment('rating_sum', $stars);
        });
    }
}
