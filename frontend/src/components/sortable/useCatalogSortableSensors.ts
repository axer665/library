"use client";

import { useEffect } from "react";
import {
  KeyboardSensor,
  PointerSensor,
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

/**
 * Сенсоры сортировки (ручка на карточке): мышь — PointerSensor, тач — TouchSensor.
 * TouchSensor.setup() нужен для iOS Safari (непассивный touchmove), см. @dnd-kit/core.
 */
export function useCatalogSortableSensors() {
  useEffect(() => acquireTouchSensorSetup(), []);

  return useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
}
