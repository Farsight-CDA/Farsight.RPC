import type { JSX } from "solid-js";

type BackdropHandlers = Pick<
  JSX.HTMLAttributes<HTMLDivElement>,
  "onMouseDown" | "onMouseUp"
>;

export function createModalBackdropHandlers(
  onClose: () => void,
): BackdropHandlers {
  let shouldCloseOnMouseUp = false;

  return {
    onMouseDown: (event: MouseEvent & {
      currentTarget: HTMLDivElement;
      target: EventTarget | null;
    }) => {
      shouldCloseOnMouseUp = event.target === event.currentTarget;
    },
    onMouseUp: (event: MouseEvent & {
      currentTarget: HTMLDivElement;
      target: EventTarget | null;
    }) => {
      const shouldClose =
        shouldCloseOnMouseUp && event.target === event.currentTarget;
      shouldCloseOnMouseUp = false;
      if (shouldClose) onClose();
    },
  };
}
