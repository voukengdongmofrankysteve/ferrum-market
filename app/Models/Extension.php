<?php

namespace App\Models;

use App\Support\Version;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Extension extends Model
{
    protected $guarded = [];

    protected $casts = ['unpublished' => 'boolean', 'has_icon' => 'boolean'];

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(Publisher::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(ExtensionVersion::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function scopeVisible(Builder $q): Builder
    {
        return $q->where('unpublished', false);
    }

    /** publisher.name: the identifier people type and the editor stores. */
    public function getFullIdAttribute(): string
    {
        return $this->publisher->slug.'.'.$this->name;
    }

    public function getRatingAttribute(): ?float
    {
        return $this->rating_count ? round($this->rating_sum / $this->rating_count, 2) : null;
    }

    /** Versions, newest first, by version number (not by upload time). */
    public function sortedVersions()
    {
        return $this->versions->sort(fn ($a, $b) => Version::compare($b->version, $a->version))->values();
    }

    public function latest(): ?ExtensionVersion
    {
        return $this->sortedVersions()->first();
    }
}
