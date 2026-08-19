"use client";

import { useState } from "react";
import { Hero } from "@/components/Hero";
import { QueryInput } from "@/components/QueryInput";
import { Recommendation } from "@/components/Recommendation";
import { AdjustButtons } from "@/components/AdjustButtons";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { LoadingState, ErrorState, InfoBubble } from "@/components/Feedback";
import type {
  Adjustment,
  Intent,
  Recommendation as Rec,
  RecommendApiResponse,
} from "@/types";

const GENERIC_ERROR =
  "Algo salió mal. Inténtalo de nuevo en un momento 🙏";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState<string | null>(null);

  const [knownIntent, setKnownIntent] = useState<Intent | null>(null);
  const [rec, setRec] = useState<Rec | null>(null);
  const [recIntent, setRecIntent] = useState<Intent | null>(null);
  const [excluded, setExcluded] = useState<string[]>([]);

  async function post(
    url: string,
    body: unknown,
  ): Promise<RecommendApiResponse | { error: string }> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async function handleSubmit(text: string) {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const data = await post("/api/recommend", {
        text,
        priorIntent: knownIntent,
      });
      if ("error" in data) {
        setError(data.error);
        return;
      }
      setKnownIntent(data.intent);
      if (data.status === "need_more_info") {
        setFollowUp(data.question);
        setInfo(data.question);
        setRec(null);
      } else if (data.status === "no_match") {
        setFollowUp(null);
        setInfo(data.message);
        setRec(null);
      } else {
        setFollowUp(null);
        setInfo(null);
        setRec(data.recommendation);
        setRecIntent(data.intent);
        setExcluded([]);
      }
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdjust(adjustment: Adjustment) {
    if (!rec || !recIntent) return;
    setLoading(true);
    setError(null);
    const exclude =
      adjustment === "another" ? [...excluded, rec.signature] : excluded;
    const diversifyFrom =
      adjustment === "another"
        ? Array.from(new Set(rec.items.map((i) => i.product.flavor)))
        : [];
    try {
      const data = await post("/api/adjust", {
        intent: recIntent,
        adjustment,
        exclude,
        diversifyFrom,
      });
      if ("error" in data) {
        setError(data.error);
        return;
      }
      if (data.status === "ok") {
        setRec(data.recommendation);
        if (adjustment === "another") setExcluded(exclude);
      } else if (data.status === "no_match") {
        setInfo(data.message);
      }
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-10 sm:py-14 flex flex-col gap-6">
      <Hero />

      <section className="card p-4 sm:p-5">
        <QueryInput
          onSubmit={handleSubmit}
          loading={loading}
          followUp={followUp}
        />
      </section>

      {loading && <LoadingState />}
      {error && !loading && <ErrorState message={error} />}
      {info && !loading && !rec && <InfoBubble text={info} />}

      {rec && !loading && (
        <section className="card p-5 sm:p-6">
          <Recommendation rec={rec} intent={recIntent ?? knownIntent!} />
          <AdjustButtons onAdjust={handleAdjust} loading={loading} />
          <WhatsAppButton rec={rec} />
        </section>
      )}

      <footer className="mt-2 text-center">
        <p
          className="text-sm italic tracking-wide"
          style={{ color: "var(--brand-primary)" }}
        >
          Santo el nombre, pecado el contenido
        </p>
      </footer>
    </main>
  );
}
