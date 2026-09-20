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
        var STAGGER_MAX = 10; // після 10-ї картки затримка більше не росте

        function animate() {
            var children = Array.prototype.slice.call(results.children);
            var signature = children
                .map(function (c) { return c.textContent; })
                .join("\u0001");

            // Той самий набір результатів (змінилась лише підсвітка) — не мигаємо
            if (signature === lastSignature) return;
            lastSignature = signature;

            children.forEach(function (child, i) {
                child.style.setProperty("--i", Math.min(i, STAGGER_MAX));
                child.classList.add("enter");
            });
        }

        new MutationObserver(animate).observe(results, { childList: true });

        // Вибір категорії завжди програє каскад заново, навіть якщо набір
        // карток збігся (capture-фаза: спрацьовує ДО обробника чипа в search.js)
        var chips = document.getElementById("chips");
        if (chips) {
            chips.addEventListener(
                "click",
                function (e) {
                    if (e.target.closest(".chip")) lastSignature = null;
                },
                true
            );
        }

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

    /* ---------- Підсвітка за курсором (лише пристрої з мишею) ---------- */
    function initSpotlight() {
        if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
            return;
        }

        var root = document.documentElement;
        var x = 0;
        var y = 0;
        var raf = 0;

        function apply() {
            raf = 0;
            root.style.setProperty("--mx", x + "px");
            root.style.setProperty("--my", y + "px");
        }

        window.addEventListener(
            "pointermove",
            function (e) {
                if (e.pointerType === "touch") return;
                x = e.clientX;
                y = e.clientY;
                root.style.setProperty("--spot", "1");
                if (!raf) raf = requestAnimationFrame(apply);
            },
            { passive: true }
        );

        // Курсор покинув вікно — плавно гасимо підсвітку
        document.documentElement.addEventListener("mouseleave", function () {
            root.style.setProperty("--spot", "0");
        });
    }

    /* ---------- Ефект друку при розгортанні коду ---------- */
    function initTyping() {
        if (typeof Highlight === "undefined" || !window.CSS || !CSS.highlights) return;

        var untyped = new Highlight();
        var caret = new Highlight();
        caret.priority = 1; // каретка перекриває «прозорий» стиль
        CSS.highlights.set("code-untyped", untyped);
        CSS.highlights.set("code-caret", caret);

        var VISIBLE_HEIGHT = 320; // max-height блоку pre у style.css
        var current = null;

        function stop() {
            if (!current) return;
            cancelAnimationFrame(current.raf);
            untyped.clear();
            caret.clear();
            current = null;
        }

        function type(pre) {
            stop();

            var node = pre.firstChild;
            if (!node || node.nodeType !== 3) return;

            var text = node.data;
            var len = text.length;
            if (!len) return;

            // «Друкуємо» лише те, що влізає у видиму частину блоку;
            // решта (нижче прокрутки) відкривається одразу після цього.
            var cs = getComputedStyle(pre);
            var lh = parseFloat(cs.lineHeight);
            if (!lh || isNaN(lh)) lh = parseFloat(cs.fontSize) * 1.5;
            var lines = Math.ceil(VISIBLE_HEIGHT / lh) + 1;

            var limit = len;
            var idx = -1;
            for (var n = 0; n < lines; n++) {
                idx = text.indexOf("\n", idx + 1);
                if (idx === -1) { limit = len; break; }
                limit = idx;
            }

            var duration = Math.min(1600, Math.max(500, limit * 1.2));
            var startTime = performance.now();
            var pos = 0;
            var rest = document.createRange();
            var cur = document.createRange();

            current = { pre: pre, raf: 0 };

            function frame(now) {
                var t = Math.min(1, (now - startTime) / duration);
                var target = Math.floor(limit * t);
                if (target > pos) pos = target;

                // пробіли та переноси «друкуються» миттєво
                while (pos < limit && /\s/.test(text.charAt(pos))) pos++;

                if (pos >= limit || t >= 1) {
                    stop(); // відкриваємо решту тексту
                    return;
                }

                rest.setStart(node, pos);
                rest.setEnd(node, len);
                untyped.clear();
                untyped.add(rest);

                cur.setStart(node, pos);
                cur.setEnd(node, pos + 1);
                caret.clear();
                caret.add(cur);

                current.raf = requestAnimationFrame(frame);
            }

            // перший кадр одразу, щоб не було миготіння повного тексту
            frame(startTime);
        }

        // Спрацьовує ПІСЛЯ обробника кнопки в main.js, тож клас .collapsed вже оновлено
        document.addEventListener("click", function (e) {
            var btn = e.target.closest(".toggle-btn");
            if (!btn) return;

            var wrap = btn.closest(".code-wrap");
            var pre = wrap && wrap.querySelector("pre");
            if (!pre) return;

            if (wrap.classList.contains("collapsed")) {
                if (current && current.pre === pre) stop(); // згорнули посеред друку
            } else {
                type(pre);
            }
        });
    }

    ready(function () {
        initReveal();
        initResults();
        initGlitch();
        initSpotlight();
        initTyping();
    });
})();
