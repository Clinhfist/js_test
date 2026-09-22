const NEXT_DELAY_MS = 1500;
const BUTTON_DELAY_MS = 1000;
const AUTO_SUBMIT = false;
let steps = 0;
let clickedButtons = new Set();
let busy = false;
let running = true;
const iframe = document.querySelector('iframe');
if (!iframe) {
    console.error('Storyline iframe not found');
} else {
    const doc = iframe.contentDocument;
    if (!doc) {
        console.error('Cannot access iframe');
    } else {
        function getButtonText(btn) {
            return btn.textContent
                .replace(/\s+/g, ' ')
                .trim();
        }
        function finishCourse() {
            const buttons = [...doc.querySelectorAll('button')];
            const finishBtn = buttons.find(btn => {
                const text = getButtonText(btn);
                if (!text.includes('Завершити курс')) {
                    return false;
                }
                const rect = btn.getBoundingClientRect();
                const style = getComputedStyle(btn);
                return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    !btn.disabled &&
                    btn.getAttribute('aria-disabled') !== 'true'
                );
            });
            if (!finishBtn) {
                return false;
            }
            console.log('Finish button found');
            console.log('Clicking Finish');
            running = false;
            finishBtn.click();
            console.log('Automation stopped');
            return true;
        }
        function getNextButton() {
            return doc.querySelector('#next');
        }
        function isNextActive(nextBtn) {
            if (!nextBtn) {
                return false;
            }
            const rect = nextBtn.getBoundingClientRect();
            const style = getComputedStyle(nextBtn);
            if (
                rect.width <= 0 ||
                rect.height <= 0 ||
                style.display === 'none' ||
                style.visibility === 'hidden'
            ) {
                return false;
            }
            return !(
                nextBtn.disabled ||
                nextBtn.getAttribute('disabled') !== null ||
                nextBtn.getAttribute('aria-disabled') === 'true'
            );
        }
        function getStorylineButtons() {
            return [...doc.querySelectorAll('button.acc-button')]
                .filter(btn => {
                    const rect = btn.getBoundingClientRect();
                    const style = getComputedStyle(btn);
                    return (
                        rect.width > 0 &&
                        rect.height > 0 &&
                        style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        !btn.disabled &&
                        btn.getAttribute('aria-disabled') !== 'true' &&
                        btn.getAttribute('aria-hidden') !== 'true'
                    );
                });
        }
        function getButtonKey(btn) {
            return (
                btn.getAttribute('data-represents') ||
                btn.id ||
                getButtonText(btn)
            );
        }
        function clickInteractive() {
            const buttons = getStorylineButtons();
            for (const btn of buttons) {
                const key = getButtonKey(btn);
                if (clickedButtons.has(key)) {
                    continue;
                }
                clickedButtons.add(key);
                console.log(
                    'Interactive:',
                    getButtonText(btn)
                );
                btn.click();
                return true;
            }
            return false;
        }
        function tick() {
            if (!running) {
                return;
            }
            if (busy) {
                return;
            }
            busy = true;
            // 1. Finish course
            if (finishCourse()) {
                busy = false;
                return;
            }
            // 2. NEXT has priority
            const nextBtn = getNextButton();
            if (isNextActive(nextBtn)) {
                console.log(
                    'NEXT is active -> skipping interactive buttons'
                );
                nextBtn.click();
                steps++;
                console.log(
                    'Navigation step:',
                    steps
                );
                clickedButtons.clear();
                busy = false;
                setTimeout(tick, NEXT_DELAY_MS);
                return;
            }
            // 3. NEXT is disabled -> process interactive buttons
            const buttons = getStorylineButtons();
            const unclickedButtons = buttons.filter(btn => {
                const key = getButtonKey(btn);
                return !clickedButtons.has(key);
            });
            if (unclickedButtons.length > 0) {
                clickInteractive();
                busy = false;
                setTimeout(tick, BUTTON_DELAY_MS);
                return;
            }
            // 4. Submit
            const submitBtn = doc.querySelector('#submit');
            const submitVisible =
                submitBtn &&
                submitBtn.getBoundingClientRect().width > 0 &&
                submitBtn.getBoundingClientRect().height > 0 &&
                !submitBtn.disabled &&
                submitBtn.getAttribute('aria-disabled') !== 'true';
            if (AUTO_SUBMIT && submitVisible) {
                console.log('Clicking Submit');
                submitBtn.click();
                clickedButtons.clear();
                busy = false;
                setTimeout(tick, BUTTON_DELAY_MS);
                return;
            }
            // 5. Nothing to do
            console.log(
                'NEXT disabled and no new interactive buttons. Waiting...'
            );
            busy = false;
            setTimeout(tick, NEXT_DELAY_MS);
        }
        console.log('Automation started');
        tick();
    }
}