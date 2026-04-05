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

    protected $fillable = ['user_id', 'name', 'sort_order'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function archives(): HasMany
    {
        return $this->hasMany(Archive::class)->orderBy('sort_order')->orderBy('id');
    }

    protected static function booted(): void
    {
        static::creating(function (Location $location) {
            $max = static::where('user_id', $location->user_id)->max('sort_order');
            $location->sort_order = $max === null ? 0 : ((int) $max) + 1;
        });

        static::deleting(function (Location $location) {
            foreach ($location->archives as $archive) {
                $archive->delete();
            }
        });
    }
}
