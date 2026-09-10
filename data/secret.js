(async function startTwoPhaseScan() {
    const getInputField = () => document.querySelector('input[name="ScannedBarcode"]') || document.querySelector('input.x-form-text');
    const getScanButton = () => {
        const spans = Array.from(document.querySelectorAll('span.x-btn-inner, span[id$="-btnInnerE"]'));
        const target = spans.find(s => s.textContent.includes("ШК для сканування"));
        return target ? (target.closest('a') || target.closest('button') || target.parentElement) : null;
    };
    const backupCode = prompt('Введіть 10-значний код бейджа:');
    if (!backupCode || backupCode.length !== 10) return;
    const deadlineStr = prompt('Введіть граничні дату та час (формат: ДД-ММ-ГГГГ ЧЧ:ММ):\nНаприклад: 24-08-2026 11:40');
    if (!deadlineStr) return;

    function parseDateTime(str) {
        if (!str) return null;
        const match = str.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
        if (!match) return null;
        const [, day, month, year, hours, minutes] = match;
        return new Date(year, month - 1, day, hours, minutes);
    }
    const targetDate = parseDateTime(deadlineStr);
    if (!targetDate || isNaN(targetDate.getTime())) return;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    // Надійне введення значення з емуляцією тригера пробілу
    async function setExtValueWithTrigger(inputEl, btnEl, val) {
        if (document.activeElement) document.activeElement.blur();
        inputEl.focus();
        const valWithSpace = val + " ";
        if (typeof Ext !== 'undefined' && Ext.getCmp) {
            const cmp = Ext.getCmp(inputEl.id);
            if (cmp && cmp.setValue) cmp.setValue(valWithSpace);
            else inputEl.value = valWithSpace;
        } else {
            inputEl.value = valWithSpace;
        }
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', keyCode: 32, which: 32, bubbles: true }));
        inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', keyCode: 32, which: 32, bubbles: true }));
        await sleep(50);
        if (typeof Ext !== 'undefined' && Ext.getCmp) {
            const cmp = Ext.getCmp(inputEl.id);
            if (cmp && cmp.setValue) cmp.setValue(val);
            else inputEl.value = val;
        } else {
            inputEl.value = val;
        }
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', keyCode: 8, which: 8, bubbles: true }));
        inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: 'Backspace', keyCode: 8, which: 8, bubbles: true }));
        await sleep(100);
        inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        if (btnEl) btnEl.click();
    }
    // Функція збору ШК з поточного стану таблиці
    function getValidBarcodes() {
        const rows = Array.from(document.querySelectorAll('tr.x-grid-row'));
        const list = [];
        for (const row of rows) {
            const cells = Array.from(row.querySelectorAll('.x-grid-cell-inner, td.x-grid-cell'));
            let foundBarcode = null;
            let foundDate = null;
            for (const cell of cells) {
                const text = cell.textContent.trim();
                if (!foundDate && /\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}/.test(text)) {
                    foundDate = parseDateTime(text);
                }
                if (!foundBarcode) {
                    let clean = text.split('(')[0].trim();
                    if (clean.length >= 8 && !clean.includes('-202') && /^[A-Za-z0-9\s-]+$/.test(clean)) {
                        foundBarcode = clean;
                    }
                }
            }
            if (foundBarcode && foundDate && foundDate.getTime() <= targetDate.getTime()) {
                list.push({ code: foundBarcode, date: foundDate.toLocaleString() });
            }
        }
        return list;
    }
    // --- ЕТАП 1: Первинний збір і сканування всіх ШК ---
    const initialItems = getValidBarcodes();
    console.log(`[ЕТАП 1] Знайдено початкових штрих-кодів: ${initialItems.length}`, initialItems);
    if (initialItems.length === 0) {
        alert(`Не знайдено штрих-кодів з датою <= ${deadlineStr}`);
        return;
    }
    for (let i = 0; i < initialItems.length; i++) {
        const { code } = initialItems[i];
        const input = getInputField();
        const btn = getScanButton();
        if (!input) {
            alert("Не знайдено поле name='ScannedBarcode'!");
            break;
        }
        console.log(`[ЕТАП 1] (${i + 1}/${initialItems.length}) Скануємо ШК: ${code}`);
        await setExtValueWithTrigger(input, btn, code);
        await sleep(250);
    }
    await sleep(150); // Даємо час інтерфейсу оновитися після масового сканування
    // --- ЕТАП 2: Повторний аналіз таблиці (що залишилося) ---
    const remainingItems = getValidBarcodes();
    console.log(`[ЕТАП 2] Повторний аналіз. Залишилося в таблиці: ${remainingItems.length}`, remainingItems);
    if (remainingItems.length === 0) {
        alert('Усі штрих-коди успішно відскановані на першому етапі!');
        return;
    }
    // --- ЕТАП 3: Досканування залишків через зв'язку "ШК -> Бейдж" ---
    for (let j = 0; j < remainingItems.length; j++) {
        const { code } = remainingItems[j];
        const input = getInputField();
        const btn = getScanButton();
        if (!input) break;
        console.log(`[ЕТАП 3] (${j + 1}/${remainingItems.length}) Обробка залишку — ШК: ${code}`);
        // 1. Спочатку вводимо сам ШК
        await setExtValueWithTrigger(input, btn, code);
        await sleep(150);
        // 2. Одразу після нього вводимо бейдж для підтвердження
        console.log(`[ЕТАП 3] Вводимо бейдж для ШК ${code}: ${backupCode}`);
        await setExtValueWithTrigger(input, btn, backupCode);
        await sleep(150);
    }
    alert('Повний цикл сканування завершено!');
})();