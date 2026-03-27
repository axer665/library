<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['user_id', 'name'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function archives(): HasMany
    {
        return $this->hasMany(Archive::class);
    }

    protected static function booted(): void
    {
        static::deleting(function (Location $location) {
            foreach ($location->archives as $archive) {
                $archive->delete();
            }
        });
    }
}
