"use client";

import { useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";

export function UserInputBar({
  onSubmit,
  disabled,
  isYourTurnCue,
  extraControls,
}: {
  onSubmit: (content: string) => void;
  disabled: boolean;
  isYourTurnCue: boolean;
  extraControls?: React.ReactNode;
}) {
  const [value, setValue] = useState("");

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-border bg-surface px-5 py-3.5">
      {isYourTurnCue && (
        <p className="text-xs text-accent font-medium mb-2 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent speaking-dot" />
          The floor is open — this is a good moment to jump in.
        </p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type what you'd say in the discussion…"
          className="flex-1 resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm leading-relaxed max-h-32 focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {extraControls}
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="h-10 w-10 shrink-0 rounded-lg bg-navy text-white flex items-center justify-center disabled:opacity-40"
          aria-label="Speak"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
