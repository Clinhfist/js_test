/* ============================================================
   JS/EXT.JS — сторінка розширення: поява при скролі, лічильники з реальної бази,
   демо-автопілот, інтерактивний розбір кнопок, копіювання адрес.
   Ніяких залежностей; без JS сторінка повністю читається (клас .x-js ставиться інлайн).
   ============================================================ */
(function () {
    "use strict";

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

    /* ---------- 1. Поява при скролі (з невеликою «хвилею» між сусідами) ---------- */
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

    /* ---------- 2. Цифри: беремо з реальної бази (data/answers.json), якщо вона доступна ---------- */
    function animateCount(el) {
        var target = parseFloat(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        if (reduce || isNaN(target)) { el.textContent = target + suffix; return; }
        var start = null, dur = 1200;
        function tick(ts) {
            if (start === null) start = ts;
            var p = Math.min(1, (ts - start) / dur);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function initStats() {
        var box = $(".x-stats");
        if (!box) return;

        // Чесні цифри: рахуємо із самої бази. Не вдалося завантажити — лишаються значення з розмітки.
        fetch("data/answers.json").then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (db) {
            var sets = 0, items = 0;
            Object.keys(db).forEach(function (k) {
                sets++;
                items += Array.isArray(db[k]) ? db[k].length : Object.keys(db[k]).length;
            });
            $("#statSets").setAttribute("data-count", sets);
            $("#statItems").setAttribute("data-count", items);
        }).catch(function () { /* лишаємо значення за замовчуванням */ });

        var started = false;
        function run() {
            if (started) return; started = true;
            $$("[data-count]", box).forEach(animateCount);
        }
        if (!("IntersectionObserver" in window)) { run(); return; }
        var io = new IntersectionObserver(function (en) {
            if (en[0].isIntersecting) { run(); io.disconnect(); }
        }, { threshold: 0.4 });
        io.observe(box);
    }

    /* ---------- 3. Демо-автопілот у hero ---------- */
    function initDemo() {
        var out = $("#demoOut"), badge = $("#demoBadge"), go = $("#demoGo"), chip = $(".x-chip-1");
        if (!out || !badge || !go) return;

        function line(txt, ok) {
            var d = document.createElement("div");
            d.className = "pp-line" + (ok ? " ok" : "");
            d.textContent = txt;
            out.appendChild(d);
        }
        function setBadge(txt, miss) {
            badge.textContent = txt;
            badge.className = "x-badge show" + (miss ? " miss" : "");
        }
        function reset() {
            out.innerHTML = "";
            badge.className = "x-badge"; badge.textContent = "";
            go.classList.remove("busy");
            if (chip) chip.classList.remove("on");
        }
        var script = [
            [500,  function () { go.classList.add("busy"); line("▶ Запуск: матеріал → тест"); }],
            [1700, function () { line("Презентація: гортаю слайди…"); }],
            [3100, function () { line("Завершити → Перейти до тестування"); }],
            [4300, function () { line("Почати тест…"); }],
            [5500, function () { line("Питань: 24 · Знайдено: 24", true); setBadge("OK"); if (chip) chip.classList.add("on"); }],
            [6900, function () { line("Завершити ✓ тест відправлено", true); setBadge("✓"); go.classList.remove("busy"); }]
        ];
        var timers = [];
        function play() {
            reset();
            script.forEach(function (s) { timers.push(setTimeout(s[1], s[0])); });
            timers.push(setTimeout(play, 11500));
        }
        function stop() { timers.forEach(clearTimeout); timers = []; }

        if (reduce) { script.forEach(function (s) { s[1](); }); return; } // статично: одразу фінал

        play();
        document.addEventListener("visibilitychange", function () {
            if (document.hidden) stop(); else play();
        });
    }

    /* ---------- 4. Розбір кнопок: вкладки + підсвітка макета й опису ---------- */
    function initGuide() {
        var guide = $(".x-guide");
        if (!guide) return;
        var tabs = $$(".x-tabs [data-view]");

        function clear() { $$(".is-active", guide).forEach(function (e) { e.classList.remove("is-active"); }); }
        function activate(id) {
            clear();
            $$('[data-id="' + id + '"]', guide).forEach(function (e) { e.classList.add("is-active"); });
        }
        function setView(view) {
            tabs.forEach(function (t) {
                var on = t.getAttribute("data-view") === view;
                t.classList.toggle("is-on", on);
                t.setAttribute("aria-selected", on ? "true" : "false");
            });
            $$("[data-pane]", guide).forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== view; });
            clear();
        }
        tabs.forEach(function (t) {
            t.addEventListener("click", function () { setView(t.getAttribute("data-view")); });
        });

        function idOf(e) { var el = e.target.closest ? e.target.closest("[data-id]") : null; return el && guide.contains(el) ? el : null; }
        guide.addEventListener("mouseover", function (e) { var el = idOf(e); if (el) activate(el.getAttribute("data-id")); });
        guide.addEventListener("mouseleave", clear);
        guide.addEventListener("focusin", function (e) { var el = idOf(e); if (el) activate(el.getAttribute("data-id")); });
        guide.addEventListener("click", function (e) {
            var el = idOf(e);
            if (!el) return;
            var id = el.getAttribute("data-id");
            activate(id);
            // клік по макету — прокручуємо до пояснення (корисно на телефоні, де опис нижче)
            if (el.closest(".x-guide-mock")) {
                var li = $('.x-legend li[data-id="' + id + '"]', guide);
                if (li && li.getBoundingClientRect().top > window.innerHeight - 80) {
                    li.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
                }
            }
        });
    }

    /* ---------- 5. Копіювання адрес chrome://… ---------- */
    function initCopy() {
        document.addEventListener("click", function (e) {
            var btn = e.target.closest ? e.target.closest("[data-copy]") : null;
            if (!btn) return;
            navigator.clipboard.writeText(btn.getAttribute("data-copy")).then(function () {
                var html = btn.innerHTML;
                btn.textContent = "Скопійовано!";
                btn.classList.add("copied");
                setTimeout(function () { btn.innerHTML = html; btn.classList.remove("copied"); }, 1800);
            }).catch(function (err) { console.error("Не вдалося скопіювати:", err); });
        });
    }

    function init() { initReveal(); initStats(); initDemo(); initGuide(); initCopy(); }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
