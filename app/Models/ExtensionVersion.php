<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExtensionVersion extends Model
{
    protected $guarded = [];

    protected $casts = ['manifest' => 'array'];

    public function extension(): BelongsTo
    {
        return $this->belongsTo(Extension::class);
    }

    public function bundlePath(): string
    {
        return 'bundles/'.$this->id.'.fext';
    }

    public function permissionList(): array
    {
        return $this->permissions === '' ? [] : explode(',', $this->permissions);
    }
}
