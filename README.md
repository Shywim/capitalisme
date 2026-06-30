# 🏭 Capitalisme

**À qui appartient vraiment ce que vous achetez ?**

Un site qui permet d'entrer une **marque** ou un **produit** et de découvrir à quel
**grand groupe** il appartient — ainsi que les **controverses et scandales** associés à
ce groupe. Par exemple : *Buitoni* → **Nestlé**, *Innocent* → **The Coca-Cola Company**.

C'est un **site statique** (HTML/CSS/JS, aucune dépendance, aucun serveur requis) avec une
base de données curée en JSON. Il fonctionne en local en ouvrant `index.html`, ou hébergé
gratuitement (GitHub Pages, Netlify, etc.).

---

## Aperçu des fonctionnalités

- 🔎 **Recherche tolérante aux fautes** : « Buittoni » trouve quand même *Buitoni*
  (correspondance par alias + distance de Levenshtein), insensible à la casse et aux accents.
- 💡 **Autocomplétion** avec navigation clavier (↑ ↓ Entrée Échap).
- 🏢 **Fiche groupe** : pays, année de création, chiffre d'affaires, description, site officiel.
- 🛒 **Autres marques du groupe** (chips cliquables pour rebondir).
- ⚠️ **Controverses sourcées** : titre, date, niveau de gravité, thèmes (tags), résumé
  factuel et **liens vers les sources**.
- 🗂️ **Exploration** de tous les groupes depuis l'accueil.
- 📱 **Responsive** + thème sombre automatique + accessible (ARIA, navigation clavier).

---

## Lancer le site

Le plus simple : ouvrez `index.html` dans un navigateur (tout est embarqué).

Avec un serveur local (recommandé) :

```bash
npm start          # → http://localhost:8080
```

---

## Structure du projet

```
capitalisme/
├── index.html              # page unique
├── css/style.css           # thème éditorial, responsive, dark mode
├── js/
│   ├── data.js             # LES DONNÉES (window.CAPITALISME_DATA)
│   └── app.js              # recherche, autocomplétion, rendu
└── scripts/
    ├── serve.mjs           # serveur statique local (npm start)
    ├── validate.mjs        # contrôle d'intégrité des données (npm run validate)
    └── build-data.mjs      # (re)génère js/data.js depuis une recherche brute
```

---

## Les données

Les données vivent dans **`js/data.js`**. Format :

```js
window.CAPITALISME_DATA = {
  meta: { generatedAt, note },
  groups: [
    {
      id: "nestle",
      name: "Nestlé",
      country: "Suisse",
      founded: 1866,
      website: "https://www.nestle.com",
      revenue: "~93 milliards CHF (2023)",
      description: "…",
      brands: [
        { name: "Buitoni", aliases: ["Buittoni"], category: "Alimentation", note: "…" }
      ],
      scandals: [
        {
          title: "…",
          year: 1977,                 // ou period: "années 2010"
          severity: "élevé",          // faible | modéré | élevé
          tags: ["santé", "droits humains"],
          summary: "Résumé factuel et daté…",
          sources: [{ label: "…", url: "https://…" }]
        }
      ]
    }
  ]
};
```

### Ajouter / corriger une marque ou une controverse

1. Éditez `js/data.js` directement (c'est lisible à la main).
2. Vérifiez l'intégrité :

   ```bash
   npm run validate
   ```

### Bonnes pratiques (important)

- ⚖️ **Restez factuel et neutre.** Décrivez des faits **publiquement rapportés**, avec
  **dates** et **sources crédibles** (presse, Wikipédia, régulateurs). Évitez tout ton
  diffamatoire ou sensationnaliste.
- 🔗 **Toujours citer au moins une source** par controverse.
- 🔄 **Les liens de propriété évoluent** (rachats, cessions) : datez et sourcez.

---

## Avertissement

Outil d'information citoyenne. Les informations sont présentées de bonne foi à partir de
sources publiques et peuvent contenir des erreurs ou être datées — **référez-vous toujours
aux sources citées**. Aucune affiliation avec les marques ou groupes mentionnés.

## Licence

MIT.
