document.addEventListener('DOMContentLoaded', () => {
  const data = window.KNOWLEDGE_BASE || { scripts: [], knowledge: {} };
  const entries = [];
  const base = data.searchCategories || {};
  const knowledge = data.knowledge || {};

  Object.entries(knowledge).forEach(([catKey, section]) => {
    Object.entries(section.entries || {}).forEach(([q, a]) => {
      entries.push({ cat: base[catKey] || section.title || catKey, q, a });
    });
  });

  const searchInput = document.getElementById('search');
  const clearBtn = document.getElementById('clear');
  const resultsEl = document.getElementById('results');
  const metaEl = document.getElementById('meta');
  const chipsEl = document.getElementById('chips');

  let activeCategory = 'all';

  function normalize(text) {
    return String(text || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  }

  function filterEntries(query) {
    const q = normalize(query);
    return entries.filter((entry) => {
      const matchesQuery = !q || normalize(entry.q).includes(q) || normalize(entry.a).includes(q);
      const matchesCategory = activeCategory === 'all' || entry.cat === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }

  function render(query = '') {
    const filtered = filterEntries(query);
    metaEl.textContent = filtered.length ? `Знайдено ${filtered.length} записів` : 'Нічого не знайдено';
    resultsEl.innerHTML = '';

    if (!filtered.length) {
      resultsEl.innerHTML = '<div class="empty"><div class="big">Нічого не знайдено</div><div>Спробуй змінити запит або вибрати іншу категорію.</div></div>';
      return;
    }

    filtered.forEach((entry) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = [
        `<div class="card-cat">${escapeHtml(entry.cat)}</div>`,
        `<p class="q">${highlight(entry.q)}</p>`,
        '<div class="a-label">Відповідь</div>',
        `<div class="a">${highlight(entry.a)}</div>`,
        '<button class="copy">Скопіювати відповідь</button>'
      ].join('');

      card.querySelector('.copy').addEventListener('click', () => {
        navigator.clipboard.writeText(entry.a);
        const btn = card.querySelector('.copy');
        btn.textContent = 'Скопійовано ✓';
        btn.classList.add('done');
        setTimeout(() => {
          btn.textContent = 'Скопіювати відповідь';
          btn.classList.remove('done');
        }, 1400);
      });

      resultsEl.appendChild(card);
    });
  }

  function highlight(text) {
    const q = normalize(searchInput.value);
    if (!q) return escapeHtml(text);
    const parts = String(text).split(new RegExp(`(${escapeRegExp(q)})`, 'ig'));
    return parts.map((part) => part.toLowerCase() === q ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part)).join('');
  }

  function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const categoriesList = ['all', ...new Set(entries.map((entry) => entry.cat))];
  categoriesList.forEach((cat) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (cat === 'all' ? ' active' : '');
    chip.textContent = cat === 'all' ? 'Усі' : cat;
    chip.addEventListener('click', () => {
      activeCategory = cat;
      [...chipsEl.children].forEach((c) => c.classList.toggle('active', c === chip));
      render(searchInput.value);
    });
    chipsEl.appendChild(chip);
  });

  searchInput.addEventListener('input', (e) => {
    clearBtn.classList.toggle('show', !!e.target.value);
    render(e.target.value);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.remove('show');
    render('');
    searchInput.focus();
  });

  render('');
});
