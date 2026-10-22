<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * A packaged extension (.fext) is one JSON file:
 *   { "format": 1, "manifest": { ... }, "files": { "path": { "encoding": "utf8"|"base64", "content": "..." } } }
 * This class checks one before the marketplace accepts it.
 */
final class Bundle
{
    public const CATEGORIES = ['Themes', 'Languages', 'Snippets', 'Formatters', 'Linters', 'Git', 'AI', 'Tools', 'Productivity', 'Other'];

    public const PERMISSIONS = ['workspace.read', 'workspace.write', 'terminal', 'network', 'clipboard'];

    public const CONTRIBUTES = ['commands', 'keybindings', 'themes', 'iconThemes', 'languages', 'snippets', 'configuration', 'viewsContainers', 'views'];

    public const ACTIVATION = ['onStartup', 'onCommand', 'onLanguage', 'onFileOpen', 'onSave', 'onView'];

    public const MAX_BYTES = 1_500_000;

    public const MAX_FILES = 200;

    /** @return array{manifest: array, files: array<string,string>, readme: string, changelog: string, size: int, icon: ?string} */
    public static function validate(mixed $b): array
    {
        $fail = fn (string $m) => throw new InvalidArgumentException($m);
        if (! is_array($b) || ($b['format'] ?? null) !== 1 || ! is_array($b['manifest'] ?? null) || ! is_array($b['files'] ?? null)) {
            $fail('This is not a Ferrum extension package (format 1). Build it with "ferrum-ext package".');
        }
        $m = $b['manifest'];
        $name = (string) ($m['name'] ?? '');
        if (! preg_match('/^[a-z0-9][a-z0-9-]{1,48}$/', $name)) {
            $fail('manifest.name must be 2 to 49 characters: lower case letters, digits and dashes.');
        }
        if (! preg_match('/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/', (string) ($m['publisher'] ?? ''))) {
            $fail('manifest.publisher must be 3 to 40 characters: lower case letters, digits and dashes.');
        }
        if (! Version::valid((string) ($m['version'] ?? ''))) {
            $fail('manifest.version must look like 1.2.3 (a prerelease like 1.2.3-beta.1 is allowed).');
        }
        $display = trim((string) ($m['displayName'] ?? ''));
        if ($display === '' || mb_strlen($display) > 80) {
            $fail('manifest.displayName is required (80 characters at most).');
        }
        $desc = trim((string) ($m['description'] ?? ''));
        if ($desc === '' || mb_strlen($desc) > 280) {
            $fail('manifest.description is required (280 characters at most).');
        }
        if (! preg_match('/^[\^~>=<]*\d+\.\d+\.\d+$/', (string) ($m['engines']['ferrum'] ?? ''))) {
            $fail('manifest.engines.ferrum is required, for example "^0.1.0".');
        }
        $cat = (string) ($m['categories'][0] ?? 'Other');
        if (! in_array($cat, self::CATEGORIES, true)) {
            $fail('manifest.categories[0] must be one of: '.implode(', ', self::CATEGORIES).'.');
        }
        foreach ((array) ($m['permissions'] ?? []) as $p) {
            if (! in_array($p, self::PERMISSIONS, true)) {
                $fail('Unknown permission "'.(is_string($p) ? $p : '?').'". Allowed: '.implode(', ', self::PERMISSIONS).'.');
            }
        }
        foreach (array_keys((array) ($m['contributes'] ?? [])) as $k) {
            if (! in_array($k, self::CONTRIBUTES, true)) {
                $fail('Unknown contribution point "'.$k.'". Allowed: '.implode(', ', self::CONTRIBUTES).'.');
            }
        }
        foreach ((array) ($m['activationEvents'] ?? []) as $ev) {
            if (! is_string($ev) || ! in_array(explode(':', $ev, 2)[0], self::ACTIVATION, true)) {
                $fail('Unknown activation event "'.(is_string($ev) ? $ev : '?').'". Allowed: '.implode(', ', self::ACTIVATION).'.');
            }
        }
        $repo = (string) ($m['repository'] ?? '');
        if ($repo !== '' && ! str_starts_with($repo, 'https://')) {
            $fail('manifest.repository must be an https address.');
        }

        $files = [];
        $total = 0;
        if (count($b['files']) > self::MAX_FILES) {
            $fail('A package may hold at most '.self::MAX_FILES.' files.');
        }
        foreach ($b['files'] as $path => $f) {
            $path = (string) $path;
            if ($path === '' || strlen($path) > 200 || str_contains($path, '..') || str_contains($path, '\\') || $path[0] === '/' || preg_match('/[\x00-\x1f]/', $path)) {
                $fail('Unsafe file path in the package: '.substr($path, 0, 60));
            }
            if (! is_array($f) || ! is_string($f['content'] ?? null) || ! in_array($f['encoding'] ?? '', ['utf8', 'base64'], true)) {
                $fail('File "'.$path.'" must have an encoding (utf8 or base64) and a content string.');
            }
            $raw = $f['encoding'] === 'base64' ? base64_decode($f['content'], true) : $f['content'];
            if ($raw === false) {
                $fail('File "'.$path.'" is not valid base64.');
            }
            $total += strlen($raw);
            if ($total > self::MAX_BYTES) {
                $fail('The package is larger than '.round(self::MAX_BYTES / 1e6, 1).' MB once unpacked.');
            }
            $files[$path] = $raw;
        }
        $main = (string) ($m['main'] ?? '');
        if ($main !== '' && ! isset($files[$main])) {
            $fail('manifest.main points to "'.$main.'", which is not in the package.');
        }
        foreach ((array) ($m['contributes']['languages'] ?? []) as $l) {
            $id = is_array($l) ? (string) ($l['id'] ?? '') : '';
            if (! preg_match('/^[a-z0-9][a-z0-9-]{0,30}$/', $id)) {
                $fail('Each contributes.languages entry needs an id of lower case letters, digits and dashes.');
            }
            if (isset($l['grammar']) && ! isset($files[$l['grammar']])) {
                $fail('contributes.languages grammar points to "'.$l['grammar'].'", which is not in the package.');
            }
        }
        foreach ((array) ($m['contributes']['commands'] ?? []) as $c) {
            if (! is_array($c) || ! preg_match('/^[A-Za-z0-9._-]{3,80}$/', (string) ($c['command'] ?? '')) || trim((string) ($c['title'] ?? '')) === '') {
                $fail('Each contributes.commands entry needs a "command" id (letters, digits, dots) and a "title".');
            }
        }
        $boxes = (array) ($m['contributes']['viewsContainers'] ?? []);
        if (count($boxes) > 3) {
            $fail('contributes.viewsContainers can have 3 entries at most.');
        }
        $boxIds = [];
        foreach ($boxes as $b) {
            $bid = is_array($b) ? (string) ($b['id'] ?? '') : '';
            if (! preg_match('/^[a-z0-9][a-z0-9-]{0,40}$/', $bid)) {
                $fail('Each contributes.viewsContainers entry needs an id of lower case letters, digits and dashes.');
            }
            $title = is_array($b) ? trim((string) ($b['title'] ?? '')) : '';
            if ($title === '' || mb_strlen($title) > 30) {
                $fail('Each contributes.viewsContainers entry needs a title of 30 characters at most.');
            }
            if (is_array($b) && isset($b['icon']) && ! preg_match('/^[a-z0-9-]{1,40}$/', (string) $b['icon'])) {
                $fail('A viewsContainers icon is a Codicon name such as "checklist".');
            }
            $boxIds[] = $bid;
        }
        $viewList = (array) ($m['contributes']['views'] ?? []);
        if (count($viewList) > 6) {
            $fail('contributes.views can have 6 entries at most.');
        }
        foreach ($viewList as $v) {
            $vid = is_array($v) ? (string) ($v['id'] ?? '') : '';
            if (! preg_match('/^[A-Za-z0-9._-]{3,80}$/', $vid)) {
                $fail('Each contributes.views entry needs an id of 3 to 80 letters, digits, dots, dashes or underscores.');
            }
            $vname = is_array($v) ? trim((string) ($v['name'] ?? '')) : '';
            if ($vname === '' || mb_strlen($vname) > 40) {
                $fail('Each contributes.views entry needs a name of 40 characters at most.');
            }
            if (! is_array($v) || ! in_array((string) ($v['container'] ?? ''), $boxIds, true)) {
                $fail('contributes.views "'.$vid.'" points to a container that is not in contributes.viewsContainers.');
            }
            if (is_array($v) && isset($v['type']) && ! in_array($v['type'], ['tree', 'html'], true)) {
                $fail('A view type is "tree" or "html".');
            }
        }
        foreach (['themes', 'iconThemes', 'snippets'] as $point) {
            foreach ((array) ($m['contributes'][$point] ?? []) as $c) {
                $p = is_array($c) ? ($c['path'] ?? null) : null;
                if ($p !== null && ! isset($files[$p])) {
                    $fail('contributes.'.$point.' points to "'.$p.'", which is not in the package.');
                }
            }
        }
        $icon = null;
        $iconPath = (string) ($m['icon'] ?? '');
        if ($iconPath !== '') {
            if (! isset($files[$iconPath]) || strlen($files[$iconPath]) > 200_000 || ! str_starts_with($files[$iconPath], "\x89PNG")) {
                $fail('manifest.icon must be a PNG file in the package, 200 KB at most.');
            }
            $icon = $files[$iconPath];
        }

        return [
            'manifest' => $m,
            'files' => $files,
            'readme' => (string) ($files['README.md'] ?? ''),
            'changelog' => (string) ($files['CHANGELOG.md'] ?? ''),
            'size' => $total,
            'icon' => $icon,
        ];
    }
}
