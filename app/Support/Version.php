<?php

namespace App\Support;

/** Version numbers: 1.2.3 with an optional prerelease such as 1.2.3-beta.1. */
final class Version
{
    public static function valid(string $v): bool
    {
        return (bool) preg_match('/^\d{1,6}\.\d{1,6}\.\d{1,6}(-[0-9A-Za-z.-]{1,20})?$/', $v);
    }

    /** -1, 0 or 1. A release is newer than its own prerelease. */
    public static function compare(string $a, string $b): int
    {
        $pa = explode('-', $a, 2);
        $pb = explode('-', $b, 2);
        $c = array_map('intval', explode('.', $pa[0])) <=> array_map('intval', explode('.', $pb[0]));
        if ($c !== 0) {
            return $c;
        }
        $ra = $pa[1] ?? null;
        $rb = $pb[1] ?? null;
        if ($ra === $rb) {
            return 0;
        }
        if ($ra === null) {
            return 1;
        }
        if ($rb === null) {
            return -1;
        }

        return strnatcmp($ra, $rb) <=> 0;
    }
}
