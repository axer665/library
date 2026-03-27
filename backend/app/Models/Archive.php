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

    protected $fillable = ['location_id', 'name'];

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function books(): HasMany
    {
        return $this->hasMany(Book::class);
    }

    protected static function booted(): void
    {
        static::deleting(function (Archive $archive) {
            foreach ($archive->books as $book) {
                $book->delete();
            }
        });
    }
}
