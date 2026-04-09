# Сортировка карточек на таче (dnd-kit)

Краткая памятка, почему устроено именно так: сенсоры, `touch-action`, скролл в `overflow-auto` и класс `catalog-dnd-dragging`.

## Цель

- На **таче**: долгое удержание пальца почти без движения → затем перетаскивание для смены порядка; обычный свайп в основном должен **скроллить** список.
- На **мыши**: перетаскивание после смещения на несколько пикселей.

## Сенсоры (`useCatalogSortableSensors.ts`)

1. **`TouchSensor`** с `activationConstraint: { delay, tolerance }`  
   Задержка (`CATALOG_TOUCH_HOLD_MS`) и допуск смещения (`CATALOG_TOUCH_HOLD_TOLERANCE_PX`) отделяют «удержание для сортировки» от «начали вести = скролл».

2. **`MouseSensor`** (не **`PointerSensor`**) для мыши  
   В [документации Pointer Sensor](https://docs.dndkit.com/api-documentation/sensors/pointer#touch-action) указано: для **pointer events** на таче без подходящего `touch-action` скролл часто **нельзя** надёжно отменить только через `preventDefault` в JS. Рекомендуемая связка для списков — **Mouse + Touch**, а не Pointer + Touch.  
   Иначе тач может идти по цепочке Pointer Events, и родитель с `overflow: auto` продолжает забирать жест.

3. **`TouchSensor.setup()`**  
   Регистрирует непассивный `touchmove` на `window` — требование для корректного `preventDefault` в Safari (iOS), см. исходники `@dnd-kit/core`.

4. **`KeyboardSensor`** — доступность с клавиатуры.

## Почему `touch-action` на обёртке карточки мало что давал

`TouchSensor` наследует `AbstractPointerSensor`: слушатели **`touchmove` / `touchend`** вешаются на **`getEventListenerTarget(event.target)`**, то есть на **элемент, на который пришёлся палец** (часто внутренний блок карточки: лицо, текст), а не обязательно на внешний `div` с `ref={setNodeRef}`.

У потомков по умолчанию `touch-action: auto`. Классы вроде `touch-pan-y` **только на обёртке** не меняют поведение того узла, который реально является `target` касания — скролл контейнера и конфликт с drag остаются.

## Текущая схема (coarse pointer)

1. **`SortableCardItem`** при `(pointer: coarse)` получает классы `sortable-card-item` и `sortable-card-item--coarse-touch`.

2. В **`globals.css`**:
   - для `.sortable-card-item--coarse-touch` и **всех потомков** задаётся `touch-action: pan-y` — вертикальный скролл списка до/вне активного drag там, где это уместно;
   - пока идёт drag, на `<html>` вешается класс **`catalog-dnd-dragging`** (см. ниже), и для тех же элементов включается `touch-action: none !important`, чтобы **скролл родителя не перехватывал** жест перетаскивания.

3. **`CatalogSortableDragTouchLock`** внутри каждого `DndContext` (списки локаций / архивов / книг) через **`useDndMonitor`** на `onDragStart` / `onDragEnd` / `onDragCancel` добавляет и снимает `catalog-dnd-dragging` с `document.documentElement`; при размонтировании класс тоже снимается (`useEffect` cleanup).

## Файлы

| Файл | Роль |
|------|------|
| `useCatalogSortableSensors.ts` | Константы задержки/допуска, сенсоры, ref-count для `TouchSensor.setup()` |
| `SortableCardItem.tsx` | `useSortable`, классы для тача, кольцо при drag |
| `CatalogSortableDragTouchLock.tsx` | Класс `catalog-dnd-dragging` на время drag |
| `globals.css` | Правила `touch-action` для `.sortable-card-item--coarse-touch` |
| `LocationList.tsx`, `ArchiveList.tsx`, `BookList.tsx` | `DndContext` + `CatalogSortableDragTouchLock` |

## Подстройка

Если сортировка на телефоне слишком чувствительная или, наоборот, трудно активируется — меняйте **`CATALOG_TOUCH_HOLD_MS`** и **`CATALOG_TOUCH_HOLD_TOLERANCE_PX`** в `useCatalogSortableSensors.ts`.

## Ссылки

- [Touch Sensor (dnd-kit)](https://docs.dndkit.com/api-documentation/sensors/touch)  
- [Pointer Sensor — touch-action](https://docs.dndkit.com/api-documentation/sensors/pointer#touch-action)  
- [Issue #272 — scroll + sortable на мобильных](https://github.com/clauderic/dnd-kit/issues/272)  
