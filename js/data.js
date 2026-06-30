/*
 * Données de Capitalisme — marque → grand groupe + controverses.
 *
 * Ce fichier est volontairement lisible/éditable à la main (objet JS = quasi-JSON).
 * Il est aussi (re)généré par `scripts/build-data.mjs` à partir de la recherche.
 *
 * Format :
 *   window.CAPITALISME_DATA = {
 *     meta:   { generatedAt, note },
 *     groups: [{
 *       id, name, country, founded, website, revenue, description,
 *       brands:  [{ name, aliases?, category, note? }],
 *       scandals:[{ title, year|period, severity, tags, summary, sources:[{label,url}] }]
 *     }]
 *   }
 *
 * ⚠️  Données issues de sources publiques (presse, Wikipédia, régulateurs).
 *     Formulées de façon factuelle et neutre. Peuvent évoluer — voir les sources.
 */
window.CAPITALISME_DATA = {
  meta: {
    generatedAt: "2026-06-30 (graine)",
    note: "Jeu de données initial. Sera enrichi automatiquement."
  },
  groups: [
    {
      id: "nestle",
      name: "Nestlé",
      country: "Suisse",
      founded: 1866,
      website: "https://www.nestle.com",
      revenue: "~93 milliards CHF (2023)",
      description: "Premier groupe agroalimentaire mondial, basé à Vevey, présent dans l'alimentation, les boissons, l'eau et la nutrition.",
      brands: [
        { name: "Buitoni", aliases: ["Buittoni", "Buitony"], category: "Alimentation" },
        { name: "KitKat", aliases: ["Kit Kat"], category: "Confiserie" },
        { name: "Nescafé", category: "Boissons" },
        { name: "Nespresso", category: "Boissons" },
        { name: "Maggi", category: "Alimentation" },
        { name: "Perrier", category: "Eaux" },
        { name: "Vittel", category: "Eaux" },
        { name: "S.Pellegrino", aliases: ["San Pellegrino"], category: "Eaux" },
        { name: "Herta", category: "Alimentation", note: "Détenu majoritairement via une coentreprise." },
        { name: "Smarties", category: "Confiserie" },
        { name: "Ricoré", category: "Boissons" },
        { name: "La Laitière", category: "Produits laitiers" },
        { name: "Mousline", category: "Alimentation" }
      ],
      scandals: [
        {
          title: "Substituts de lait maternel dans les pays en développement",
          year: 1977,
          severity: "élevé",
          tags: ["santé", "publicité mensongère", "droits humains"],
          summary: "À partir des années 1970, Nestlé est accusé de promouvoir agressivement le lait infantile en poudre dans les pays en développement, au détriment de l'allaitement. La controverse déclenche un boycott international à partir de 1977 et conduit à l'adoption du Code de l'OMS sur la commercialisation des substituts du lait maternel (1981).",
          sources: [
            { label: "Wikipédia — Boycott de Nestlé", url: "https://fr.wikipedia.org/wiki/Boycott_de_Nestl%C3%A9" }
          ]
        },
        {
          title: "Eaux minérales : traitements interdits (Perrier, Vittel, Contrex)",
          year: 2024,
          severity: "élevé",
          tags: ["sécurité alimentaire", "eau", "publicité mensongère"],
          summary: "Une enquête révèle en 2024 que Nestlé Waters a utilisé des traitements de purification (UV, charbon actif) interdits pour des eaux vendues comme « minérales naturelles ». Le groupe a reconnu les faits et accepté une amende dans le cadre d'une transaction judiciaire en France.",
          sources: [
            { label: "Le Monde — enquête eaux minérales", url: "https://www.lemonde.fr/" }
          ]
        }
      ]
    },
    {
      id: "coca-cola",
      name: "The Coca-Cola Company",
      country: "États-Unis",
      founded: 1892,
      website: "https://www.coca-colacompany.com",
      revenue: "~46 milliards USD (2023)",
      description: "Géant mondial des boissons non alcoolisées, basé à Atlanta.",
      brands: [
        { name: "Coca-Cola", aliases: ["Coca", "Coke"], category: "Boissons" },
        { name: "Innocent", aliases: ["Innocent Drinks"], category: "Boissons", note: "Smoothies et jus ; contrôlé par Coca-Cola depuis 2013." },
        { name: "Fanta", category: "Boissons" },
        { name: "Sprite", category: "Boissons" },
        { name: "Minute Maid", category: "Boissons" },
        { name: "Tropico", category: "Boissons" },
        { name: "Powerade", category: "Boissons" },
        { name: "Fuze Tea", category: "Boissons" },
        { name: "Costa Coffee", category: "Boissons" }
      ],
      scandals: [
        {
          title: "Pollution plastique",
          period: "années 2010-2020",
          severity: "élevé",
          tags: ["environnement", "plastique", "pollution"],
          summary: "Coca-Cola est régulièrement désigné comme le plus gros pollueur plastique de marque au monde par les audits de l'ONG Break Free From Plastic depuis 2018, en raison du volume d'emballages à usage unique retrouvés dans l'environnement.",
          sources: [
            { label: "The Guardian — Coca-Cola top plastic polluter", url: "https://www.theguardian.com/" }
          ]
        }
      ]
    }
  ]
};
