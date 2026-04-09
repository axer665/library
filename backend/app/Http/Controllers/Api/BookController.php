<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\PaginatedReorder;
use App\Http\Controllers\Controller;
use App\Models\Archive;
use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BookController extends Controller
{
    use PaginatedReorder;

    public function index(Request $request, int $archiveId): JsonResponse
    {
        $archive = Archive::whereHas('location', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($archiveId);

        $perPage = min(max((int) $request->get('per_page', 24), 1), 100);
        $paginated = $archive->books()->orderBy('sort_order')->orderBy('id')->paginate($perPage);

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

    public function store(Request $request, int $archiveId): JsonResponse
    {
        $archive = Archive::whereHas('location', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($archiveId);

        $validated = $request->validate([
            'author' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'publisher' => 'required|string|max:255',
            'annotation' => 'nullable|string',
            'year' => 'nullable|integer|min:1000|max:2100',
        ]);

        $book = $archive->books()->create($validated);

        return response()->json($book, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $book = Book::whereHas('archive.location', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        return response()->json($book);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $book = Book::whereHas('archive.location', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        $validated = $request->validate([
            'author' => 'sometimes|string|max:255',
            'title' => 'sometimes|string|max:255',
            'publisher' => 'sometimes|string|max:255',
            'annotation' => 'nullable|string',
            'year' => 'nullable|integer|min:1000|max:2100',
            'archive_id' => 'sometimes|exists:archives,id',
        ]);

        if (isset($validated['archive_id'])) {
            $archive = Archive::whereHas('location', fn ($q) => $q->where('user_id', $request->user()->id))
                ->findOrFail($validated['archive_id']);
            $book->archive_id = $archive->id;
            $max = Book::where('archive_id', $archive->id)
                ->where('id', '!=', $book->id)
                ->max('sort_order');
            $book->sort_order = $max === null ? 0 : ((int) $max) + 1;
            unset($validated['archive_id']);
        }

        $book->fill($validated);
        $book->save();

        return response()->json($book);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $book = Book::whereHas('archive.location', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        if ($book->photo_path) {
            Storage::disk('public')->delete($book->photo_path);
        }

        $book->delete();

        return response()->json(['message' => 'Книга удалена']);
    }

    public function uploadPhoto(Request $request, int $id): JsonResponse
    {
        $book = Book::whereHas('archive.location', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        if ($book->photo_path) {
            Storage::disk('public')->delete($book->photo_path);
        }

        $path = $request->file('photo')->store('books', 'public');
        $book->update(['photo_path' => $path]);

        return response()->json($book);
    }

    public function reorder(Request $request, int $archiveId): JsonResponse
    {
        $archive = Archive::whereHas('location', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($archiveId);

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:100',
        ]);

        $ids = $validated['ids'];

        if (isset($validated['page'])) {
            $page = (int) $validated['page'];
            $perPage = (int) ($validated['per_page'] ?? 24);
            $allIds = $archive->books()->orderBy('sort_order')->orderBy('id')->pluck('id')->all();
            $merged = $this->mergePartialReorder($allIds, $page, $perPage, $ids);
        } else {
            $saved = $archive->books()->pluck('id')->sort()->values()->all();
            $incoming = collect($ids)->sort()->values()->all();

            if ($saved !== $incoming) {
                return response()->json(['message' => 'Список id не совпадает с книгами архива'], 422);
            }
            $merged = $ids;
        }

        DB::transaction(function () use ($archive, $merged) {
            foreach ($merged as $position => $id) {
                $archive->books()->where('id', $id)->update(['sort_order' => $position]);
            }
        });

        return response()->json(['ok' => true]);
    }
}
