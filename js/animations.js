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
        ready(function () { initNeonField(true); }); // лише статичні крапки, без руху й ліній
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

    /* ---------- Результати пошуку (poshuk.html) ----------
       Картки з'являються при скролі (як на index.html), а не всі
       одразу при рендері. Каскад: 0.05с × номер у групі (макс. 10). */
    function initResults() {
        var results = document.getElementById("results");
        if (!results) return;

        var STEP = 50;        // мс між сусідніми картками
        var STAGGER_MAX = 10; // після 10-ї затримка більше не росте
        var lastSignature = null;
        var waiting = new Set();
        var io = null;

        function show(el, i) {
            waiting.delete(el);
            el.style.setProperty("--d", Math.min(i, STAGGER_MAX) * STEP + "ms");
            el.classList.add("in");
        }

        if ("IntersectionObserver" in window) {
            io = new IntersectionObserver(
                function (entries) {
                    entries
                        .filter(function (e) { return e.isIntersecting; })
                        .sort(function (a, b) {
                            return a.boundingClientRect.top - b.boundingClientRect.top;
                        })
                        .forEach(function (entry, i) {
                            show(entry.target, i);
                            io.unobserve(entry.target);
                        });
                },
                { rootMargin: "0px 0px -30px 0px", threshold: 0.01 }
            );
        }

        function animate() {
            var children = Array.prototype.slice.call(results.children);
            var signature = children
                .map(function (c) { return c.textContent; })
                .join("\u0001");

            // Попередні (вже видалені з DOM) картки більше не слідкуємо
            if (io) io.disconnect();
            waiting.clear();

            // Той самий набір результатів (змінилась лише підсвітка) — без анімації,
            // щоб не мигало на кожну літеру
            var same = signature === lastSignature;
            lastSignature = signature;

            children.forEach(function (child) {
                if (same || !io) {
                    child.classList.add("in", "instant");
                } else {
                    waiting.add(child);
                    io.observe(child);
                }
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
                            if (io) io.unobserve(el);
                            show(el, i);
                        });
                    }
                });
            },
            { passive: true }
        );

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

    /* ---------- Неонове поле: випадкові крапки + лінії до курсора ----------
       Крапки розкидані довільно (з невеликим дрейфом). Коли курсор рухається,
       від найближчих крапок до нього «виростають» неонові лінії; коли він
       зупиняється — лінії втягуються назад. staticOnly = лише крапки. */
    function initNeonField(staticOnly) {
        var canvas = document.createElement("canvas");
        canvas.id = "neon-bg";
        canvas.setAttribute("aria-hidden", "true");
        document.documentElement.insertBefore(canvas, document.body);

        var ctx = canvas.getContext("2d");
        if (!ctx) {
            canvas.remove();
            return;
        }

        // ---------- НАЛАШТУВАННЯ ----------
        var CELL = 72;          // середня відстань між крапками, px (менше = більше крапок)
        var LINK_RADIUS = 190;  // з якої відстані від курсора крапки «тягнуть» лінії
        var MAX_LINES = 10;     // максимум ліній одночасно
        var IDLE_MS = 900;      // через скільки мс після зупинки курсора лінії згасають
        var DRIFT = 4;          // повільний «дрейф» крапок, px (0 = нерухомі)
        var COLORS = [          // неонові кольори ліній (RGB)
            [34, 211, 238],     // ціан
            [88, 166, 255],     // синій
            [167, 139, 250]     // фіолетовий
        ];
        // -----------------------------------

        var R2 = LINK_RADIUS * LINK_RADIUS;
        var w = 0;
        var h = 0;
        var dots = [];
        var raf = 0;
        var pointer = { x: 0, y: 0, sx: 0, sy: 0, on: false, last: -1e9, glow: 0 };

        function resizeCanvas() {
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        // Кольорові «температури» зірок — як на реальних астрофото:
        // здебільшого білі й тепло-білі, трохи блакитних (гарячих) і
        // помаранчевих (холодних), зваженою вибіркою.
        var STAR_TINTS = [
            { c: [255, 255, 255], w: 40 }, // біла
            { c: [255, 244, 221], w: 25 }, // тепло-біла
            { c: [202, 225, 255], w: 18 }, // блакитно-біла (гарячі зорі)
            { c: [255, 214, 170], w: 12 }, // помаранчева
            { c: [255, 179, 140], w: 5 }   // червонувата (рідкісні холодні зорі)
        ];
        var STAR_TINT_TOTAL = STAR_TINTS.reduce(function (s, t) { return s + t.w; }, 0);
        function pickTint() {
            var r = Math.random() * STAR_TINT_TOTAL;
            for (var i = 0; i < STAR_TINTS.length; i++) {
                r -= STAR_TINTS[i].w;
                if (r <= 0) return STAR_TINTS[i].c;
            }
            return STAR_TINTS[0].c;
        }

        // Три «яруси» зірок за розміром і яскравістю — переважна більшість
        // мають бути крихітними й ледь помітними, і лише одиниці — акцентними.
        var STAR_TIERS = [
            { p: 0.90, rMin: 0.4, rMax: 0.9, aMin: 0.12, aMax: 0.32, whiteChance: 0.88, star: false, twinkleChance: 0.10 }, // дрібні, тьмяні
            { p: 0.09, rMin: 0.9, rMax: 1.45, aMin: 0.32, aMax: 0.58, whiteChance: 0.6, star: false, twinkleChance: 0.35 }, // середні
            { p: 0.01, rMin: 1.5, rMax: 2.1, aMin: 0.65, aMax: 0.9, whiteChance: 0.35, star: true, twinkleChance: 0.7 }   // акцентні, з м'яким сяйвом
        ];
        function pickTier() {
            var r = Math.random();
            var acc = 0;
            for (var i = 0; i < STAR_TIERS.length; i++) {
                acc += STAR_TIERS[i].p;
                if (r <= acc) return STAR_TIERS[i];
            }
            return STAR_TIERS[STAR_TIERS.length - 1];
        }

        // «Розкидана сітка»: по одній випадковій крапці в кожній клітинці,
        // частину клітинок пропускаємо — виглядає довільно, але без згустків
        function build() {
            dots = [];
            var cols = Math.max(2, Math.round(w / CELL));
            var rows = Math.max(2, Math.round(h / CELL));
            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < cols; c++) {
                    if (Math.random() < 0.12) continue;

                    var tier = pickTier();

                    // Мерехтить лише частина зірок кожного ярусу — переважно
                    // серед середніх/акцентних, дрібні майже завжди стабільні
                    var doTwinkle = Math.random() < tier.twinkleChance;

                    // Колір: здебільшого чисто білий (особливо серед дрібних),
                    // пастельний відтінок — рідкісний штрих, а не правило
                    var tint = Math.random() < tier.whiteChance ? [255, 255, 255] : pickTint();

                    dots.push({
                        nx: (c + Math.random()) / cols,
                        ny: (r + Math.random()) / rows,
                        x: 0,
                        y: 0,
                        d: 1e9,
                        star: tier.star,
                        r: tier.rMin + Math.random() * (tier.rMax - tier.rMin),
                        a: tier.aMin + Math.random() * (tier.aMax - tier.aMin),
                        ph: Math.random() * 6.283,
                        // швидкість і сила мерехтіння — виразні лише в «мерехтливих» зірок,
                        // решта майже нерухомі (тонкий, ледь помітний подих)
                        sp: doTwinkle ? 0.25 + Math.random() * 0.9 : 0.05 + Math.random() * 0.08,
                        tw: doTwinkle ? 0.5 + Math.random() * 0.35 : 0.04 + Math.random() * 0.05,
                        twinkle: doTwinkle,
                        tint: tint,
                        col: COLORS[(Math.random() * COLORS.length) | 0],
                        p: 0,        // прогрес лінії 0..1 (скільки «виросла»)
                        want: false
                    });
                }

            }
        }

        function byDist(a, b) {
            return a.d - b.d;
        }

        function draw(now) {
            ctx.clearRect(0, 0, w, h);
            var t = now / 1000;
            var i;
            var d;
            var active = !staticOnly && pointer.on && now - pointer.last < IDLE_MS;

            // Плавно наздоганяємо курсор — лінії «тягнуться» за ним
            pointer.sx += (pointer.x - pointer.sx) * 0.35;
            pointer.sy += (pointer.y - pointer.sy) * 0.35;
            pointer.glow += ((active ? 1 : 0) - pointer.glow) * 0.08;

            var near = [];
            for (i = 0; i < dots.length; i++) {
                d = dots[i];
                d.x = d.nx * w + (staticOnly ? 0 : Math.sin(t * d.sp + d.ph) * DRIFT);
                d.y = d.ny * h + (staticOnly ? 0 : Math.cos(t * d.sp * 0.9 + d.ph) * DRIFT);
                var dx = d.x - pointer.sx;
                var dy = d.y - pointer.sy;
                var d2 = dx * dx + dy * dy;
                d.d = Math.sqrt(d2);
                if (active && d2 < R2) near.push(d);
            }
            if (near.length > MAX_LINES) {
                near.sort(byDist);
                near.length = MAX_LINES;
            }
            for (i = 0; i < near.length; i++) near[i].want = true;

            // Базові крапки — зорі: мерехтять і трохи світяться
            ctx.globalCompositeOperation = "source-over";
            for (i = 0; i < dots.length; i++) {
                d = dots[i];
                d.p += ((d.want ? 1 : 0) - d.p) * (d.want ? 0.16 : 0.07);
                if (d.p < 0.004) d.p = 0;
                d.want = false;

                // Мерехтіння: 0..1, кожна зоря — з власною фазою й швидкістю
                var flicker = staticOnly
                    ? 1
                    : 1 - d.tw + d.tw * (0.5 + 0.5 * Math.sin(t * d.sp + d.ph));
                var alpha = d.a * flicker;

                var tintStr = d.tint[0] + "," + d.tint[1] + "," + d.tint[2];

                if (d.star) {
                    // Єдиний плавний градієнт від яскравого центру до прозорого краю —
                    // без окремого суцільного кружечка всередині, щоб зоря не виглядала
                    // як заштрихована 3D-кулька, а як м'яка цятка світла
                    var glowR = d.r * 4;
                    var glow = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, glowR);
                    glow.addColorStop(0, "rgba(" + tintStr + "," + alpha + ")");
                    glow.addColorStop(0.22, "rgba(" + tintStr + "," + alpha * 0.75 + ")");
                    glow.addColorStop(0.55, "rgba(" + tintStr + "," + alpha * 0.18 + ")");
                    glow.addColorStop(1, "rgba(" + tintStr + ",0)");
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(d.x, d.y, glowR, 0, 6.2832);
                    ctx.fill();
                } else {
                    // тьмяні фонові зорі — теж із легким відтінком, а не чистим сірим
                    ctx.fillStyle = "rgba(" + tintStr + "," + alpha * 0.85 + ")";
                    ctx.beginPath();
                    ctx.arc(d.x, d.y, d.r, 0, 6.2832);
                    ctx.fill();
                }

                // На піку мерехтіння яскраві мерехтливі зорі дають тонкий
                // хрестоподібний відблиск — як дифракційні промені на фото неба
                if (d.star && d.twinkle && flicker > 0.86) {
                    var spikeA = (flicker - 0.86) / 0.14 * alpha * 0.75;
                    var sl = d.r * 9;
                    ctx.strokeStyle = "rgba(" + tintStr + "," + spikeA + ")";
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(d.x - sl, d.y);
                    ctx.lineTo(d.x + sl, d.y);
                    ctx.moveTo(d.x, d.y - sl);
                    ctx.lineTo(d.x, d.y + sl);
                    ctx.stroke();
                }
            }

            // Неонові лінії (адитивне змішування дає ефект світіння)
            ctx.globalCompositeOperation = "lighter";
            ctx.lineCap = "round";
            for (i = 0; i < dots.length; i++) {
                d = dots[i];
                if (d.p < 0.01) continue;

                var k = 1 - Math.min(1, d.d / LINK_RADIUS);   // ближче до курсора — яскравіше
                var s = d.p * (0.35 + 0.65 * k);
                var e = d.p * d.p * (3 - 2 * d.p);            // плавне «виростання»
                var ex = d.x + (pointer.sx - d.x) * e;
                var ey = d.y + (pointer.sy - d.y) * e;
                var rgb = d.col[0] + "," + d.col[1] + "," + d.col[2];

                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(ex, ey);
                ctx.strokeStyle = "rgba(" + rgb + "," + 0.06 * s + ")";
                ctx.lineWidth = 7;
                ctx.stroke();
                ctx.strokeStyle = "rgba(" + rgb + "," + 0.16 * s + ")";
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.strokeStyle = "rgba(" + rgb + "," + 0.9 * s + ")";
                ctx.lineWidth = 1;
                ctx.stroke();

                // Крапка, від якої йде лінія, теж світиться
                ctx.fillStyle = "rgba(" + rgb + "," + 0.14 * s + ")";
                ctx.beginPath();
                ctx.arc(d.x, d.y, 8, 0, 6.2832);
                ctx.fill();
                ctx.fillStyle = "rgba(" + rgb + "," + 0.9 * s + ")";
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r + 0.8, 0, 6.2832);
                ctx.fill();
            }

            // М'яка точка світла на самому курсорі, куди збігаються лінії
            if (pointer.glow > 0.01) {
                var g = ctx.createRadialGradient(pointer.sx, pointer.sy, 0, pointer.sx, pointer.sy, 56);
                g.addColorStop(0, "rgba(88,166,255," + 0.22 * pointer.glow + ")");
                g.addColorStop(1, "rgba(88,166,255,0)");
                ctx.fillStyle = g;
                ctx.fillRect(pointer.sx - 56, pointer.sy - 56, 112, 112);
            }
        }

        function loop(now) {
            raf = requestAnimationFrame(loop);
            if (document.hidden) return;
            draw(now);
        }

        function onPointer(e) {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
            if (!pointer.on) {
                pointer.sx = e.clientX;
                pointer.sy = e.clientY;
            }
            pointer.on = true;
            pointer.last = performance.now();
        }

        resizeCanvas();
        build();

        if (staticOnly) {
            draw(0);
        } else {
            window.addEventListener("pointermove", onPointer, { passive: true });
            window.addEventListener("pointerdown", onPointer, { passive: true });
            document.documentElement.addEventListener("mouseleave", function () {
                pointer.on = false;
            });
            raf = requestAnimationFrame(loop);
        }

        // Зміна розміру вікна: крапки зберігають відносні позиції;
        // перегенеровуємо лише якщо площа помітно змінилась (щоб не мигало
        // від зникнення/появи адресного рядка на телефоні)
        var resizeTimer;
        window.addEventListener("resize", function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                var oldArea = w * h;
                resizeCanvas();
                var ratio = (w * h) / (oldArea || 1);
                if (ratio > 1.35 || ratio < 0.74) build();
                if (staticOnly) draw(0);
            }, 150);
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

        var VISIBLE_HEIGHT = 320;      // max-height блоку pre у style.css
        var CHARS_PER_SECOND = 300;    // ШВИДКІСТЬ ДРУКУ: символів за секунду (менше = повільніше)
        var MAX_TYPING_MS = 3000;      // скільки максимум «друкуємо»; решта коду відкривається одразу
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

            var maxChars = Math.floor((CHARS_PER_SECOND * MAX_TYPING_MS) / 1000);
            var startTime = performance.now();
            var pos = 0;     // позиція в тексті
            var typed = 0;   // скільки видимих символів (без пробілів) уже «надруковано»
            var rest = document.createRange();
            var cur = document.createRange();

            current = { pre: pre, raf: 0 };

            function frame(now) {
                // Скільки символів мало бути надруковано до цього моменту
                var target = Math.floor(((now - startTime) / 1000) * CHARS_PER_SECOND);

                // Просуваємось по одному символу; пробіли/переноси не рахуються і
                // проскакуються миттєво, тому темп однаковий незалежно від відступів
                while (typed < target && pos < limit) {
                    if (!/\s/.test(text.charAt(pos))) typed++;
                    pos++;
                }
                while (pos < limit && /\s/.test(text.charAt(pos))) pos++;

                if (pos >= limit || typed >= maxChars) {
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
        initNeonField(false);
        initTyping();
    });
})();
