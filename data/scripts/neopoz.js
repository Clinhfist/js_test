const QA = {
    "Що обов'язково необхідно зробити, якщо відправлення було ідентифіковане?": "зазначити номер ЕН, по якій воно буде транспортуватись, у відомості проблемних вантажів",
    "В який час можна телефонувати клієнту?": "з 09:00 до 21:00 – у будні дні, із 10:00 до 18:00 – у вихідні дні",
    "Якщо на кадрах відеоспостереження є момент сканування НВ з авто, необхідно…?": "відкрити відомість сканування на вивантаження і знайти 5 ШК, які сканувалися в аналогічний час, перевірити всі ШК на предмет співпадінь ",
    "Скільки необхідно зробити фотографій неопізнаного вантажу?": "не менше 3-х: вміст вантажу з різних сторін, додаткові фотографії всіх маркувань, наклейок, написів.",
    "Якщо на НВ є назва контрагента і в Awis наявний менеджер, то необхідно?": "Надіслати на електронну пошту персонального менеджера лист з проханням відновити номер ЕН НВ",
    // Тут виправлено лапки: \"довезення...\"
    "Що необхідно зробити після реєстрації \"довезення частково втраченого вантажу\"?": "Зателефонувати до підрозділу одержувача та проінформувати,  продублювати інформацію в листі з номером ЕН, по якому вібувається довезення вантажу."
};

const CLICK_DELAY_MS = 100;

function cleanText(t) {
    return t.replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .replace(/\\/g, "/")
            .trim();
}

// Функція для пошуку елементів на сторінці та всередині iFrames
function queryAllEverywhere(selector, doc = document) {
    let elements = Array.from(doc.querySelectorAll(selector));
    const iframes = doc.querySelectorAll('iframe');
    for (let i = 0; i < iframes.length; i++) {
        try {
            const iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
            if (iframeDoc) {
                elements = elements.concat(queryAllEverywhere(selector, iframeDoc));
            }
        } catch (e) {}
    }
    return elements;
}

let highlighted = 0;
let clicked = 0;
const toClick = [];

// Крок 1: Збір та підсвічування
const questions = queryAllEverywhere('[data-field="questionText"]');

questions.forEach(qEl => {
    const qTextRaw = cleanText(qEl.textContent);

    const entry = Object.entries(QA).find(([key]) => {
        return cleanText(key).replace(/[?:;]$/, "") === qTextRaw.replace(/[?:;]$/, "");
    });

    if (!entry) return;
    const correctAnswer = cleanText(entry[1]);

    const card = qEl.closest('.question-card') || qEl.parentElement?.parentElement?.parentElement?.parentElement || qEl.parentNode;

    if (card) {
        card.querySelectorAll('[data-field="optionText"], .text.resizeable-text').forEach(opt => {
            if (cleanText(opt.textContent) === correctAnswer) {
                opt.style.cssText = "background: #c8f7c5 !important; border: 2px solid #2ecc71 !important; border-radius: 4px; font-weight: bold;";
                highlighted++;

                const input = opt.closest('label') || opt.parentElement.querySelector('input') || opt.querySelector('input');
                const clickTarget = input || opt.closest('.option-row') || opt.closest('.cs-button') || opt;

                toClick.push(clickTarget);
            }
        });
    }
});

// Крок 2: Виконання кліків
function clickWithDelay(index) {
    if (index >= toClick.length) {
        console.log(`✅ Роботу завершено. Підсвічено: ${highlighted} | Клікнуто: ${clicked}`);
        return;
    }

    try {
        toClick[index].click();
        clicked++;
    } catch (e) {
        console.error("Не вдалося клікнути елемент", toClick[index], e);
    }

    setTimeout(() => clickWithDelay(index + 1), CLICK_DELAY_MS);
}

if (toClick.length > 0) {
    clickWithDelay(0);
} else {
    console.log("⚠️ Питань з бази QA на цій сторінці не знайдено. Переконайся, що тест відкритий.");
}