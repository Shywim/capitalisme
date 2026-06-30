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

// Noms d'affichage courts pour le grand public (la raison sociale complète est
// conservée dans `legalName`). Clé = nom renvoyé par la recherche.
const DISPLAY_NAMES = {
  "Nestlé S.A.": "Nestlé",
  "The Coca-Cola Company": "Coca-Cola",
  "PepsiCo, Inc.": "PepsiCo",
  "Unilever PLC": "Unilever",
  "The Procter & Gamble Company (P&G)": "Procter & Gamble",
  "Mondelēz International": "Mondelēz",
  "Danone S.A.": "Danone",
  "Mars, Incorporated": "Mars",
  "The Kraft Heinz Company": "Kraft Heinz",
  "General Mills, Inc.": "General Mills",
  "Kellanova (ex-Kellogg's)": "Kellanova",
  "L'Oréal S.A.": "L'Oréal",
  "Lactalis (Groupe Lactalis)": "Lactalis",
  "Groupe Bel (Bel SA)": "Groupe Bel",
  "Anheuser-Busch InBev SA/NV (AB InBev)": "AB InBev",
  "Heineken N.V.": "Heineken",
  "Reckitt Benckiser Group plc (Reckitt)": "Reckitt",
  "Colgate-Palmolive Company": "Colgate-Palmolive",
  "Kenvue Inc.": "Kenvue",
  "Henkel AG & Co. KGaA": "Henkel",
  "Bayer AG (Monsanto)": "Bayer (Monsanto)",
  "Suntory (Orangina Schweppes / Suntory Beverage & Food France)": "Suntory (Orangina Schweppes)",
  "Barilla (Barilla G. e R. Fratelli S.p.A.)": "Barilla",
  "Andros (Groupe Andros)": "Andros",
  "Savencia Fromage & Dairy (anciennement Bongrain / Soparind Bongrain)": "Savencia",
  "Groupe Bigard": "Bigard",
  "Groupe Bolloré (Bolloré SE)": "Bolloré",
  // Lot 2 (tech, mode/luxe, distribution, santé/tabac/énergie, boissons)
  "Alphabet Inc.": "Alphabet (Google)",
  "Meta Platforms, Inc.": "Meta",
  "Amazon.com, Inc.": "Amazon",
  "Apple Inc.": "Apple",
  "Microsoft Corporation": "Microsoft",
  "ByteDance Ltd.": "ByteDance (TikTok)",
  "Industria de Diseño Textil, S.A. (Inditex)": "Inditex (Zara)",
  "H & M Hennes & Mauritz AB": "H&M",
  "NIKE, Inc.": "Nike",
  "Adidas AG": "Adidas",
  "LVMH Moët Hennessy Louis Vuitton SE": "LVMH",
  "Kering SA": "Kering",
  "Restaurant Brands International Inc. (RBI)": "Restaurant Brands (Burger King)",
  "McDonald's Corporation": "McDonald's",
  "Carrefour SA": "Carrefour",
  "Yum! Brands, Inc.": "Yum! Brands (KFC, Pizza Hut)",
  "ITM Entreprises (Groupement Les Mousquetaires)": "Les Mousquetaires (Intermarché)",
  "Diageo plc": "Diageo",
  "JDE Peet's N.V.": "JDE Peet's",
  "Red Bull GmbH": "Red Bull",
  "Carlsberg A/S": "Carlsberg",
  "Sanofi S.A. (santé grand public regroupée sous Opella Healthcare)": "Sanofi (Opella)",
  "Sanofi S.A.": "Sanofi (Opella)",
  "Haleon plc": "Haleon",
  "Philip Morris International Inc. (PMI)": "Philip Morris (Marlboro)",
  "Philip Morris International Inc.": "Philip Morris (Marlboro)",
  "British American Tobacco p.l.c. (BAT)": "British American Tobacco",
  "British American Tobacco p.l.c.": "British American Tobacco",
  "TotalEnergies SE": "TotalEnergies",
  "Shell plc": "Shell",
  // Lot 3 — médias français
  "Groupe Le Monde": "Groupe Le Monde",
  "Groupe Figaro (Dassault Médias)": "Groupe Figaro (Dassault)",
  "Éditions Philippe Amaury (EPA)": "Groupe Amaury (L'Équipe)",
  "CMA CGM (pôle médias)": "CMA CGM (Saadé)",
  "Groupe EBRA": "EBRA (Crédit Mutuel)",
  "Groupe SIPA – Ouest-France": "Ouest-France (SIPA)",
  "Groupe La Dépêche du Midi": "Groupe La Dépêche (Baylet)",
  "CMI France (Czech Media Invest / Daniel Křetínský)": "CMI France (Křetínský)",
  "Bayard (Bayard Presse)": "Bayard",
  // Lot 4 — banques/assurances, télécoms, automobile, divertissement
  "Crédit Mutuel Alliance Fédérale": "Crédit Mutuel",
  "Covéa (MAAF, MMA, GMF)": "Covéa",
  "Aéma Groupe (Macif, Abeille Assurances)": "Aéma (Macif)",
  "Altice France (SFR)": "Altice (SFR)",
  "Deutsche Telekom (T-Mobile)": "Deutsche Telekom",
  "Hyundai Motor Group": "Hyundai-Kia",
  "The Walt Disney Company": "Disney",
  "Comcast (NBCUniversal)": "Comcast (NBCUniversal)",
  "Paramount (Paramount Skydance Corporation)": "Paramount (Skydance)",
  // Lot 5 — bio/végétal et empire Mulliez
  "Association Familiale Mulliez (AFM)": "Mulliez (AFM)",
  "La Vie (alimentation végétale)": "La Vie (végétal)",
};

