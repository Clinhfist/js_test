const QA = {
    "Що потрібно зробити після завершення групування з ТЗД?": "натиснути кнопку «Закінчити»",
    "Що потрібно зробити після заповнення тари у Put-to-Light?": "відсканувати ШК порту та ШК тари",
    "Що потрібно робити після завершення роботи з електровізком?": "очистити, вимкнути та повідомити про несправності",
    "Що необхідно підготувати перед групуванням?": "порожні клітки/піддони та зону накопичення",
    "Яке обладнання використовується для сканування на механізованих терміналах?": "сканер (ТЗД)",
    "Що означає зелений світловий індикатор під час сканування?": "штрихкод успішно зчитано",
    "На яку висоту необхідно піднімати вантаж при переміщенні роклою?": "5–10 см від підлоги",
    "Яке відправлення потрібно переміщувати в першу чергу?": "з наліпкою «Д-Д»",
    "Що потрібно перевірити перед роботою зі штабелером?": "корпус, вила, щоглу та кнопки управління",
    "Як потрібно рухатись зі штабелером (порядок використання обладнання для переміщення)?": "повільно, особливо з піднятим вантажем",
    "Як потрібно переміщувати шини, якщо вони більші за піддон?": "перекочувати, не відпускаючи та штовхаючи перед собою",
    "Що потрібно зробити з проблемними відправленнями?": "перемістити у місце для проблемних відправлень",
    "Що необхідно перевірити перед викладанням відправлень?": "пакування на пошкодження та маркування",
    "Як потрібно розміщувати пласкі відправлення на спеціальному візку?": "вертикально у спеціальний паз",
    "Що заборонено при викладанні відправлень?": "багатошарове викладання відправлень",
    "Як правильно викладати відправлення на стрічку?": "в один ряд без виступу за межі стрічки",
    "Який процес виконується після сканування?": "сортування за напрямками",
    "Яка максимально допустима висота складених лотків?": "140 см"
};
// ===== Налаштування затримки =====
const CLICK_DELAY_MS = 100; // затримка між кліками (мс). Зміни це значення за потреби.
function cleanText(t) {
    return t.replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .replace(/\\/g, "/")
        .trim();
}
let highlighted = 0;
let clicked = 0;
// Крок 1: збираємо всі елементи, які треба клікнути, і одразу підсвічуємо
const toClick = [];
document.querySelectorAll('[data-field="questionText"]').forEach(qEl => {
    const qTextRaw = cleanText(qEl.textContent);
    const entry = Object.entries(QA).find(([key]) => {
        return cleanText(key).replace(/[?:;]$/, "") === qTextRaw.replace(/[?:;]$/, "");
    });
    if (!entry) return;
    const correctAnswer = cleanText(entry[1]);
    const card = qEl.closest('.question-card') || qEl.parentElement.parentElement.parentElement.parentElement;
    card.querySelectorAll('[data-field="optionText"]').forEach(opt => {
        if (cleanText(opt.textContent) === correctAnswer) {
            // Візуальне підсвічування — робимо одразу, без затримки
            opt.style.cssText = "background: #c8f7c5 !important; border: 2px solid #2ecc71 !important; border-radius: 4px; font-weight: bold;";
            highlighted++;
            // Визначаємо, що саме клікати, але сам клік відкладаємо
            const input = opt.closest('label') || opt.parentElement.querySelector('input') || opt.querySelector('input');
            const clickTarget = input || opt.closest('.option-row') || opt.closest('label') || opt;
            toClick.push(clickTarget);
        }
    });
});
// Крок 2: клікаємо по черзі із затримкою CLICK_DELAY_MS між кожним кліком
function clickWithDelay(index) {
    if (index >= toClick.length) {
        console.log(`✅ Роботу завершено. Підсвічено: ${highlighted} | Автоматично обрано (клікнуто): ${clicked}`);
        return;
    }
    toClick[index].click();
    clicked++;
    setTimeout(() => clickWithDelay(index + 1), CLICK_DELAY_MS);
}
clickWithDelay(0);