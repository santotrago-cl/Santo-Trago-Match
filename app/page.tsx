"use client";

import { useEffect, useRef, useState } from "react";
import { Hero } from "@/components/Hero";
import { QueryInput } from "@/components/QueryInput";
import { OrderResult } from "@/components/OrderResult";
import { LoadingState, ErrorState, InfoBubble } from "@/components/Feedback";
import { HowItWorks } from "@/components/HowItWorks";
import { AiBadge } from "@/components/AiBadge";
import type {
  Adjustment,
  Intent,
  Product,
  Recommendation as Rec,
  RecommendApiResponse,
} from "@/types";

const GENERIC_ERROR =
  "No pudimos encontrar tu Match esta vez. Inténtalo nuevamente en unos segundos.";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState<string | null>(null);

  const [knownIntent, setKnownIntent] = useState<Intent | null>(null);
  const [rec, setRec] = useState<Rec | null>(null);
  const [recIntent, setRecIntent] = useState<Intent | null>(null);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  // Catálogo real (solo lectura) para permitir agregar sabores al pedido.
  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => setCatalog(d.products ?? []))
      .catch(() => {});
  }, []);

  // Al aparecer una recomendación o una pregunta de seguimiento, desplazar
  // suavemente hasta el resultado para que no quede oculto abajo (clave en móvil).
  useEffect(() => {
    if (!loading && (rec || info)) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [rec, info, loading]);

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

  function resetSearch() {
    setRec(null);
    setRecIntent(null);
    setKnownIntent(null);
    setInfo(null);
    setError(null);
    setFollowUp(null);
    setExcluded([]);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
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

      {!rec && !loading && (
        <div className="-mt-1">
          <HowItWorks />
        </div>
      )}

      {(loading || error || info || rec) && (
        <div ref={resultRef} className="scroll-mt-4 flex flex-col gap-6">
          {loading && <LoadingState />}
          {error && !loading && <ErrorState message={error} />}
          {info && !loading && !rec && <InfoBubble text={info} />}

          {rec && !loading && (
            <section className="card p-5 sm:p-6">
              <OrderResult
                rec={rec}
                intent={recIntent ?? knownIntent!}
                catalog={catalog}
                onAdjust={handleAdjust}
                loading={loading}
              />
              <p
                className="text-[11px] text-center mt-3"
                style={{ color: "var(--muted)" }}
              >
                Precios y disponibilidad según el catálogo actual de Santo Trago.
              </p>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={resetSearch}
                  className="btn-secondary-link text-sm"
                >
                  Hacer otra búsqueda
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      <footer className="mt-2 flex flex-col items-center gap-3 text-center">
        <AiBadge />
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
