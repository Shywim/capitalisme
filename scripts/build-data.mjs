#!/usr/bin/env node
/*
 * Génère js/data.js à partir de la recherche brute (data/raw-research.json).
 *
 * Format d'entrée attendu : { groups: [ { group:{...}, brands:[...], scandals:[...] } ] }
 * (sortie du workflow `capitalisme-dataset`).
 *
 * Usage : node scripts/build-data.mjs [chemin-vers-raw.json]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const inPath = process.argv[2] || join(root, "data/raw-research.json");
const raw = JSON.parse(readFileSync(inPath, "utf8"));

const slug = (s) =>
  (s || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " et ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "groupe";

const usedIds = new Set();
function uniqueId(base) {
  let id = base, n = 2;
  while (usedIds.has(id)) id = `${base}-${n++}`;
  usedIds.add(id);
  return id;
}

const groups = (raw.groups || [])
  .filter((g) => g && g.group && g.group.name)
  .map((g) => {
    const meta = g.group;
    const id = uniqueId(slug(meta.name));
    // Dédoublonnage des marques par nom normalisé.
    const seen = new Set();
    const brands = (g.brands || []).filter((b) => {
      if (!b || !b.name) return false;
      const k = b.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).map((b) => ({
      name: b.name,
      ...(b.aliases && b.aliases.length ? { aliases: b.aliases } : {}),
      category: b.category || "",
      ...(b.note ? { note: b.note } : {}),
    }));

    const scandals = (g.scandals || []).filter((s) => s && s.title && s.summary).map((s) => ({
      title: s.title,
      ...(s.year != null ? { year: s.year } : {}),
      ...(s.period ? { period: s.period } : {}),
      severity: ["faible", "modéré", "élevé"].includes(s.severity) ? s.severity : "modéré",
      tags: Array.isArray(s.tags) ? s.tags : [],
      summary: s.summary,
      sources: (s.sources || []).filter((x) => x && x.url),
    }));

    return {
      id,
      name: meta.name,
      country: meta.country || "",
      founded: meta.founded ?? null,
      website: meta.website || null,
      revenue: meta.revenue || null,
      description: meta.description || "",
      brands,
      scandals,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "fr"));

const out = {
  meta: {
    generatedAt: process.env.BUILD_DATE || "généré automatiquement",
    note: "Données issues de sources publiques (presse, Wikipédia, régulateurs), vérifiées et formulées de façon neutre.",
  },
  groups,
};

const header = `/*
 * Données de Capitalisme — marque → grand groupe + controverses.
 * Fichier GÉNÉRÉ par scripts/build-data.mjs. Éditable à la main au besoin.
 *
 * ⚠️  Données issues de sources publiques. Présentées de façon factuelle et neutre.
 *     Les liens de propriété évoluent : référez-vous aux sources citées.
 */
window.CAPITALISME_DATA = `;

writeFileSync(join(root, "js/data.js"), header + JSON.stringify(out, null, 2) + ";\n");
const nb = groups.reduce((n, g) => n + g.brands.length, 0);
const ns = groups.reduce((n, g) => n + g.scandals.length, 0);
console.log(`✓ js/data.js généré : ${groups.length} groupes, ${nb} marques, ${ns} controverses.`);
