<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Archive;
use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BookController extends Controller
{
    public function index(Request $request, int $archiveId): JsonResponse
    {
        $archive = Archive::whereHas('location', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($archiveId);

        $books = $archive->books()->get();

        return response()->json($books);
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
}
