import { createEffect, onCleanup, type Accessor } from "solid-js";

export function useEscapeKey(isOpen: Accessor<boolean>, onEscape: () => void) {
  createEffect(() => {
    if (!isOpen()) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      onEscape();
    };

    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });
}
