const NEXT_DELAY_MS = 1000;
const AUTO_SUBMIT = false;
let steps = 0;

// Функція для пошуку елемента на головній сторінці та всередині усіх iframe
function findElementInDOM(selector, doc = document) {
    let element = doc.querySelector(selector);
    if (element) return element;

    // Шукаємо в усіх iframe на поточному рівні
    const iframes = doc.querySelectorAll('iframe');
    for (let i = 0; i < iframes.length; i++) {
        try {
            // Перевіряємо, чи маємо доступ до вмісту iframe (Cross-Origin Policy)
            const iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
            if (iframeDoc) {
                element = findElementInDOM(selector, iframeDoc);
                if (element) return element;
            }
        } catch (e) {
            // Якщо iframe з іншого домену, доступ буде заблоковано безпекою браузера
        }
    }
    return null;
}

function tick() {
    const nextBtn = findElementInDOM('#next');

    // Немає кнопки "Далі" — імовірно кінець курсу.
    if (!nextBtn) {
        console.log(`✅ Автоскіп завершено (кнопку "ДАЛІ" не знайдено). Кроків зроблено: ${steps}`);
        setTimeout(tick, NEXT_DELAY_MS); // продовжуємо шукати, раптом слайд довго вантажиться
        return;
    }

    // Кнопка присутня, але задизейблена
    const isDisabled = nextBtn.getAttribute('aria-disabled') === 'true'
        || nextBtn.disabled
        || nextBtn.style.display === 'none'
        || nextBtn.getAttribute('disabled') !== null;

    if (isDisabled) {
        const submitBtn = findElementInDOM('#submit');
        const submitVisible = submitBtn && submitBtn.style.display !== 'none' && submitBtn.getAttribute('aria-disabled') !== 'true';

        if (AUTO_SUBMIT && submitVisible) {
            submitBtn.click();
            console.log(`📤 Слайд ${steps + 1}: натиснуто "Дати відповідь"`);
        } else {
            console.log(`⏸ Слайд ${steps + 1}: кнопка "Далі" неактивна, чекаю...`);
        }

        setTimeout(tick, NEXT_DELAY_MS);
        return;
    }

    // Робимо клік
    nextBtn.click();
    steps++;
    console.log(`➡️ Перехід ${steps}: натиснуто "ДАЛІ"`);

    setTimeout(tick, NEXT_DELAY_MS);
}

// Запуск
tick();