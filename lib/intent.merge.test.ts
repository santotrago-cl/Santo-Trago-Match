/**
 * Tests de mergeIntent() — regla "latest explicit preference wins".
 * Ejecutar: npx tsx lib/intent.merge.test.ts
 */
import assert from "node:assert/strict";
import { mergeIntent } from "./intent";
import type { Intent } from "@/types";

function mk(p: Partial<Intent>): Intent {
  return {
    people: null,
    budget: null,
    preferences: [],
    avoid: [],
    occasion: null,
    wantsVariety: false,
    missing: [],
    ...p,
  };
}

let passed = 0;
let failed = 0;
function t(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log("  ✓", name);
  } catch (e) {
    failed++;
    console.log("  ✗", name, "\n     ", (e as Error).message);
  }
}

// 1. Preferencia → rechazo (la instrucción nueva gana)
t("1 dulce -> mejor que no sea dulce", () => {
  const r = mergeIntent(mk({ preferences: ["sweet"] }), mk({ avoid: ["sweet"] }));
  assert.deepEqual(r.preferences, []);
  assert.deepEqual(r.avoid, ["sweet"]);
});

// 2. Rechazo → preferencia
t("2 no ácido -> sí quiero ácido", () => {
  const r = mergeIntent(mk({ avoid: ["acidic"] }), mk({ preferences: ["acidic"] }));
  assert.deepEqual(r.preferences, ["acidic"]);
  assert.deepEqual(r.avoid, []);
});

// 3. Mantener preferencias no relacionadas
t("3 tropical+refrescante -> también dulce", () => {
  const r = mergeIntent(
    mk({ preferences: ["tropical", "refreshing"] }),
    mk({ preferences: ["sweet"] }),
  );
  assert.deepEqual(r.preferences, ["tropical", "refreshing", "sweet"]);
  assert.deepEqual(r.avoid, []);
});

// 4. Cambio parcial (mezcla de reemplazo y conservación)
t("4 cambio parcial", () => {
  const r = mergeIntent(
    mk({ preferences: ["sweet", "tropical"], avoid: ["intense"] }),
    mk({ preferences: ["intense"], avoid: ["sweet"] }),
  );
  assert.deepEqual(r.preferences, ["tropical", "intense"]);
  assert.deepEqual(r.avoid, ["sweet"]);
});

// 5. People y budget: nuevo reemplaza solo si no es null
t("5 people/budget reemplazo solo si no-null", () => {
  const r = mergeIntent(
    mk({ people: 4, budget: 20000 }),
    mk({ people: null, budget: 30000 }),
  );
  assert.equal(r.people, 4);
  assert.equal(r.budget, 30000);
});

// 6. Conversación normal por etapas, sin contradicción
t("6 staged: tropical -> somos 4 -> veinte lucas", () => {
  const a = mergeIntent(mk({ preferences: ["tropical"] }), mk({ people: 4 }));
  const b = mergeIntent(a, mk({ budget: 20000 }));
  assert.equal(b.people, 4);
  assert.equal(b.budget, 20000);
  assert.deepEqual(b.preferences, ["tropical"]);
  assert.deepEqual(b.avoid, []);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
