(async function startTwoPhaseScan() {
    const getInputField = () => document.querySelector('input[name="ScannedBarcode"]') || document.querySelector('input.x-form-text');
    const getScanButton = () => {
        const spans = Array.from(document.querySelectorAll('span.x-btn-inner, span[id$="-btnInnerE"]'));
        const target = spans.find(s => s.textContent.includes("ШК для сканування"));
        return target ? (target.closest('a') || target.closest('button') || target.parentElement) : null;
    };

    // --- ВВЕДЕННЯ: число, час, бейдж ---
    const dayIn = parseInt(prompt('Число дня (наприклад 8):'), 10);
    if (!dayIn || dayIn < 1 || dayIn > 31) return;
    const tm = (prompt('Граничний час (ГГ:ХХ), наприклад 11:40:') || '').match(/^(\d{1,2}):(\d{2})$/);
    if (!tm) return;
    const limitMin = +tm[1] * 60 + +tm[2];
    const backupCode = prompt('Введіть 10-значний код бейджа:');
    if (!backupCode || backupCode.length !== 10) return;

    const sleep = ms => new Promise(r => setTimeout(r, ms));

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

    // Відбір: рівно це число + час <= дедлайну
    function getValidBarcodes() {
        const rows = Array.from(document.querySelectorAll('tr.x-grid-row'));
        const list = [];
        for (const row of rows) {
            const cells = Array.from(row.querySelectorAll('.x-grid-cell-inner, td.x-grid-cell'));
            let foundBarcode = null;
            let dateOk = false;
            for (const cell of cells) {
                const text = cell.textContent.trim();
                if (!dateOk) {
                    const m = text.match(/^(\d{2})-\d{2}-\d{4}\s+(\d{2}):(\d{2})/);
                    if (m) dateOk = (+m[1] === dayIn) && ((+m[2] * 60 + +m[3]) <= limitMin);
                }
                if (!foundBarcode) {
                    const clean = text.split('(')[0].trim();
                    if (clean.length >= 8 && !clean.includes('-202') && /^[A-Za-z0-9\s-]+$/.test(clean)) {
                        foundBarcode = clean;
                    }
                }
            }
            if (foundBarcode && dateOk) list.push(foundBarcode);
        }
        return [...new Set(list)];
    }

    // --- Підсумок зі швидкістю ---
    let total = 0, badges = 0;
    const t0 = performance.now();
    const report = async title => {
        await sleep(300);
        const left = getValidBarcodes().length;
        const scanned = total - left;
        const sec = Math.max((performance.now() - t0) / 1000, 0.001);
        console.log(
            `${title}\n` +
            `Відскановано ШК: ${scanned} з ${total} (залишилось: ${left}, з бейджем: ${badges})\n` +
            `Витрачено часу: ${sec.toFixed(1)} с\n` +
            `Швидкість: ${(scanned / sec).toFixed(2)} ШК/с`
        );
        alert(`${title}\nВідскановано: ${scanned} з ${total}\nЧас: ${sec.toFixed(1)} с\nШвидкість: ${(scanned / sec).toFixed(2)} ШК/с`);
    };

    // --- ЕТАП 1 ---
    let items = getValidBarcodes();
    total = items.length;
    console.log(`[ЕТАП 1] Знайдено ШК: ${total}`);
    if (!total) return alert(`Не знайдено ШК за ${dayIn} числа до ${tm[0]}`);

    for (let i = 0; i < items.length; i++) {
        const input = getInputField();
        const btn = getScanButton();
        if (!input) { console.log("Не знайдено поле name='ScannedBarcode'!"); break; }
        await setExtValueWithTrigger(input, btn, items[i]);
        await sleep(250);
        if ((i + 1) % 10 === 0) console.log(`[1] ${i + 1}/${items.length}`);
    }
    items = null;
    await sleep(150);

    // --- ЕТАП 2: що залишилось ---
    const remaining = getValidBarcodes();
    console.log(`[ЕТАП 2] Залишилось (потрібен бейдж): ${remaining.length}`);
    if (!remaining.length) return report('✅ Усе відскановано на першому етапі');

    // --- ЕТАП 3: ШК -> бейдж ---
    for (let j = 0; j < remaining.length; j++) {
        const input = getInputField();
        const btn = getScanButton();
        if (!input) break;
        await setExtValueWithTrigger(input, btn, remaining[j]);
        await sleep(150);
        await setExtValueWithTrigger(input, btn, backupCode);
        await sleep(150);
        badges++;
        if ((j + 1) % 10 === 0) console.log(`[3] ${j + 1}/${remaining.length}`);
    }

    await report('✅ Повний цикл завершено');
})();