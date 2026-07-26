document.addEventListener('DOMContentLoaded', () => {
  const data = window.KNOWLEDGE_BASE || { scripts: [] };
  const cardsEl = document.getElementById('cards');

  if (!cardsEl) return;

  const categories = [...new Set(data.scripts.map((s) => s.category))];

  categories.forEach((cat) => {
    const heading = document.createElement('h3');
    heading.className = 'cat-title';
    heading.textContent = cat;
    cardsEl.appendChild(heading);

    data.scripts
      .filter((s) => s.category === cat)
      .forEach((s) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = [
          '<div class="card-head">',
          '  <div>',
          `    <h3>${escapeHtml(s.title)}</h3>`,
          `    <p>${escapeHtml(s.description)}</p>`,
          '  </div>',
          `  <span class="tag">${escapeHtml(s.tag)}</span>`,
          '</div>',
          '<div class="code-wrap">',
          '  <button class="copy-btn">Копіювати</button>',
          `  <pre class="mono">${escapeHtml(s.code)}</pre>`,
          '</div>'
        ].join('');

        card.querySelector('.copy-btn').addEventListener('click', (e) => copyCode(s.code, e.currentTarget));
        cardsEl.appendChild(card);
      });
  });
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function copyCode(code, btn) {
  try {
    await navigator.clipboard.writeText(code);
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = code;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  btn.textContent = 'Скопійовано ✓';
  btn.classList.add('copied');
  setTimeout(() => {
    btn.textContent = 'Копіювати';
    btn.classList.remove('copied');
  }, 1800);
}
