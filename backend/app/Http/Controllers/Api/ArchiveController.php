<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\PaginatedReorder;
use App\Http\Controllers\Controller;
use App\Models\Archive;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ArchiveController extends Controller
{
    use PaginatedReorder;

    public function index(Request $request, int $locationId): JsonResponse
    {
        $location = $request->user()->locations()->findOrFail($locationId);

        if ($request->boolean('compact')) {
            $archives = $location->archives()->orderBy('sort_order')->orderBy('id')->get(['id', 'name']);

            return response()->json($archives);
        }

        $perPage = min(max((int) $request->get('per_page', 24), 1), 100);
        $paginated = $location->archives()->withCount('books')->orderBy('sort_order')->orderBy('id')->paginate($perPage);

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

    public function store(Request $request, int $locationId): JsonResponse
    {
        $location = $request->user()->locations()->findOrFail($locationId);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $archive = $location->archives()->create($validated);

        return response()->json($archive, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $archive = Archive::whereHas('location', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'location_id' => 'sometimes|exists:locations,id',
        ]);

        if (isset($validated['location_id'])) {
            $location = $request->user()->locations()->findOrFail($validated['location_id']);
            $archive->location_id = $location->id;
            $max = Archive::where('location_id', $location->id)
                ->where('id', '!=', $archive->id)
                ->max('sort_order');
            $archive->sort_order = $max === null ? 0 : ((int) $max) + 1;
        }

        if (isset($validated['name'])) {
            $archive->name = $validated['name'];
        }

        $archive->save();

        return response()->json($archive);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $archive = Archive::whereHas('location', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        $archive->books()->delete();
        $archive->delete();

        return response()->json(['message' => 'Архив удалён']);
    }

    public function reorder(Request $request, int $locationId): JsonResponse
    {
        $location = $request->user()->locations()->findOrFail($locationId);

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
            $allIds = $location->archives()->orderBy('sort_order')->orderBy('id')->pluck('id')->all();
            $merged = $this->mergePartialReorder($allIds, $page, $perPage, $ids);
        } else {
            $saved = $location->archives()->pluck('id')->sort()->values()->all();
            $incoming = collect($ids)->sort()->values()->all();

            if ($saved !== $incoming) {
                return response()->json(['message' => 'Список id не совпадает с архивами локации'], 422);
            }
            $merged = $ids;
        }

        DB::transaction(function () use ($location, $merged) {
            foreach ($merged as $position => $id) {
                $location->archives()->where('id', $id)->update(['sort_order' => $position]);
            }
        });

        return response()->json(['ok' => true]);
    }
}
