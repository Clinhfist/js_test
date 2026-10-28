const QA = {
  "Згідно з філософією Масаакі Імаї, яка основна функція системи 5S, окрім підтримання чистоти?": "Виявлення прихованих проблем у процесах",
"Яке головне правило принципу «30 секунд» у контексті візуального контролю?": "Будь-яка людина повинна зрозуміти стан процесу за півхвилини",
"За стандартом кольорового кодування, який колір використовується для маркування зон зберігання «червоних міток»?": "Червоний",
"Що позначає коричневий колір у робочому просторі згідно з правилами 5S?": "Інвентар для прибирання та місця для сміття",
"При візуальній індикації стану запасів, про що свідчить жовтий колір?": "Необхідно почати поповнення при першій вільній хвилині",
"Яка дія є першочерговою перед початком впровадження кроку 1S (Сортування)?": "Зробити фото робочого простору у стані «ДО»",
"На якому етапі системи 5S створюється схема розміщення інструментів або структура папок на ПК?": "4S Стандартизація",
"Яка головна мета етапу 2S (Створення порядку) з точки зору часових витрат?": "Знайти будь-яку річ за 30 секунд",
"Яка з перелічених дій є типовою помилкою при впровадженні 5S?": "Підтримання порядку лише перед аудитом",
"Що згідно з матеріалом дає впровадження 5S безпосередньо працівнику?": "Менше стресу та швидший пошук документів",
"Що рекомендується робити з предметами, які позначені «червоними мітками»?": "Перемістити в зону зберігання для подальшого прийняття рішення",
"Яка регулярна дія передбачена планом підтримки 5S на щотижневій основі?": "Перевірити порядок та знайти можливості для покращення",
"Чому систематичне прибирання (3S) вважається частиною щоденної роботи, а не просто гігієною?": "Воно допомагає виявляти несправності та проблеми",
"Яка з перелічених проблем є прикладом типових втрат у цифровому середовищі без 5S?": "Некероване середовище зберігання даних та переповнені email",
"Принцип «Кожному предмету своє місце» реалізується на етапі:": "2S Створення порядку (Seiton)",
"Який крок системи 5S відповідає за перетворення правил на щоденну звичку?": "5S Вдосконалення/Дисципліна (Shitsuke)",
"Замість складних текстових інструкцій 5S пропонує використовувати:": "Графічні знаки та кольори",
"Адресне зберігання у 5S передбачає:": "Наявність чіткої назви та «адреси» для кожної полиці або файлу",
"До якої категорії втрат згідно з 5S відноситься «дублювання роботи»?": "Типові втрати через безлад на робочому місці",
"Що з переліченого НЕ є частиною алгоритму самоперевірки 5S?": "Усі інструменти є новими та дорогими",
"Як 5S пропонує боротися з «зайвими переміщеннями» працівника?": "Розміщуючи потрібні речі максимально близько до місця використання",
"При впровадженні 5S самостійно, який перший крок рекомендується зробити «вже сьогодні»?": "Знайти 3 зайві предмети та прибрати їх",
"Яке твердження найкраще описує 5S як систему?": "Це фундамент стабільності, що спрощує роботу",
"При візуалізації рівнів запасів червоний колір сигналізує про:": "Критичний стан, що потребує негайного поповнення"
};

// ===== Налаштування затримки =====
const CLICK_DELAY_MS = 100;

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
