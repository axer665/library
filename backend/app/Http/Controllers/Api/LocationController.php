<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Archive;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LocationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Загружаем локации с архивами. А `books` подгружаем вручную для первых 3 архивов.
        // Проблема текущего eager-load: `with(['archives.books' => ...->limit(...)])`
        // возвращает пустые `archive.books`, хотя в БД книги существуют.
        $locations = $request->user()->locations()
            ->withCount('archives')
            ->with(['archives' => fn ($q) => $q->orderBy('sort_order')->orderBy('id')])
            ->get();

        $locations->each(function (Location $location) {
            $archives = $location->archives->values();
            $topArchives = $archives->take(3)->values();

            foreach ($topArchives as $archive) {
                $archive->setRelation(
                    'books',
                    $archive->books()->orderBy('sort_order')->orderBy('id')->limit(5)->get()
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

    public function reorder(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ])['ids'];

        $user = $request->user();
        $saved = $user->locations()->pluck('id')->sort()->values()->all();
        $incoming = collect($ids)->sort()->values()->all();

        if ($saved !== $incoming) {
            return response()->json(['message' => 'Список id не совпадает с локациями пользователя'], 422);
        }

        DB::transaction(function () use ($user, $ids) {
            foreach ($ids as $position => $id) {
                $user->locations()->where('id', $id)->update(['sort_order' => $position]);
            }
        });

        return response()->json(['ok' => true]);
    }
}
