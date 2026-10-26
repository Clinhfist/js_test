const QA = {
 "Коли для обрешетування необхідно передбачити пази під вила рокли з короткого боку?" : "Для обрешетування завдовжки понад 170 см та обрешетування під мототехніку.",
"Скільки саморізів необхідно використовувати для з'єднання вертикальних стійок з основою та верхньою частиною?":"Один.",
"Якою має бути основа обрешетування для некрихкого плаского відправлення?":"Рамкою з чотирьох дощок або рейок, встановлених на торець по периметру відправлення.",
"Яка мінімальна кількість саморізів використовується для виготовлення основи обрешетування?":"Два саморізи.",
"Які вимоги до візуального вигляду готового обрешетування?":"Кути мають бути прямими, а сторони паралельними.",
"Який максимальний зазор допускається між горизонтальними рейками основи для відправлення вагою до 30 кг?":"30 см із допустимим відхиленням ±20%.",
"Як виготовляється основа обрешетування для крихкого плаского відправлення товщиною до 5 см?":"Рейки розміщуються за принципом 1-1-1 паралельно одна одній та на однаковій відстані.",
"Що потрібно зробити, якщо довжина прольоту однієї зі сторін перевищує 80 см?":"Встановити дві та більше діагоналі через кожні 80 см.",
"Що необхідно зробити, якщо довжина прольоту на боковій або торцевій стінці менша за 80 см?":"Закріпити діагональ від нижнього кута до протилежного верхнього.",
"Що обов'язково потрібно зробити з ЕН під час маркування обрешетування?":"Дублювати ЕН та розмістити її в дока-фіксі поряд із маркуванням.",
"Чим можна замінити два саморізи під час з'єднання деревини?":"Трьома або більше цвяхами.",
"Від чого залежить спосіб виготовлення обрешетування?":"Від фактичної ваги, розмірів та типу відправлення.",
"Для чого під час виготовлення обрешетування мототехніки необхідно фіксувати колеса розкосами?":"Щоб запобігти вільному переміщенню відправлення всередині обрешетування.",
"Чим необхідно перекладати частини відправлення, які можуть контактувати з деревиною та пошкодитися?":"Поліпропіленовим полотном, гофрокартоном, пінопластом або стрейч-плівкою.",
"Якою має бути мінімальна товщина ущільнювача між відправленням і деревиною?":"0,5 см.",
"Де наноситься маркування на обрешетуванні заввишки до 100 см?":"Зверху у лівому верхньому куті.",
"Як має бути захищена верхня частина обрешетування під час стрейчування?":"Верхня частина щільно обгортається стрейч-плівкою для захисту від пилу, вологи та бруду.",
"Яка максимальна відстань допускається від крайньої точки відправлення до обрешетування?":"5 см із допустимим відхиленням ±10%.",
"Яка конструкція основи використовується для відправлення вагою понад 30 кг?":"Конструкція за принципом піддона: три паралельні рейки на торець і поперечні рейки з відстанню до 30 см.",
"Яка вимога встановлена щодо зайвих частин каркаса?":"Усі зайві частини мають бути обрізані."

};

// ===== Налаштування затримки =====
const CLICK_DELAY_MS = 100;

// Агресивна нормалізація: залишаємо лише літери й цифри, все інше (апострофи
// прямі/фігурні, крапки, коми, дужки, пробіли, зворотні слеші) відкидаємо.
// Це і був корінь проблеми з LEAN/AWIS раніше — тут той самий фікс.
function normalize(t) {
    return t
        .toLowerCase()
        .normalize("NFKC")
        .replace(/[^\p{L}\p{N}]/gu, "");
}

let highlighted = 0;
let clicked = 0;
const unmatchedQuestions = [];
const unmatchedOptions = [];

const qaNormalized = Object.entries(QA).map(([q, a]) => ({
    qNorm: normalize(q),
    qOrig: q,
    aNorm: normalize(a),
    aOrig: a
}));

const toClick = [];

document.querySelectorAll('[data-field="questionText"]').forEach(qEl => {
    const qTextRaw = qEl.textContent;
    const qNorm = normalize(qTextRaw);

    const entry = qaNormalized.find(e => e.qNorm === qNorm);

    if (!entry) {
        unmatchedQuestions.push(qTextRaw.trim());
        return;
    }

    const card = qEl.closest('.question-card')
        || qEl.closest('[class*="question"]')
        || qEl.parentElement?.parentElement?.parentElement?.parentElement;

    if (!card) {
        console.warn("⚠️ Не знайдено картку питання для:", qTextRaw.trim());
        return;
    }

    let foundOption = false;
    card.querySelectorAll('[data-field="optionText"]').forEach(opt => {
        if (normalize(opt.textContent) === entry.aNorm) {
            opt.style.cssText = "background: #c8f7c5 !important; border: 2px solid #2ecc71 !important; border-radius: 4px; font-weight: bold;";
            highlighted++;
            foundOption = true;

            const input = opt.closest('label') || opt.parentElement?.querySelector('input') || opt.querySelector('input');
            const clickTarget = input || opt.closest('.option-row') || opt.closest('label') || opt;
            toClick.push(clickTarget);
        }
    });

    if (!foundOption) {
        unmatchedOptions.push({
            question: entry.qOrig,
            expectedAnswer: entry.aOrig,
            actualOptions: Array.from(card.querySelectorAll('[data-field="optionText"]')).map(o => o.textContent.trim())
        });
    }
});

function clickWithDelay(index) {
    if (index >= toClick.length) {
        console.log(`✅ Роботу завершено. Підсвічено: ${highlighted} | Клікнуто: ${clicked}`);
        if (unmatchedQuestions.length) {
            console.warn(`⚠️ Питання без збігу в словнику (${unmatchedQuestions.length}):`, unmatchedQuestions);
        }
        if (unmatchedOptions.length) {
            console.warn(`⚠️ Питання знайдено, але відповідь не збіглась (${unmatchedOptions.length}):`, unmatchedOptions);
        }
        return;
    }

    toClick[index].click();
    clicked++;

    setTimeout(() => clickWithDelay(index + 1), CLICK_DELAY_MS);
}

clickWithDelay(0);