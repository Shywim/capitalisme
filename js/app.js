/* ============================================================
   Capitalisme — logique applicative (vanilla JS, sans dépendance)
   ============================================================ */
(function () {
  "use strict";

  const DATA = (window.CAPITALISME_DATA && window.CAPITALISME_DATA.groups) || [];

  // ---------- Utilitaires ----------

  /** Normalise pour la recherche : minuscules, sans accents/diacritiques, sans ponctuation. */
  function norm(s) {
    return (s || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  /** Distance de Levenshtein (pour la tolérance aux fautes de frappe). */
  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    let cur = new Array(b.length + 1);
    for (let i = 1; i <= a.length; i++) {
      cur[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      [prev, cur] = [cur, prev];
    }
    return prev[b.length];
  }

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // ---------- Index de recherche ----------
  // Une entrée par (marque + alias) et par groupe.
  const groupById = {};
  const index = []; // { key, display, type:'brand'|'group', group, category }

  DATA.forEach((g) => {
    groupById[g.id] = g;
    // Le groupe lui-même est cherchable.
    index.push({ key: norm(g.name), display: g.name, type: "group", group: g, category: "Groupe" });
    (g.brands || []).forEach((b) => {
      const names = [b.name].concat(b.aliases || []);
      names.forEach((n, i) => {
        index.push({
          key: norm(n),
          display: b.name,
          alias: i > 0 ? n : null,
          type: "brand",
          group: g,
          category: b.category || "",
          brand: b
        });
      });
    });
  });

  const totalBrands = DATA.reduce((n, g) => n + (g.brands ? g.brands.length : 0), 0);
  const totalScandals = DATA.reduce((n, g) => n + (g.scandals ? g.scandals.length : 0), 0);

  // ---------- Recherche ----------
  /** Retourne une liste classée de résultats {entry, score}. score bas = meilleur. */
  function search(query, limit) {
    const q = norm(query);
    if (!q) return [];
    const out = [];
    const seen = new Set();

    index.forEach((e) => {
      const k = e.key;
      let score = null;
      if (k === q) score = 0;                                   // exact
      else if (k.startsWith(q)) score = 1 + (k.length - q.length) / 100; // préfixe
      else if (k.includes(" " + q) || k.includes(q + " ")) score = 2;    // mot entier
      else if (k.includes(q) && q.length >= 3) score = 3;       // sous-chaîne
      else if (q.length >= 3) {
        // Tolérance aux fautes : distance relative à la longueur.
        const d = levenshtein(q, k);
        const tol = q.length <= 5 ? 1 : q.length <= 8 ? 2 : 3;
        if (d <= tol) score = 4 + d / 10;
      }
      if (score === null) return;
      // Les marques priment légèrement sur les groupes à score égal.
      if (e.type === "group") score += 0.05;
      out.push({ entry: e, score });
    });

    out.sort((a, b) => a.score - b.score);

    // Dédoublonnage par (marque, groupe) ou (groupe).
    const deduped = [];
    for (const r of out) {
      const id = r.entry.type === "group"
        ? "g:" + r.entry.group.id
        : "b:" + r.entry.group.id + ":" + norm(r.entry.display);
      if (seen.has(id)) continue;
      seen.add(id);
      deduped.push(r);
      if (limit && deduped.length >= limit) break;
    }
    return deduped;
  }

  // ---------- Rendu ----------
  const homeEl = document.getElementById("home");
  const resultsEl = document.getElementById("results");
  const input = document.getElementById("search-input");
  const suggBox = document.getElementById("suggestions");
  const clearBtn = document.getElementById("clear-btn");
  const form = document.getElementById("search-form");

  function severityClass(s) { return "sev-" + (s || "modéré"); }

  function renderScandal(sc) {
    const sev = sc.severity || "modéré";
    const when = sc.year != null ? sc.year : (sc.period || "");
    const tags = (sc.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
    const sources = (sc.sources || [])
      .map((s) => `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label || "source")} ↗</a>`)
      .join("");
    return `
      <article class="scandal ${severityClass(sev)}">
        <div class="scandal-top">
          <h4>${escapeHtml(sc.title)}</h4>
          ${when !== "" ? `<span class="year">${escapeHtml(String(when))}</span>` : ""}
          <span class="sev-pill ${escapeHtml(sev)}">${escapeHtml(sev)}</span>
        </div>
        ${tags ? `<div class="tags">${tags}</div>` : ""}
        <p>${escapeHtml(sc.summary)}</p>
        ${sources ? `<div class="sources">Sources : ${sources}</div>` : ""}
      </article>`;
  }

  function renderGroup(g, matchedBrand) {
    const meta = [];
    if (g.country) meta.push(escapeHtml(g.country));
    if (g.founded) meta.push("fondé en " + escapeHtml(String(g.founded)));
    if (g.revenue) meta.push(escapeHtml(g.revenue));
    const metaHtml = meta.map((m, i) => i === 0 ? `<span>${m}</span>` : `<span class="dot">${m}</span>`).join("");

    const brandsHtml = (g.brands || [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "fr"))
      .map((b) => {
        const isCur = matchedBrand && norm(b.name) === norm(matchedBrand.name);
        const cat = b.category ? `<span class="b-cat">${escapeHtml(b.category)}</span>` : "";
        return `<button class="chip${isCur ? " is-current" : ""}" data-brand="${escapeHtml(b.name)}">${escapeHtml(b.name)}${cat}</button>`;
      }).join("");

    const scandalsHtml = (g.scandals && g.scandals.length)
      ? `<div class="scandals">${g.scandals
          .slice()
          .sort((a, b) => sevRank(b.severity) - sevRank(a.severity))
          .map(renderScandal).join("")}</div>`
      : `<p class="no-scandal">Aucune controverse majeure recensée dans cette base pour ce groupe. Cela ne signifie pas qu'il n'en existe pas — la base est partielle.</p>`;

    let ownershipHtml = "";
    if (matchedBrand) {
      ownershipHtml = `
        <p class="ownership"><span class="b-name">${escapeHtml(matchedBrand.name)}</span> appartient à</p>`;
    } else {
      ownershipHtml = `<p class="ownership">Groupe</p>`;
    }

    const noteHtml = matchedBrand && matchedBrand.note
      ? `<div class="note-inline">${escapeHtml(matchedBrand.note)}</div>` : "";

    return `
      <button class="back-link" data-back="1">← Retour / nouvelle recherche</button>
      <div class="result-head">
        ${ownershipHtml}
        <div class="owns-arrow">
          <span class="g-name">${escapeHtml(g.name)}</span>
        </div>
        <div class="g-sub">${metaHtml}</div>
        ${g.description ? `<p class="g-desc">${escapeHtml(g.description)}</p>` : ""}
        ${g.website ? `<div class="g-links"><a href="${escapeHtml(g.website)}" target="_blank" rel="noopener noreferrer">Site officiel ↗</a></div>` : ""}
        ${noteHtml}
      </div>

      <div class="block">
        <h3>Autres marques du groupe <span class="count">${(g.brands || []).length}</span></h3>
        <div class="brands-cloud">${brandsHtml || "<span class='muted'>—</span>"}</div>
      </div>

      <div class="block">
        <h3>Controverses & scandales <span class="count">${(g.scandals || []).length}</span></h3>
        ${scandalsHtml}
      </div>`;
  }

  function sevRank(s) { return s === "élevé" ? 3 : s === "modéré" ? 2 : s === "faible" ? 1 : 0; }

  function showGroup(g, matchedBrand) {
    homeEl.hidden = true;
    resultsEl.hidden = false;
    resultsEl.innerHTML = renderGroup(g, matchedBrand);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showEmpty(query) {
    homeEl.hidden = true;
    resultsEl.hidden = false;
    const near = search(query, 4);
    const suggestions = near.length
      ? `<div class="did-you-mean">Vouliez-vous dire : ${near.map((r) =>
          `<button class="chip" data-pick="${escapeHtml(r.entry.display)}">${escapeHtml(r.entry.display)}</button>`).join(" ")}</div>`
      : "";
    resultsEl.innerHTML = `
      <button class="back-link" data-back="1">← Retour</button>
      <div class="empty">
        <div class="big">🤷</div>
        <h2>Aucune marque trouvée pour « ${escapeHtml(query)} »</h2>
        <p>Cette base est partielle (${totalBrands} marques, ${DATA.length} groupes). La marque n'y figure peut-être pas encore.</p>
        ${suggestions}
      </div>`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goHome() {
    resultsEl.hidden = true;
    resultsEl.innerHTML = "";
    homeEl.hidden = false;
    hideSuggestions();
  }

  // ---------- Soumission ----------
  function runSearch(query) {
    hideSuggestions();
    const q = (query != null ? query : input.value).trim();
    if (!q) { goHome(); return; }
    const res = search(q, 1);
    if (!res.length) { showEmpty(q); return; }
    const top = res[0].entry;
    if (top.type === "group") showGroup(top.group, null);
    else showGroup(top.group, top.brand);
  }

  // ---------- Autocomplétion ----------
  let activeIdx = -1;
  let currentSuggestions = [];

  function highlight(text, q) {
    const nt = norm(text), nq = norm(q);
    const i = nt.indexOf(nq);
    if (i < 0 || !nq) return escapeHtml(text);
    // Mappe l'indice normalisé vers le texte d'origine de façon approximative.
    return escapeHtml(text.slice(0, i)) + "<mark>" + escapeHtml(text.slice(i, i + q.length)) + "</mark>" + escapeHtml(text.slice(i + q.length));
  }

  function showSuggestions(q) {
    const res = search(q, 8);
    currentSuggestions = res;
    activeIdx = -1;
    if (!res.length) { hideSuggestions(); return; }
    suggBox.innerHTML = res.map((r, i) => {
      const e = r.entry;
      const isGroup = e.type === "group";
      const label = e.alias ? `${escapeHtml(e.display)} <span class="muted">(${escapeHtml(e.alias)})</span>` : highlight(e.display, q);
      const right = isGroup
        ? `<span class="s-group">Groupe · ${(e.group.brands || []).length} marques</span>`
        : `<span class="s-group">${escapeHtml(e.group.name)}</span>`;
      const cat = !isGroup && e.category ? `<span class="s-cat">${escapeHtml(e.category)}</span>` : "";
      return `<li class="suggestion" role="option" id="sugg-${i}" data-i="${i}">
                <span class="s-name">${label}</span>${cat}${right}
              </li>`;
    }).join("");
    suggBox.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function hideSuggestions() {
    suggBox.hidden = true;
    suggBox.innerHTML = "";
    currentSuggestions = [];
    activeIdx = -1;
    input.setAttribute("aria-expanded", "false");
  }

  function pickSuggestion(i) {
    const r = currentSuggestions[i];
    if (!r) return;
    input.value = r.entry.display;
    if (r.entry.type === "group") showGroup(r.entry.group, null);
    else showGroup(r.entry.group, r.entry.brand);
    hideSuggestions();
  }

  function setActive(i) {
    const items = suggBox.querySelectorAll(".suggestion");
    items.forEach((el) => el.setAttribute("aria-selected", "false"));
    if (i >= 0 && items[i]) {
      items[i].setAttribute("aria-selected", "true");
      items[i].scrollIntoView({ block: "nearest" });
      input.setAttribute("aria-activedescendant", "sugg-" + i);
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  // ---------- Vue d'accueil ----------
  function renderHome() {
    document.getElementById("stats").textContent =
      `${totalBrands} marques · ${DATA.length} groupes · ${totalScandals} controverses recensées`;

    // Exemples : quelques marques marquantes si disponibles.
    const examplePool = ["Buitoni", "Innocent", "Maggi", "Perrier", "Lipton", "Knorr", "Côte d'Or", "Pringles", "Lesieur", "Bonne Maman"];
    const available = examplePool.filter((n) => index.some((e) => norm(e.display) === norm(n)));
    const examples = (available.length ? available : index.filter(e => e.type === "brand").slice(0, 8).map(e => e.display)).slice(0, 8);
    document.getElementById("examples").innerHTML =
      `<span class="muted" style="align-self:center;margin-right:4px;font-size:14px">Essayez :</span>` +
      examples.map((n) => `<button class="chip" data-pick="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join("");

    const grid = document.getElementById("group-grid");
    grid.innerHTML = DATA
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "fr"))
      .map((g) => {
        const nb = (g.brands || []).length, ns = (g.scandals || []).length;
        return `<button class="group-card" data-group="${escapeHtml(g.id)}">
          <div class="gc-name">${escapeHtml(g.name)}</div>
          <div class="gc-meta">${escapeHtml(g.country || "")}</div>
          <div class="gc-counts">
            <span class="badge-count">${nb} marque${nb > 1 ? "s" : ""}</span>
            <span class="badge-count${ns ? " has-scandals" : ""}">${ns} controverse${ns > 1 ? "s" : ""}</span>
          </div>
        </button>`;
      }).join("");
  }

  // ---------- Événements ----------
  let debounce;
  input.addEventListener("input", () => {
    clearBtn.hidden = !input.value;
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      if (input.value.trim()) showSuggestions(input.value);
      else hideSuggestions();
    }, 80);
  });

  input.addEventListener("keydown", (e) => {
    const items = currentSuggestions.length;
    if (e.key === "ArrowDown" && items) {
      e.preventDefault(); activeIdx = (activeIdx + 1) % items; setActive(activeIdx);
    } else if (e.key === "ArrowUp" && items) {
      e.preventDefault(); activeIdx = (activeIdx - 1 + items) % items; setActive(activeIdx);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0) pickSuggestion(activeIdx);
      else runSearch();
    } else if (e.key === "Escape") {
      hideSuggestions();
    }
  });

  form.addEventListener("submit", (e) => { e.preventDefault(); runSearch(); });

  clearBtn.addEventListener("click", () => {
    input.value = ""; clearBtn.hidden = true; input.focus(); goHome();
  });

  suggBox.addEventListener("mousedown", (e) => {
    const li = e.target.closest(".suggestion");
    if (li) { e.preventDefault(); pickSuggestion(Number(li.dataset.i)); }
  });

  // Délégation de clics dans les résultats et l'accueil.
  document.body.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-pick]");
    if (pick) { input.value = pick.dataset.pick; clearBtn.hidden = false; runSearch(pick.dataset.pick); return; }
    const brandBtn = e.target.closest("[data-brand]");
    if (brandBtn) { input.value = brandBtn.dataset.brand; clearBtn.hidden = false; runSearch(brandBtn.dataset.brand); return; }
    const groupCard = e.target.closest("[data-group]");
    if (groupCard) { const g = groupById[groupCard.dataset.group]; if (g) { input.value = g.name; clearBtn.hidden = false; showGroup(g, null); } return; }
    const back = e.target.closest("[data-back]");
    if (back) { input.value = ""; clearBtn.hidden = true; goHome(); return; }
    if (!e.target.closest(".search")) hideSuggestions();
  });

  // ---------- Routage simple par hash (#marque) ----------
  function fromHash() {
    const h = decodeURIComponent((location.hash || "").replace(/^#/, "")).trim();
    if (h) { input.value = h; clearBtn.hidden = false; runSearch(h); }
  }

  // ---------- Init ----------
  renderHome();
  if (location.hash) fromHash();
  window.addEventListener("hashchange", fromHash);
})();
