/* ============================================================
   JS/MAIN.JS — Логіка відображення карток та копіювання
   ============================================================ */

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function loadScriptCode(file) {
    const response = await fetch("data/" + file);
    if (!response.ok) {
        throw new Error("HTTP Status " + response.status);
    }
    return await response.text();
}

function copyCode(text, buttonEl) {
    if (!text) return;
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

async function renderCards(scripts) {
    const cardsEl = document.getElementById("cards");

    if (!cardsEl) {
        console.error("❌ Елемент #cards не знайдено на сторінці.");
        return;
    }

    cardsEl.innerHTML = "";

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
                '<div class="card-actions">' +
                '<span class="tag">' + escapeHtml(s.tag) + '</span>' +
                '<button class="copy-btn" type="button">Копіювати</button>' +
                '</div>' +
                '</div>' +
                '<div class="code-wrap collapsed">' +
                '<pre class="mono">Завантаження коду...</pre>' +
                '<button class="toggle-btn" type="button">Показати код ▾</button>' +
                '</div>';

            cardsEl.appendChild(card);

            const codeWrap = card.querySelector(".code-wrap");
            const pre = card.querySelector(".mono");
            const copyBtn = card.querySelector(".copy-btn");
            const toggleBtn = card.querySelector(".toggle-btn");

            toggleBtn.addEventListener("click", () => {
                const isCollapsed = codeWrap.classList.toggle("collapsed");
                toggleBtn.textContent = isCollapsed ? "Показати код ▾" : "Сховати код ▴";
            });

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

                // Копіюємо актуальне значення pre.textContent
                copyBtn.addEventListener("click", () => {
                    copyCode(pre.textContent, copyBtn);
                });

            } catch (error) {
                console.error("❌ Помилка для " + s.title + ":", error);
                pre.textContent = "❌ Помилка завантаження (" + s.file + "): " + error.message;
                copyBtn.disabled = true;
            }
        }
    }
}

async function init() {
    if (typeof SCRIPTS_DB !== "undefined" && Array.isArray(SCRIPTS_DB)) {
        await renderCards(SCRIPTS_DB);
    } else {
        console.error("❌ Змінну SCRIPTS_DB не знайдено!");
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

// Пасхалка
document.addEventListener("DOMContentLoaded", () => {
    const badge = document.getElementById("secret-badge");
    if (badge) {
        badge.addEventListener("click", async () => {
            try {
                const response = await fetch("data/secret.js");
                if (!response.ok) throw new Error("Файл не знайдено");
                const secretText = await response.text();
                await navigator.clipboard.writeText(secretText);

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