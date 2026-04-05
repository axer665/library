<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Archive extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['location_id', 'name', 'sort_order'];

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function books(): HasMany
    {
        return $this->hasMany(Book::class)->orderBy('sort_order')->orderBy('id');
    }

    protected static function booted(): void
    {
        static::creating(function (Archive $archive) {
            $max = static::where('location_id', $archive->location_id)->max('sort_order');
            $archive->sort_order = $max === null ? 0 : ((int) $max) + 1;
        });

        static::deleting(function (Archive $archive) {
            foreach ($archive->books as $book) {
                $book->delete();
            }
        });
    }
}
