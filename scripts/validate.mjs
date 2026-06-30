#!/usr/bin/env node
/* Contrôle d'intégrité de js/data.js. Sort en erreur (code 1) si problème. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const code = readFileSync(join(root, "js/data.js"), "utf8");

const window = {};
// eslint-disable-next-line no-new-func
new Function("window", code)(window);
const data = window.CAPITALISME_DATA;

const errors = [];
const warns = [];
const SEV = new Set(["faible", "modéré", "élevé"]);

if (!data || !Array.isArray(data.groups)) {
  console.error("✗ CAPITALISME_DATA.groups manquant ou invalide.");
  process.exit(1);
}

const ids = new Set();
let nBrands = 0, nScandals = 0, nSources = 0;
const brandSeen = new Map(); // marque normalisée -> [groupes]

const norm = (s) => (s || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

for (const g of data.groups) {
  const tag = `groupe "${g && g.name || "?"}"`;
  if (!g.id) errors.push(`${tag} : id manquant`);
  else if (ids.has(g.id)) errors.push(`id en double : "${g.id}"`);
  else ids.add(g.id);
  if (!g.name) errors.push(`${tag} : name manquant`);
  if (!g.description) warns.push(`${tag} : description manquante`);

  if (!Array.isArray(g.brands) || g.brands.length === 0) warns.push(`${tag} : aucune marque`);
  const localBrand = new Set();
  for (const b of g.brands || []) {
    nBrands++;
    if (!b.name) errors.push(`${tag} : marque sans name`);
    if (!b.category) warns.push(`${tag} / "${b.name}" : category manquante`);
    const k = norm(b.name);
    if (localBrand.has(k)) warns.push(`${tag} : marque en double "${b.name}"`);
    localBrand.add(k);
    if (!brandSeen.has(k)) brandSeen.set(k, []);
    brandSeen.get(k).push(g.name);
    if (b.aliases && !Array.isArray(b.aliases)) errors.push(`${tag} / "${b.name}" : aliases doit être un tableau`);
  }

  for (const s of g.scandals || []) {
    nScandals++;
    if (!s.title) errors.push(`${tag} : scandale sans title`);
    if (!s.summary) errors.push(`${tag} / "${s.title}" : summary manquant`);
    if (s.severity && !SEV.has(s.severity)) errors.push(`${tag} / "${s.title}" : severity invalide "${s.severity}"`);
    if (s.year != null && (typeof s.year !== "number" || s.year < 1800 || s.year > 2100)) warns.push(`${tag} / "${s.title}" : year suspect (${s.year})`);
    if (!Array.isArray(s.sources) || s.sources.length === 0) warns.push(`${tag} / "${s.title}" : aucune source`);
    for (const src of s.sources || []) {
      nSources++;
      if (!src.url || !/^https?:\/\//.test(src.url)) errors.push(`${tag} / "${s.title}" : URL de source invalide`);
    }
  }
}

// Marques présentes dans plusieurs groupes (possible mais à vérifier).
for (const [k, groups] of brandSeen) {
  if (groups.length > 1) warns.push(`marque "${k}" rattachée à plusieurs groupes : ${groups.join(", ")}`);
}

console.log(`\n  Groupes : ${data.groups.length}  ·  Marques : ${nBrands}  ·  Controverses : ${nScandals}  ·  Sources : ${nSources}\n`);
if (warns.length) {
  console.log("  Avertissements :");
  warns.forEach((w) => console.log("   ⚠  " + w));
  console.log("");
}
if (errors.length) {
  console.error("  Erreurs :");
  errors.forEach((e) => console.error("   ✗  " + e));
  console.error(`\n✗ Validation échouée : ${errors.length} erreur(s).\n`);
  process.exit(1);
}
console.log("✓ Données valides.\n");
