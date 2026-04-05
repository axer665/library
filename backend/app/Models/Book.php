<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Book extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'archive_id',
        'sort_order',
        'author',
        'title',
        'publisher',
        'annotation',
        'year',
        'photo_path',
    ];

    protected $casts = [
        'year' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Book $book) {
            $max = static::where('archive_id', $book->archive_id)->max('sort_order');
            $book->sort_order = $max === null ? 0 : ((int) $max) + 1;
        });
    }

    public function archive(): BelongsTo
    {
        return $this->belongsTo(Archive::class);
    }
}