// Corrections factuelles post-recherche (clé = nom d'affichage du groupe).
// Marques mal attribuées par la recherche, retirées du groupe concerné.
const BRAND_REMOVALS = {
  // Vichy → L'Oréal ; Kellogg's / Froot Loops / Frosted Flakes → Kellanova.
  "Ferrero": ["Vichy", "Kellogg's", "Froot Loops", "Frosted Flakes"],
  // Extra → chewing-gum Wrigley (groupe Mars), pas Kellanova.
  "Kellanova": ["Extra"],
  // Marques détenues via Kellanova : on les rattache à Kellanova pour éviter les doublons.
  "Mars": ["Pringles", "Pop-Tarts", "Cheez-It"],
  // Entités explicitement NON détenues par Yum! Brands (société séparée Yum China) ou non-marques.
  "Yum! Brands (KFC, Pizza Hut)": ["Yum China", "Little Sheep", "East Dawning", "KFC Yum! Center"],
  // Mascotte / concept fermé / gamme non confirmée.
  "McDonald's": ["Ronald McDonald", "CosMc's", "McNified"],
  // Marques NON détenues par BAT en Europe (Camel = JTI hors USA ; Newport = USA via Reynolds).
  "British American Tobacco": ["Camel", "Newport"],
  // Médias cédés/indépendants, plus détenus par Altice : BFM/RMC → CMA CGM (2024),
  // Libération → fonds de dotation, L'Express → A. Weill, Teads → Outbrain (2024).
  "Altice (SFR)": ["BFM TV", "RMC", "RMC Découverte", "RMC Story", "Libération", "L'Express", "Teads (régie publicitaire)", "Teads"],
};

// Note de rattachement (filiale d'un autre groupe), affichée en évidence.
const GROUP_NOTES = {
  "Kellanova": "Filiale du groupe Mars : l'acquisition de Kellanova par Mars a été finalisée en décembre 2025.",
  "Sanofi (Opella)": "La santé grand public de Sanofi (Doliprane…) est regroupée sous Opella, dont Sanofi a cédé le contrôle majoritaire au fonds CD&R (2024-2025).",
  "JDE Peet's": "Depuis 2026, JDE Peet's est passé sous le contrôle de l'américain Keurig Dr Pepper.",
};

/** Nettoyage générique si pas d'entrée explicite dans DISPLAY_NAMES. */
function autoClean(name) {
  let s = name.replace(/^The\s+/, "");
  s = s.replace(/[,]?\s+(Incorporated|Inc\.?|S\.A\.?|S\.p\.A\.?|N\.V\.|PLC|plc|SE|AG & Co\. KGaA|AG|Company|Group plc|Group)\s*$/g, "").trim();
  return s || name;
}
function displayName(name) {
  return DISPLAY_NAMES[name] || autoClean(name);
}

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
    const disp = displayName(meta.name);
    const id = uniqueId(slug(disp));
    // Marques retirées (corrections factuelles), normalisées pour comparaison.
    const removeSet = new Set((BRAND_REMOVALS[disp] || []).map((n) =>
      n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()));
    // Dédoublonnage des marques par nom normalisé.
    const seen = new Set();
    const brands = (g.brands || []).filter((b) => {
      if (!b || !b.name) return false;
      const k = b.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
      if (seen.has(k) || removeSet.has(k)) return false;
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
      name: disp,
      ...(disp !== meta.name ? { legalName: meta.name } : {}),
      ...(GROUP_NOTES[disp] ? { groupNote: GROUP_NOTES[disp] } : {}),
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
