(() => {
  const cards = [...document.querySelectorAll('.stories .story-card')];
  if (!cards.length) return;
  const input = document.querySelector('#search');
  const more = document.querySelector('#load-more');
  const buttons = [...document.querySelectorAll('[data-year-filter]')];
  const normalize = text => text.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let year = 'all';
  let limit = 9;
  function update() {
    const term = normalize(input.value.trim());
    let found = 0;
    for (const card of cards) {
      const matches = (year === 'all' || card.dataset.year === year) && normalize(card.dataset.search).includes(term);
      if (matches) found++;
      card.hidden = !matches || found > limit;
    }
    more.hidden = found <= limit;
    document.querySelector('#empty').hidden = found > 0;
    document.querySelector('#search-status').textContent = `${found} ${found === 1 ? 'historia encontrada' : 'historias encontradas'}. Se muestran ${Math.min(limit, found)}.`;
  }
  input.addEventListener('input', () => { limit = 9; update(); });
  buttons.forEach(button => button.addEventListener('click', () => {
    year = button.dataset.yearFilter;
    limit = 9;
    buttons.forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    update();
  }));
  more.addEventListener('click', () => {
    const previous = new Set(cards.filter(c => !c.hidden));
    limit += 9;
    update();
    cards.find(c => !c.hidden && !previous.has(c))?.querySelector('a')?.focus({preventScroll:true});
  });
  update();
})();
