<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Archive;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArchiveController extends Controller
{
    public function index(Request $request, int $locationId): JsonResponse
    {
        $location = $request->user()->locations()->findOrFail($locationId);
        $archives = $location->archives()->withCount('books')->get();

        return response()->json($archives);
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
}
