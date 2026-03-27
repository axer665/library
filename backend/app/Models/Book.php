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

    public function archive(): BelongsTo
    {
        return $this->belongsTo(Archive::class);
    }
}
