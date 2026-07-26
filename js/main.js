/* ============================================================
   ЛОГІКА ГОЛОВНОЇ СТОРІНКИ
   Завантажує базу знань зі скриптами (data/scripts-db.json)
   і рендерить картки, згруповані за категоріями.
   ============================================================ */

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function copyCode(code, btn) {
  try {
    await navigator.clipboard.writeText(code);
  } catch (e) {
    // Запасний варіант для старих браузерів / file://
    const ta = document.createElement("textarea");
    ta.value = code;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  btn.textContent = "Скопійовано ✓";
  btn.classList.add("copied");
  setTimeout(() => {
    btn.textContent = "Копіювати";
    btn.classList.remove("copied");
  }, 1800);
}

function renderCards(scripts) {
  const cardsEl = document.getElementById("cards");
  const categories = [...new Set(scripts.map((s) => s.category))];

  categories.forEach((cat) => {
    const heading = document.createElement("h3");
    heading.className = "cat-title";
    heading.textContent = cat;
    cardsEl.appendChild(heading);

    scripts
      .filter((s) => s.category === cat)
      .forEach((s) => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML =
          '<div class="card-head">' +
            '<div>' +
              '<h3>' + escapeHtml(s.title) + '</h3>' +
              '<p>' + escapeHtml(s.desc) + '</p>' +
            '</div>' +
            '<span class="tag">' + escapeHtml(s.tag) + '</span>' +
          '</div>' +
          '<div class="code-wrap">' +
            '<button class="copy-btn">Копіювати</button>' +
            '<pre class="mono">' + escapeHtml(s.code) + '</pre>' +
          '</div>';
        card.querySelector(".copy-btn").addEventListener("click", (e) => copyCode(s.code, e.currentTarget));
        cardsEl.appendChild(card);
      });
  });
}

function init() {
  if (typeof SCRIPTS_DB === "undefined") {
    const cardsEl = document.getElementById("cards");
    cardsEl.innerHTML = '<p style="color:#e8a6a6">Не вдалося знайти базу скриптів. Перевір, що data/scripts-db.js підключено перед js/main.js.</p>';
    return;
  }
  renderCards(SCRIPTS_DB);
}

init();
