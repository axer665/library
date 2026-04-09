<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Validation\ValidationException;

trait PaginatedReorder
{
    /**
     * Вставить новый порядок элементов текущей «страницы» в общий упорядоченный список id.
     *
     * @param  array<int, int>  $allIds
     * @param  array<int, int>  $newPageOrder
     * @return array<int, int>
     */
    protected function mergePartialReorder(array $allIds, int $page, int $perPage, array $newPageOrder): array
    {
        $start = max(0, ($page - 1) * $perPage);
        $pageSlice = array_slice($allIds, $start, $perPage);
        $len = count($pageSlice);
        if ($len !== count($newPageOrder)) {
            throw ValidationException::withMessages([
                'ids' => ['Неверное число элементов на странице'],
            ]);
        }
        $a = $pageSlice;
        $b = $newPageOrder;
        sort($a);
        sort($b);
        if ($a !== $b) {
            throw ValidationException::withMessages([
                'ids' => ['Набор id не совпадает со страницей'],
            ]);
        }

        return array_merge(
            array_slice($allIds, 0, $start),
            $newPageOrder,
            array_slice($allIds, $start + $len)
        );
    }
}
