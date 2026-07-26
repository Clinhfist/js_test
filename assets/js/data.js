window.KNOWLEDGE_BASE = {
  scripts: [
    {
      category: 'Автовідповіді на тести',
      tag: 'Тест',
      title: 'Lean White Belt',
      description: 'Підсвічує та автоматично обирає правильні відповіді у тесті Lean White Belt.',
      code: `const QA = {
  "Що є основною метою методики LEAN?": "Додання цінності для клієнта, задоволення запиту клієнта",
  "Що таке процес?": "Послідовність взаємопов'язаних дій або етапів, спрямованих на досягнення певного результату",
  "Що таке кайдзен?": "Поступові покращення",
  "Який вид втрат може прямо призвести до утворення надлишкових запасів, очікування, не поміченого браку, потребу в надлишкових переміщеннях чи транспортуванні": "Перевиробництво",
  "Оберіть, що з переліченого НЕ є видом втрат, відповідно до LEAN-методології": "Надлишкове навчання працівників",
  "Що таке запаси?": "Будь-яка кількість понад мінімуму, необхідного для виконання роботи",
  "До якого виду втрат відносяться перевірки та аудити?": "Зайві операції/зайва обробка",
  "Що з переліку НЕ є прямим ефектом використання 5С?": "Залучення більшої кількості клієнтів та ринків збуту",
  "Хто є ключовими учаcниками процесу в LEAN-компанії?": "Всі працівники, незалежно від їхнього рівня",
  "Що таке Lean?": "Методологія організації процесів задля надання клієнту більшої цінності при менших витратах ресурсів",
  "Що потрібно робити, якщо під час сортування виявляється \"спірний\" предмет (частоту і потребу використання якого важко визначити)?": "Його потрібно позначити ярликом з датою прийняття рішення і перемістити в зону карантину (зону \"до з'ясування\"). У призначений час прийняти рішення щодо подальшого зберігання, передачі або утилізації",
  "Що таке GEMBA?": "Японський термін, що означає \"реальне місце\", де виконується робота і створюється цінність",
  "Яким чином Lean підходить до визначення цінності для клієнта?": "Визначає що клієнт вважає важливим і яку ціну клієнт готовий заплатити",
  "Що лежить в основі LEAN-системи в Нова Пошта": "Культура вирішення проблем",
  "Яка мета 4 кроку: стандартизація?": "Підтримка досягнутого стану після виконання попередніх кроків",
  "Яка роль працівника в LEAN-компанії?": "Виконувати стандарти і бути залученим до постійного вдосконалення процесів",
  "Де необхідно зберігати предмети/робочі інструменти, які використовуються щодня?": "На робочих місцях або носити з собою",
  "На якому кроці використовуються методи систематизації з візуальним управлінням?": "2 крок: Систематизація",
  "Що таке 5С?": "Комплекс кроків по організації і дотриманню порядку робочого простору",
  "Які наслідки має зайве транспортування?": "Пошкодження товарів, затримки в поставках та збільшення витрат",
  "Цей вид втрат виникає на наступному етапі обробки, при поламці обладнання на попередньому етапі:": "Очікування/простій",
  "Цей вид трат провокує додаткові витрати на переробку або утилізацію готової продукції, витрати на контроль якості": "Дефекти",
  "На якому кроці впровадження системи 5С відбувається вироблення звички до безперервного покращення?": "5 крок: Самовдосконалення",
  "Що таке втрати?": "Будь-які дії або процеси, які споживають ресурси, але не додають цінність продукту",
  "Що таке потік створення цінності?": "Всі дії від моменту, коли клієнт щось замовляє, до того як отримає готовий продукт або послугу",
  "Яким чином LEAN підходить до визначення цінності для клієнта?": "Враховуючи вимоги та очікування клієнта",
  "Чому в Lean втрати в процесі виробництва вважаються проблемою?": "Вони збільшують витрати на виробництво продукту/послуги",
  "Яка мета гуртків-кайдзен?": "Забезпечення безпервної і системної роботи з вирішення проблем",
  "Що є прикладом нереалізованого потенціалу співробітника?": "Співробітник має навички та знання, які не використовуються на поточній посаді",
  "Чим в 5С відрізняється крок 2 \"Систематизація\" від кроку 3 \"Систематичне прибирання\"": "Систематизація означає встановлення для кожної речі свого постійного місця зберігання (порядок). Систематичне прибирання - це регулярне підтримання цього порядку та забезпечення чистоти, включаючи виявлення джерел забруднення і дотримання графіку прибирання"
};

const CLICK_DELAY_MS = 100;
function cleanText(t) {
  return t.replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\\/g, '/')
    .trim();
}

let highlighted = 0;
let clicked = 0;
const toClick = [];

document.querySelectorAll('[data-field="questionText"]').forEach(qEl => {
  const qTextRaw = cleanText(qEl.textContent);
  const entry = Object.entries(QA).find(([key]) => cleanText(key).replace(/[?:;]$/, '') === qTextRaw.replace(/[?:;]$/, ''));
  if (!entry) return;

  const correctAnswer = cleanText(entry[1]);
  const card = qEl.closest('.question-card') || qEl.parentElement.parentElement.parentElement.parentElement;

  card.querySelectorAll('[data-field="optionText"]').forEach(opt => {
    if (cleanText(opt.textContent) === correctAnswer) {
      opt.style.cssText = 'background: #c8f7c5 !important; border: 2px solid #2ecc71 !important; border-radius: 4px; font-weight: bold;';
      highlighted++;
      const input = opt.closest('label') || opt.parentElement.querySelector('input') || opt.querySelector('input');
      const clickTarget = input || opt.closest('.option-row') || opt.closest('label') || opt;
      toClick.push(clickTarget);
    }
  });
});

function clickWithDelay(index) {
  if (index >= toClick.length) {
    console.log(\`✅ Роботу завершено. Підсвічено: \${highlighted} | Автоматично обрано (клікнуто): \${clicked}\`);
    return;
  }
  toClick[index].click();
  clicked++;
  setTimeout(() => clickWithDelay(index + 1), CLICK_DELAY_MS);
}

clickWithDelay(0);`
    },
    {
      category: 'Автовідповіді на тести',
      tag: 'Тест',
      title: 'Небезпечні відправлення',
      description: 'Відповіді для тесту про приймання та перевезення небезпечних відправлень.',
      code: `const QA = {
  "Хто телефонує відправнику або отримувачу з пропозицією забрати небезпечне відправлення безпосередньо з терміналу, депо, СД, відділення": "Начальник терміналу (начальник зміни терміналу), депо, СД, керівник відділення або особи, які виконують їх обов’язки",
  "У якому випадку можна не проводити огляд запакованого відправлення, що надається клієнтом?": "не потрібно проводити, якщо відправлення в упаковці виробника, що немає ознак її відкриття та перепакування",
  "Які продукти харчування дозволено приймати до перевезення?": "терміном придатності, що не закінчується до планової дати доставки",
  "Як перевіряється вміст запакованого клієнтом відправлення на наявність у ньому рідини?": "Взяти відправлення в руки та декілька раз похитати його чи поперевертати, прислухаючись, чи не буде це супроводжуватись бульканням рідини"
};

const CLICK_DELAY_MS = 100;
function cleanText(t) {
  return t.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').replace(/\\/g, '/').trim();
}

let highlighted = 0;
let clicked = 0;
const toClick = [];

document.querySelectorAll('[data-field="questionText"]').forEach(qEl => {
  const qTextRaw = cleanText(qEl.textContent);
  const entry = Object.entries(QA).find(([key]) => cleanText(key).replace(/[?:;]$/, '') === qTextRaw.replace(/[?:;]$/, ''));
  if (!entry) return;

  const correctAnswer = cleanText(entry[1]);
  const card = qEl.closest('.question-card') || qEl.parentElement.parentElement.parentElement.parentElement;

  card.querySelectorAll('[data-field="optionText"]').forEach(opt => {
    if (cleanText(opt.textContent) === correctAnswer) {
      opt.style.cssText = 'background: #c8f7c5 !important; border: 2px solid #2ecc71 !important; border-radius: 4px; font-weight: bold;';
      highlighted++;
      const input = opt.closest('label') || opt.parentElement.querySelector('input') || opt.querySelector('input');
      const clickTarget = input || opt.closest('.option-row') || opt.closest('label') || opt;
      toClick.push(clickTarget);
    }
  });
});

function clickWithDelay(index) {
  if (index >= toClick.length) {
    console.log(\`✅ Роботу завершено. Підсвічено: \${highlighted} | Автоматично обрано (клікнуто): \${clicked}\`);
    return;
  }
  toClick[index].click();
  clicked++;
  setTimeout(() => clickWithDelay(index + 1), CLICK_DELAY_MS);
}

clickWithDelay(0);`
    },
    {
      category: 'Автоматизація навчання',
      tag: 'Утиліта',
      title: 'Автопрогортання презентації',
      description: 'Автоматично натискає кнопку «Далі» у презентації, доки вона доступна.',
      code: `const NEXT_DELAY_MS = 1000;
const AUTO_SUBMIT = false;
let steps = 0;
function findElementInDOM(selector, doc = document) {
  let element = doc.querySelector(selector);
  if (element) return element;
  const iframes = doc.querySelectorAll('iframe');
  for (let i = 0; i < iframes.length; i++) {
    try {
      const iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
      if (iframeDoc) {
        element = findElementInDOM(selector, iframeDoc);
        if (element) return element;
      }
    } catch (e) {}
  }
  return null;
}
function tick() {
  const nextBtn = findElementInDOM('#next');
  if (!nextBtn) {
    console.log(\`✅ Автоскіп завершено (кнопку \"ДАЛІ\" не знайдено). Кроків зроблено: \${steps}\`);
    setTimeout(tick, NEXT_DELAY_MS);
    return;
  }
  const isDisabled = nextBtn.getAttribute('aria-disabled') === 'true' || nextBtn.disabled || nextBtn.style.display === 'none' || nextBtn.getAttribute('disabled') !== null;
  if (isDisabled) {
    const submitBtn = findElementInDOM('#submit');
    const submitVisible = submitBtn && submitBtn.style.display !== 'none' && submitBtn.getAttribute('aria-disabled') !== 'true';
    if (AUTO_SUBMIT && submitVisible) {
      submitBtn.click();
      console.log(\`📤 Слайд \${steps + 1}: натиснуто \"Дати відповідь\"\`);
    } else {
      console.log(\`⏸ Слайд \${steps + 1}: кнопка \"Далі\" неактивна, чекаю...\`);
    }
    setTimeout(tick, NEXT_DELAY_MS);
    return;
  }
  nextBtn.click();
  steps++;
  console.log(\`➡️ Перехід \${steps}: натиснуто \"ДАЛІ\"\`);
  setTimeout(tick, NEXT_DELAY_MS);
}
tick();`
    },
    {
      category: 'Автоматизація навчання',
      tag: 'Утиліта',
      title: 'Пропустити відео',
      description: 'Перемотує відео на сторінці в самий кінець одним рядком.',
      code: 'document.querySelector("video").currentTime = 9999;'
    }
  ],
  knowledge: {
    LEAN: {
      title: 'LEAN',
      entries: {
        "Що є основною метою методики LEAN?": "Додання цінності для клієнта, задоволення запиту клієнта",
        "Що таке процес?": "Послідовність взаємопов'язаних дій або етапів, спрямованих на досягнення певного результату",
        "Що таке кайдзен?": "Поступові покращення",
        "Який вид втрат може прямо призвести до утворення надлишкових запасів, очікування, не поміченого браку, потребу в надлишкових переміщеннях чи транспортуванні": "Перевиробництво"
      }
    },
    DANGER: {
      title: 'Небезпечні відправлення',
      entries: {
        "Хто телефонує відправнику або отримувачу з пропозицією забрати небезпечне відправлення безпосередньо з терміналу, депо, СД, відділення": "Начальник терміналу (начальник зміни терміналу), депо, СД, керівник відділення або особи, які виконують їх обов’язки",
        "У якому випадку можна не проводити огляд запакованого відправлення, що надається клієнтом?": "не потрібно проводити, якщо відправлення в упаковці виробника, що немає ознак її відкриття та перепакування"
      }
    },
    SORTING: {
      title: 'Сортування',
      entries: {
        "Що потрібно зробити після завершення групування з ТЗД?": "натиснути кнопку «Закінчити»"
      }
    },
    BDF: {
      title: 'BDF',
      entries: {
        "Яка орієнтовно відстань має бути між посилками при розвантаженні на стрічку?": "приблизно 10 см"
      }
    }
  },
  searchCategories: {
    LEAN: 'LEAN',
    DANGER: 'Небезпечні відправлення',
    SORTING: 'Сортування',
    BDF: 'BDF'
  }
};
