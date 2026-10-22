<?php

namespace App\Support;

use App\Models\Extension;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/** Searching and listing the published extensions. */
final class Catalog
{
    public const SORTS = ['installs' => 'Most installed', 'rating' => 'Best rated', 'new' => 'Newest', 'name' => 'Name'];

    public static function search(string $q = '', string $category = '', string $sort = 'installs', int $per = 20, int $page = 1): LengthAwarePaginator
    {
        $query = Extension::visible()->with('publisher');
        $q = trim($q);
        if ($q !== '') {
            $like = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($q)).'%';
            $query->where(function ($w) use ($like) {
                $w->whereRaw("LOWER(display_name) LIKE ? ESCAPE '!'", [$like])
                    ->orWhereRaw("LOWER(name) LIKE ? ESCAPE '!'", [$like])
                    ->orWhereRaw("LOWER(description) LIKE ? ESCAPE '!'", [$like])
                    ->orWhereHas('publisher', fn ($p) => $p->whereRaw("LOWER(slug) LIKE ? ESCAPE '!'", [$like]));
            });
        }
        if ($category !== '' && in_array($category, Bundle::CATEGORIES, true)) {
            $query->where('category', $category);
        }
        match ($sort) {
            'rating' => $query->orderByRaw('(CASE WHEN rating_count = 0 THEN 0 ELSE rating_sum * 1.0 / rating_count END) DESC')->orderByDesc('rating_count'),
            'new' => $query->orderByDesc('created_at'),
            'name' => $query->orderBy('display_name'),
            default => $query->orderByDesc('installs')->orderByDesc('updated_at'),
        };

        return $query->paginate(max(1, min(50, $per)), ['*'], 'page', max(1, $page));
    }

    public static function stats(): array
    {
        return [
            'extensions' => Extension::visible()->count(),
            'installs' => (int) Extension::sum('installs'),
            'publishers' => \App\Models\Publisher::count(),
        ];
    }

    /** The JSON the editor reads for a list row. */
    public static function row(Extension $e): array
    {
        return [
            'id' => $e->full_id,
            'publisher' => $e->publisher->slug,
            'publisherName' => $e->publisher->name,
            'verified' => $e->publisher->verified,
            'name' => $e->name,
            'displayName' => $e->display_name,
            'description' => $e->description,
            'category' => $e->category,
            'installs' => $e->installs,
            'rating' => $e->rating,
            'ratingCount' => $e->rating_count,
            'icon' => $e->has_icon ? '/api/v1/extensions/'.$e->full_id.'/icon' : null,
            'repository' => $e->repo_url,
            'updated' => $e->updated_at?->toIso8601String(),
        ];
    }
}
