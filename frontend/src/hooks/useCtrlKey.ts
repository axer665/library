"use client";

import { useEffect } from "react";

/** Добавляет класс "ctrl-pressed" на documentElement при зажатом Ctrl/Cmd */
export function useCtrlKey() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") {
        document.documentElement.classList.add("ctrl-pressed");
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") {
        document.documentElement.classList.remove("ctrl-pressed");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.documentElement.classList.remove("ctrl-pressed");
    };
  }, []);
}
