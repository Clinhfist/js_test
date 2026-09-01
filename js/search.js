/* ============================================================
   ЛОГІКА СТОРІНКИ ПОШУКУ ВІДПОВІДЕЙ
   Завантажує базу знань з відповідями (data/answers-db.json)
   і виконує пошук/фільтрацію по категоріях.
   ============================================================ */

(function () {
  const searchEl = document.getElementById("search");
  const clearEl = document.getElementById("clear");
  const resultsEl = document.getElementById("results");
  const metaEl = document.getElementById("meta");
  const chipsEl = document.getElementById("chips");

  let activeCat = "Всі";
  let ENTRIES = [];

  const CATEGORY_LABELS = {
    LEAN: "Lean White Belt",
    DANGER: "Небезпечні відправлення, Книга 2",
    Book1:"Книга технології 1",
    SORTING: "Сортування на терміналах та депо",
    BDF: "Завантаження та вивантаження БДФ",
    UNKNOWN: "Робота з невпізнаним вантажем",
    SCANNING: "Відомості сканування",
    MEDICAL: "Перша медична (MARCH)",
};

  function buildEntries(db) {
    const entries = [];

    // Категорії типу "питання -> відповідь"
    ["LEAN", "DANGER", "Book1", "SORTING", "BDF", "UNKNOWN", "SCANNING"].forEach((key) => {
      const obj = db[key] || {};
      const cat = CATEGORY_LABELS[key];
      Object.entries(obj).forEach(([q, a]) => {
        // прибираємо технічний суфікс " (2)" з дубльованих ключів
        const question = q.replace(/\s*\(\d+\)\s*$/, "");
        entries.push({ cat, q: question, a });
      });
    });

    // Медичні — лише відповіді (без запитання)
    Array.from(new Set(db.MEDICAL || [])).forEach((a) => {
      entries.push({ cat: CATEGORY_LABELS.MEDICAL, q: "", a });
    });

    return entries;
  }

  // Нормалізація тексту для пошуку
  function norm(s) {
    return (s || "")
      .toLowerCase()
      .replace(/[’'`]/g, "'")
      .replace(/[«»"“”]/g, "")
      .replace(/[^a-zа-яіїєґ0-9'\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokens(s) {
    return norm(s).split(" ").filter((t) => t.length >= 2);
  }

  function score(entry, qNorm, qTokens) {
    if (!qNorm) return 0;
    let s = 0;

    // Пряме входження всього рядка запиту в запитання
    if (entry._q && entry._q.includes(qNorm)) s += 50;
    if (entry._a.includes(qNorm)) s += 20;

    // Перекриття по словах із запитанням
    qTokens.forEach((t) => {
      if (entry._q && entry._q.includes(t)) s += 6;
      else if (entry._a.includes(t)) s += 2;
    });

    // Бонус за частку співпадінь слів запитання
    if (entry._qt.length) {
      const matched = entry._qt.filter((t) => qTokens.some((x) => x.includes(t) || t.includes(x))).length;
      s += Math.round((matched / entry._qt.length) * 10);
    }
    return s;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function highlight(text, qTokens) {
    let out = escapeHtml(text);
    if (!qTokens.length) return out;
    const uniq = Array.from(new Set(qTokens)).filter((t) => t.length >= 3).sort((a, b) => b.length - a.length);
    uniq.forEach((t) => {
      const re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
      out = out.replace(re, "<mark>$1</mark>");
    });
    return out;
  }

  function copyText(text, btn) {
    const done = () => {
      btn.classList.add("done");
      const old = btn.dataset.label;
      btn.textContent = "Скопійовано ✓";
      setTimeout(() => {
        btn.classList.remove("done");
        btn.textContent = old;
      }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallback(text, done));
    } else {
      fallback(text, done);
    }
  }

  function fallback(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      done();
    } catch (e) {}
    document.body.removeChild(ta);
  }

  function render(query) {
    const qNorm = norm(query);
    const qTokens = tokens(query);
    clearEl.classList.toggle("show", !!query);

    let pool = ENTRIES;
    if (activeCat !== "Всі") pool = pool.filter((e) => e.cat === activeCat);

    let list;
    if (!qNorm) {
      list = pool.slice(0, 30);
      metaEl.textContent = activeCat === "Всі"
        ? "Усього відповідей: " + ENTRIES.length + ". Почни вводити запитання."
        : pool.length + " відповідей у категорії. Почни вводити запитання.";
    } else {
      list = pool
        .map((e) => ({ e, s: score(e, qNorm, qTokens) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 20)
        .map((x) => x.e);
      metaEl.textContent = list.length
        ? "Знайдено збігів: " + list.length + (list.length === 20 ? "+" : "")
        : "";
    }

    if (!list.length) {
      resultsEl.innerHTML = "";
      const div = document.createElement("div");
      div.className = "empty";
      div.innerHTML = qNorm
        ? '<div class="big">Нічого не знайдено</div><div>Спробуй ввести інші слова із запитання або менше слів.</div>'
        : '<div class="big">Почни вводити запитання</div>';
      resultsEl.appendChild(div);
      return;
    }

    resultsEl.innerHTML = "";
    list.forEach((e) => {
      const card = document.createElement("div");
      card.className = "card";

      const cat = document.createElement("span");
      cat.className = "card-cat";
      cat.textContent = e.cat;
      card.appendChild(cat);

      if (e.q) {
        const q = document.createElement("p");
        q.className = "q";
        q.innerHTML = "<b>Питання:</b> " + highlight(e.q, qTokens);
        card.appendChild(q);
      }

      const al = document.createElement("div");
      al.className = "a-label";
      al.textContent = e.q ? "Відповідь" : "Правильний варіант";
      card.appendChild(al);

      const a = document.createElement("div");
      a.className = "a";
      a.innerHTML = highlight(e.a, qTokens);
      card.appendChild(a);

      resultsEl.appendChild(card);
    });
  }

  function buildChips() {
    const catList = ["Всі", ...Array.from(new Set(ENTRIES.map((e) => e.cat)))];
    catList.forEach((cat) => {
      const b = document.createElement("button");
      b.className = "chip" + (cat === "Всі" ? " active" : "");
      b.textContent = cat === "Всі" ? "Всі категорії" : cat;
      b.addEventListener("click", () => {
        activeCat = cat;
        [...chipsEl.children].forEach((c) => c.classList.remove("active"));
        b.classList.add("active");
        render(searchEl.value);
      });
      chipsEl.appendChild(b);
    });
  }

  function init() {
    if (typeof ANSWERS_DB === "undefined") {
      metaEl.textContent = "Не вдалося знайти базу відповідей. Перевір, що data/answers-db.js підключено перед js/search.js.";
      return;
    }

    ENTRIES = buildEntries(ANSWERS_DB);
    ENTRIES.forEach((e) => {
      e._q = norm(e.q);
      e._a = norm(e.a);
      e._qt = tokens(e.q);
    });
    buildChips();

    let t;
    searchEl.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => render(searchEl.value), 120);
    });
    clearEl.addEventListener("click", () => {
      searchEl.value = "";
      searchEl.focus();
      render("");
    });

    render("");
  }

  init();
})();
