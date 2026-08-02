import { createSignal, For } from "solid-js";
import SegmentedControl from "./SegmentedControl";

type WordCount = 12 | 24;

type MnemonicInputProps = {
  onChange: (mnemonic: string) => void;
  disabled?: boolean;
};

export default function MnemonicInput(props: MnemonicInputProps) {
  const [wordCount, setWordCount] = createSignal<WordCount>(12);
  const [words, setWords] = createSignal<string[]>(Array(12).fill(""));

  const inputRefs: (HTMLInputElement | undefined)[] = [];

  const emit = (next: string[]) => {
    setWords(next);
    props.onChange(next.join(" ").trim());
  };

  const switchWordCount = (count: WordCount) => {
    setWordCount(count);
    setWords((current) => {
      const next = [...current];
      if (next.length < count) {
        while (next.length < count) next.push("");
      } else {
        next.length = count;
      }
      return next;
    });
  };

  const splitPasted = (text: string): string[] =>
    text.trim().split(/\s+/).filter(Boolean);

  const handlePaste = (index: number, event: ClipboardEvent) => {
    const pasted = splitPasted(event.clipboardData?.getData("text") ?? "");
    if (pasted.length <= 1) return;

    event.preventDefault();

    const count = wordCount();
    if (pasted.length > count) {
      if (pasted.length === 24 && count === 12) {
        switchWordCount(24);
        const next = [...words()];
        pasted.forEach((word, i) => {
          next[i] = word;
        });
        emit(next);
      }
      return;
    }

    let start = index;
    if (pasted.length === count || start + pasted.length > count) start = 0;

    const next = [...words()];
    pasted.forEach((word, i) => {
      next[start + i] = word;
    });
    emit(next);

    const nextEmpty = start + pasted.length;
    if (nextEmpty < count) inputRefs[nextEmpty]?.focus();
  };

  const handleKeyDown = (index: number, event: KeyboardEvent) => {
    if (event.code !== "Space") return;
    event.preventDefault();
    const value = (event.currentTarget as HTMLInputElement).value.trim();
    if (!value) return;
    const next = [...words()];
    next[index] = value;
    emit(next);
    if (index + 1 < wordCount()) inputRefs[index + 1]?.focus();
  };

  return (
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-4">
        <p class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
          Mnemonic
        </p>
        <SegmentedControl
          options={[
            { value: 12, label: "12" },
            { value: 24, label: "24" },
          ]}
          value={wordCount()}
          onChange={(count) => switchWordCount(count)}
          disabled={props.disabled}
        />
      </div>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        <For each={words()}>
          {(word, index) => (
            <div class="relative">
              <span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[0.6rem] font-bold tabular-nums text-b-ink/30">
                {String(index() + 1).padStart(2, "0")}
              </span>
              <input
                ref={(el) => (inputRefs[index()] = el)}
                type="text"
                value={word}
                autocomplete="off"
                autocapitalize="off"
                spellcheck={false}
                disabled={props.disabled}
                onInput={(e) => {
                  const next = [...words()];
                  next[index()] = e.currentTarget.value;
                  emit(next);
                }}
                onPaste={(e) => handlePaste(index(), e)}
                onKeyDown={(e) => handleKeyDown(index(), e)}
                class="h-10 w-full border border-b-border bg-b-paper pl-8 pr-2 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          )}
        </For>
      </div>

      <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
        Paste a full mnemonic into any field to fill it automatically.
      </p>
    </div>
  );
}
