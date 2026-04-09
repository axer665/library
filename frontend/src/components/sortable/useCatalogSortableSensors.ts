"use client";

import { useEffect } from "react";
import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

let touchSetupRefCount = 0;
let touchSetupTeardown: (() => void) | undefined;

function acquireTouchSensorSetup() {
  if (touchSetupRefCount === 0) {
    touchSetupTeardown = TouchSensor.setup();
  }
  touchSetupRefCount += 1;
  return () => {
    touchSetupRefCount -= 1;
    if (touchSetupRefCount <= 0) {
      touchSetupTeardown?.();
      touchSetupTeardown = undefined;
      touchSetupRefCount = 0;
    }
  };
}

/** Удержание (мс) и допуск смещения (px) для тача: вне этих пределов жест = скролл, не drag. */
export const CATALOG_TOUCH_HOLD_MS = 380;
export const CATALOG_TOUCH_HOLD_TOLERANCE_PX = 12;

/**
 * Тач: удержание ~CATALOG_TOUCH_HOLD_MS без сдвига > tolerance — затем можно вести (сортировка).
 * Мышь: MouseSensor (не PointerSensor) — иначе тач идёт в Pointer Events и без touch-action:none
 * скролл перехватывается так, что preventDefault на touchmove не спасает (см. доки dnd-kit).
 */
export function useCatalogSortableSensors() {
  useEffect(() => acquireTouchSensorSetup(), []);

  return useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: CATALOG_TOUCH_HOLD_MS,
        tolerance: CATALOG_TOUCH_HOLD_TOLERANCE_PX,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
}
