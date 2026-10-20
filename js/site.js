/* ============================================================
   JS/SITE.JS — спільна логіка index.html та poshuk.html:
   поява при скролі, версія розширення в кнопці, живі цифри з баз,
   демо-консоль у hero, згортання вступу під час пошуку.
   ============================================================ */
(function () {
    "use strict";

    /* ---------- НАЛАШТУВАННЯ ---------- */
    // Звідки брати версію для кнопки «Реліз» на головній:
    var VERSION_FILE = "data/version.json"; // файл із версією (відносно сторінки)
    var VERSION_KEY = "version";            // назва поля з версією у цьому файлі
    var VERSION_PREFIX = "v";               // що писати перед версією

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    /* ---------- 1. Поява при скролі ---------- */
    function initReveal() {
        var items = $$("[data-rv]");
        items.forEach(function (el) {
            var sibs = $$("[data-rv]", el.parentNode).filter(function (n) { return n.parentNode === el.parentNode; });
            el.style.setProperty("--d", Math.min(sibs.indexOf(el), 5) * 0.08 + "s");
        });
        if (!("IntersectionObserver" in window) || reduce) {
            items.forEach(function (el) { el.classList.add("in"); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
        items.forEach(function (el) { io.observe(el); });
    }

    /* ---------- 2. Версія в кнопці розширення ---------- */
    // Читає VERSION_FILE і пише VERSION_PREFIX + версію у всі елементи [data-ext-version].
    // Якщо файл недоступний (наприклад, сторінку відкрито з диска) — лишається напис «Реліз».
    function initVersion() {
        var els = $$("[data-ext-version]");
        if (!els.length) return;
        fetch(VERSION_FILE, { cache: "no-cache" })
            .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)); })
            .then(function (j) {
                var v = j && j[VERSION_KEY];
                if (!v) return;
                els.forEach(function (el) { el.textContent = VERSION_PREFIX + v; el.title = "Версія: " + v; });
            })
            .catch(function () { /* лишаємо «Реліз» */ });
    }

    /* ---------- 3. Живі цифри з баз (чесні: рахуємо з даних) ---------- */
    function plural(n, one, few, many) {
        var m10 = n % 10, m100 = n % 100;
        if (m10 === 1 && m100 !== 11) return one;
        if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
        return many;
    }
    function setList(el, items) {
        if (!el) return;
        el.innerHTML = "";
        items.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; el.appendChild(li); });
    }
    function initStats() {
        // index: SCRIPTS_DB
        if (typeof SCRIPTS_DB !== "undefined" && Array.isArray(SCRIPTS_DB) && $("#scriptStats")) {
            var n = SCRIPTS_DB.length;
            var cats = SCRIPTS_DB.reduce(function (a, s) { if (a.indexOf(s.category) < 0) a.push(s.category); return a; }, []).length;
            setList($("#scriptStats"), [
                n + " " + plural(n, "готовий скрипт", "готові скрипти", "готових скриптів"),
                cats + " " + plural(cats, "категорія", "категорії", "категорій"),
                "Копіювання в один клік"
            ]);
        }
        // poshuk: ANSWERS_DB
        if (typeof ANSWERS_DB !== "undefined" && $("#dbStats")) {
            var sets = 0, items = 0;
            Object.keys(ANSWERS_DB).forEach(function (k) {
                sets++;
                var v = ANSWERS_DB[k];
                items += Array.isArray(v) ? v.length : Object.keys(v).length;
            });
            setList($("#dbStats"), [
                items + " " + plural(items, "відповідь", "відповіді", "відповідей"),
                sets + " " + plural(sets, "тема", "теми", "тем"),
                "Підсвітка збігів"
            ]);
        }
    }

    /* ---------- 4. Демо-консоль у hero (index) ---------- */
    function initConsole() {
        var out = $("#conOut"), chip = $("#conChip");
        if (!out) return;
        var token = 0;

        function addLine(cls, text) {
            var d = document.createElement("div");
            d.className = "s-line " + cls;
            d.textContent = text;
            out.appendChild(d);
            return d;
        }
        async function typeLine(cls, text, speed, my) {
            var d = addLine(cls, "");
            var caret = document.createElement("span");
            caret.className = "s-caret";
            d.appendChild(caret);
            for (var i = 1; i <= text.length; i++) {
                if (my !== token) return false;
                d.firstChild === caret ? d.insertBefore(document.createTextNode(text.slice(0, i)), caret)
                    : (d.firstChild.nodeValue = text.slice(0, i));
                await sleep(speed);
            }
            caret.remove();
            return true;
        }
        async function play() {
            var my = ++token;
            out.innerHTML = "";
            if (chip) chip.classList.remove("on");
            await sleep(500);
            if (my !== token) return;
            if (!(await typeLine("cmd dim", "// скопіював скрипт зі сторінки", 26, my))) return;
            await sleep(250);
            if (!(await typeLine("cmd", "(() => { /* вставлений скрипт */ })()", 22, my))) return;
            await sleep(600); if (my !== token) return;
            addLine("ok", "✓ Знайдено питань: 24");
            await sleep(380); if (my !== token) return;
            addLine("ok", "✓ Позначено відповідей: 24");
            await sleep(300); if (my !== token) return;
            addLine("dim", "undefined");
            if (chip) chip.classList.add("on");
            await sleep(4200);
            if (my === token) play();
        }

        if (reduce) { // статично: одразу фінал
            addLine("cmd dim", "// скопіював скрипт зі сторінки");
            addLine("cmd", "(() => { /* вставлений скрипт */ })()");
            addLine("ok", "✓ Знайдено питань: 24");
            addLine("ok", "✓ Позначено відповідей: 24");
            addLine("dim", "undefined");
            return;
        }
        play();
        document.addEventListener("visibilitychange", function () {
            if (document.hidden) token++; else play();
        });
    }

    /* ---------- 5. Poshuk: вступ згортається, коли користувач почав шукати ---------- */
    function initPoshuk() {
        var input = $("#search");
        if (!input || !document.body.classList.contains("s-poshuk")) return;
        function sync() { document.body.classList.toggle("has-query", input.value.trim().length > 0); }
        input.addEventListener("input", sync);
        var clear = $("#clear");
        if (clear) clear.addEventListener("click", function () { setTimeout(sync, 0); });
        sync();
    }

    function init() { initReveal(); initVersion(); initStats(); initConsole(); initPoshuk(); }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
