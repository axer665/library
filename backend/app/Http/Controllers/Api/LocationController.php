<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Archive;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Загружаем локации с архивами. А `books` подгружаем вручную для первых 3 архивов.
        // Проблема текущего eager-load: `with(['archives.books' => ...->limit(...)])`
        // возвращает пустые `archive.books`, хотя в БД книги существуют.
        $locations = $request->user()->locations()
            ->withCount('archives')
            ->with(['archives' => fn ($q) => $q->orderByDesc('id')])
            ->get();

        $locations->each(function (Location $location) {
            $archives = $location->archives->sortByDesc('id')->values();
            $topArchives = $archives->take(3)->values();

            foreach ($topArchives as $archive) {
                $archive->setRelation(
                    'books',
                    $archive->books()->orderByDesc('id')->limit(5)->get()
                );
            }

            $location->setRelation('archives', $topArchives);
        });

        return response()->json($locations);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $location = $request->user()->locations()->create($validated);

        return response()->json($location, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $location = $request->user()->locations()->with('archives.books')->findOrFail($id);

        return response()->json($location);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $location = $request->user()->locations()->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $location->update($validated);

        return response()->json($location);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $location = $request->user()->locations()->findOrFail($id);

        foreach ($location->archives as $archive) {
            $archive->books()->delete();
        }
        $location->archives()->delete();
        $location->delete();

        return response()->json(['message' => 'Локация удалена']);
    }
}
