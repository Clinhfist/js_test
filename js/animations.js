/* ============================================================
   JS/ANIMATIONS.JS — керує лише анімаціями. Не змінює вміст,
   дані чи логіку main.js / search.js.
   Підключається в <head> (щоб клас .js з'явився до першого малювання).
   ============================================================ */
(function () {
    "use strict";

    // Поважаємо системне «зменшити рух»: нічого не ховаємо і не анімуємо
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    document.documentElement.classList.add("js");

    // Елементи, що з'являються при скролі (мають збігатися з animations.css)
    var REVEAL_SELECTOR =
        ".section-title, .section-sub, .step, .warning, .cat-title, #cards .card, footer .container";

    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

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

    ready(function () {
        initReveal();
        initResults();
    });
})();
