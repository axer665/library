<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookSearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $query = Book::query()
            ->whereHas('archive.location', fn ($q) => $q->where('user_id', $request->user()->id));

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($qb) use ($q) {
                $qb->where('author', 'ilike', "%{$q}%")
                    ->orWhere('title', 'ilike', "%{$q}%")
                    ->orWhere('publisher', 'ilike', "%{$q}%")
                    ->orWhere('annotation', 'ilike', "%{$q}%");
            });
        }

        if ($request->filled('author')) {
            $query->where('author', 'ilike', '%'.$request->author.'%');
        }
        if ($request->filled('title')) {
            $query->where('title', 'ilike', '%'.$request->title.'%');
        }
        if ($request->filled('publisher')) {
            $query->where('publisher', 'ilike', '%'.$request->publisher.'%');
        }
        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        if ($request->has('has_photo')) {
            if ((int) $request->has_photo === 1) {
                $query->whereNotNull('photo_path')->where('photo_path', '!=', '');
            } else {
                $query->where(function ($q) {
                    $q->whereNull('photo_path')->orWhere('photo_path', '');
                });
            }
        }

        if ($request->filled('location_id')) {
            $query->whereHas('archive', fn ($q) => $q->where('location_id', $request->location_id));
        }
        if ($request->filled('archive_id')) {
            $query->where('archive_id', $request->archive_id);
        }

        $perPage = min(max((int) $request->get('per_page', 12), 1), 50);
        $paginated = $query->with('archive.location')->orderBy('title')->paginate($perPage);

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }
}
