/* ============================================================
   JS/ANIMATIONS.JS — керує лише анімаціями. Не змінює вміст,
   дані чи логіку main.js / search.js.
   Підключається в <head> (щоб клас .js з'явився до першого малювання).
   ============================================================ */
(function () {
    "use strict";

    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    /* ---------- Вібро-відгук на телефоні (не є «рухом» на екрані,
       тому працює й при «зменшити рух») ---------- */
    function buzz(pattern) {
        try {
            if (navigator.vibrate) navigator.vibrate(pattern);
        } catch (e) { /* не підтримується — ігноруємо */ }
    }

    function initHaptics() {
        // Вібруємо, коли main.js успішно скопіював код (кнопка отримує клас .copied)
        new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                var t = m.target;
                if (
                    t.classList &&
                    t.classList.contains("copy-btn") &&
                    t.classList.contains("copied") &&
                    (m.oldValue || "").indexOf("copied") === -1
                ) {
                    buzz(25);
                }
            });
        }).observe(document.body, {
            subtree: true,
            attributes: true,
            attributeFilter: ["class"],
            attributeOldValue: true
        });

        // Пасхалка на бейджі — подвійний короткий «бзз»
        var badge = document.getElementById("secret-badge");
        if (badge) {
            badge.addEventListener("click", function () {
                buzz([20, 50, 20]);
            });
        }
    }

    ready(initHaptics);

    // Поважаємо системне «зменшити рух»: нічого не ховаємо і не анімуємо
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    document.documentElement.classList.add("js");

    // Елементи, що з'являються при скролі (мають збігатися з animations.css)
    var REVEAL_SELECTOR =
        ".section-title, .section-sub, .step, .warning, .cat-title, #cards .card, footer .container";

    /* ---------- Поява при скролі (index.html) ---------- */
    function initReveal() {
        var waiting = new Set();

        function show(el) {
            waiting.delete(el);
            el.classList.add("in");
        }

        if (!("IntersectionObserver" in window)) {
            document.querySelectorAll(REVEAL_SELECTOR).forEach(show);
            return;
        }

        var io = new IntersectionObserver(
            function (entries) {
                // Каскад: зверху вниз, до 6 кроків по 70мс
                var visible = entries
                    .filter(function (e) { return e.isIntersecting; })
                    .sort(function (a, b) {
                        return a.boundingClientRect.top - b.boundingClientRect.top;
                    });

                visible.forEach(function (entry, i) {
                    entry.target.style.setProperty("--d", Math.min(i, 5) * 70 + "ms");
                    show(entry.target);
                    io.unobserve(entry.target);
                });
            },
            { rootMargin: "0px 0px -30px 0px", threshold: 0.01 }
        );

        function watch(el) {
            if (el.nodeType !== 1) return;
            var nodes = el.matches(REVEAL_SELECTOR) ? [el] : [];
            nodes = nodes.concat(Array.prototype.slice.call(el.querySelectorAll(REVEAL_SELECTOR)));
            nodes.forEach(function (n) {
                if (n.classList.contains("in") || waiting.has(n)) return;
                waiting.add(n);
                io.observe(n);
            });
        }

        document.querySelectorAll(REVEAL_SELECTOR).forEach(watch);

        // Картки скриптів main.js додає в #cards динамічно
        var cards = document.getElementById("cards");
        if (cards) {
            new MutationObserver(function (mutations) {
                mutations.forEach(function (m) {
                    m.addedNodes.forEach(watch);
                });
            }).observe(cards, { childList: true });
        }

        // Страховка: якщо доскролили до самого низу — показати все, що залишилось
        var ticking = false;
        window.addEventListener(
            "scroll",
            function () {
                if (ticking || !waiting.size) return;
                ticking = true;
                requestAnimationFrame(function () {
                    ticking = false;
                    var atBottom =
                        window.innerHeight + window.scrollY >=
                        document.documentElement.scrollHeight - 2;
                    if (atBottom) {
                        Array.from(waiting).forEach(function (el, i) {
                            el.style.setProperty("--d", Math.min(i, 5) * 70 + "ms");
                            show(el);
                            io.unobserve(el);
                        });
                    }
                });
            },
            { passive: true }
        );
    }

    /* ---------- Результати пошуку (poshuk.html) ---------- */
    function initResults() {
        var results = document.getElementById("results");
        if (!results) return;

        var lastSignature = null;

        function animate() {
            var children = Array.prototype.slice.call(results.children);
            var signature = children
                .map(function (c) { return c.textContent; })
                .join("\u0001");

            // Той самий набір результатів (змінилась лише підсвітка) — не мигаємо
            if (signature === lastSignature) return;
            lastSignature = signature;

            children.forEach(function (child, i) {
                child.style.setProperty("--i", Math.min(i, 8));
                child.classList.add("enter");
            });
        }

        new MutationObserver(animate).observe(results, { childList: true });

        // Початковий список search.js вже відрендерив до нашого запуску
        animate();
    }

    /* ---------- Глітч на бейджі-пасхалці ---------- */
    function initGlitch() {
        var badge = document.getElementById("secret-badge");
        if (!badge) return;

        var body = document.body;
        var html = document.documentElement;

        badge.addEventListener("click", function () {
            // Центр нахилу — середина видимого екрана, а не всієї (довгої) сторінки
            body.style.transformOrigin = "50% " + (window.scrollY + window.innerHeight / 2) + "px";
            html.classList.add("glitch-page-on");

            // перезапуск анімації при повторних кліках
            body.classList.remove("glitch-page");
            void body.offsetWidth;
            body.classList.add("glitch-page");
        });

        body.addEventListener("animationend", function (e) {
            if (e.target !== body) return; // ігноруємо анімації дочірніх елементів
            body.classList.remove("glitch-page");
            html.classList.remove("glitch-page-on");
            body.style.transformOrigin = "";
        });
    }

    ready(function () {
        initReveal();
        initResults();
        initGlitch();
    });
})();
