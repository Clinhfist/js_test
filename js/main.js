/* ============================================================
   JS/MAIN.JS — Логіка відображення карток та копіювання
   ============================================================ */

// Допоміжна функція для екранування спецсимволів HTML
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Завантаження коду файлу
async function loadScriptCode(file) {
  const response = await fetch("data/" + file);
  if (!response.ok) {
    throw new Error("HTTP Status " + response.status);
  }
  return await response.text();
}

// Функція копіювання коду в буфер обміну
function copyCode(text, buttonEl) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = buttonEl.textContent;
    buttonEl.textContent = "Скопійовано!";
    buttonEl.classList.add("copied");
    setTimeout(() => {
      buttonEl.textContent = originalText;
      buttonEl.classList.remove("copied");
    }, 2000);
  }).catch((err) => {
    console.error("Не вдалося скопіювати:", err);
  });
}

// Рендеринг карток
async function renderCards(scripts) {
  const cardsEl = document.getElementById("cards");

  if (!cardsEl) {
    console.error("❌ Елемент #cards не знайдено на сторінці.");
    return;
  }

  cardsEl.innerHTML = "";
  console.log("🚀 Починаємо рендеринг карток, всього скриптів:", scripts.length);

  const categories = [...new Set(scripts.map((s) => s.category))];

  for (const cat of categories) {
    const heading = document.createElement("h3");
    heading.className = "cat-title";
    heading.textContent = cat;
    cardsEl.appendChild(heading);

    const categoryScripts = scripts.filter((s) => s.category === cat);

    for (const s of categoryScripts) {
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
          '<pre class="mono">Завантаження коду...</pre>' +
        '</div>';

      cardsEl.appendChild(card); // Спочатку вставляємо картку в DOM

      const pre = card.querySelector(".mono");
      const copyBtn = card.querySelector(".copy-btn");

      try {
        let code = "";
        if (s.file) {
          code = await loadScriptCode(s.file);
        } else if (s.code) {
          code = s.code;
        } else {
          throw new Error("Не вказано file або code");
        }

        pre.textContent = code;

        copyBtn.addEventListener("click", (e) => {
          copyCode(code, e.currentTarget);
        });

      } catch (error) {
        console.error("❌ Помилка для " + s.title + ":", error);
        pre.textContent = "❌ Помилка завантаження (" + s.file + "): " + error.message;
        copyBtn.disabled = true;
      }
    }
  }
}

// Головна функція ініціалізації
async function init() {
  console.log("⚙️ Функція init() запущена");
  if (typeof SCRIPTS_DB !== "undefined" && Array.isArray(SCRIPTS_DB)) {
    await renderCards(SCRIPTS_DB);
  } else {
    console.error("❌ Змінну SCRIPTS_DB не знайдено!");
  }
}

// Переконуємося, що init() викликається після завантаження DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init(); // Якщо DOM вже завантажився
}

// ============================================================
// ПАСХАЛКА
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const badge = document.getElementById("secret-badge");
  
  if (badge) {
    badge.addEventListener("click", async () => {
      try {
        // Завантажуємо текст з потрібного файлу (вкажи свій шлях до файлу)
        const response = await fetch("data/secret.js");
        if (!response.ok) throw new Error("Файл не знайдено");
        
        const secretText = await response.text();
        
        // Копіюємо в буфер обміну
        await navigator.clipboard.writeText(secretText);
        
        // Візуальний відгук на бейджі
        const originalText = badge.textContent;
        badge.textContent = "🤫 Скопійовано секрет!";
        badge.style.borderColor = "#238636";
        badge.style.color = "#3fb950";

        setTimeout(() => {
          badge.textContent = originalText;
          badge.style.borderColor = "";
          badge.style.color = "";
        }, 2000);

      } catch (err) {
        console.error("Помилка пасхалки:", err);
      }
    });
  }
});
