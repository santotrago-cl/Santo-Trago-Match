"use client";

import { useState } from "react";

const PLACEHOLDER = "Somos 4 y queremos algo tropical con $20.000.";

const EXAMPLES = [
  "Somos 4 y queremos algo tropical.",
  "Tenemos $20.000 y queremos algo refrescante.",
  "Quiero algo dulce para compartir.",
];

type Props = {
  onSubmit: (text: string) => void;
  loading: boolean;
  /** Placeholder de pregunta de seguimiento cuando faltan datos. */
  followUp?: string | null;
};

export function QueryInput({ onSubmit, loading, followUp }: Props) {
  const [text, setText] = useState("");

  const submit = () => {
    const value = text.trim();
    if (!value || loading) return;
    onSubmit(value);
    setText("");
  };

  return (
    <div className="w-full">
      <textarea
        className="input-main w-full px-4 py-3.5 text-base resize-none min-h-[96px]"
        placeholder={followUp ?? PLACEHOLDER}
        value={text}
        maxLength={500}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
        aria-label="Describe lo que buscas"
      />

      {!followUp && (
        <div className="flex flex-wrap gap-2 mt-2.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setText(ex)}
              className="chip cursor-pointer hover:opacity-80"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={loading || text.trim().length === 0}
        className="btn-primary w-full mt-3 py-3.5 text-base"
      >
        {loading ? "Buscando…" : "Encontrar mi Santo Match"}
      </button>
    </div>
  );
}
