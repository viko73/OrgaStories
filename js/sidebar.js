/* ═══════════════════════════════════════════════
   ORGASTORIES — Sidebar
   Contient : renderSidebar
═══════════════════════════════════════════════ */

function renderSidebar() {
  const container = document.getElementById('spaces-sidebar');
  container.innerHTML = '';

  const cfg = {
    note:      { icon: '📝', color: 'var(--yellow)', label: 'Notes' },
    character: { icon: '👤', color: 'var(--purple)', label: 'Personnages' },
    world:     { icon: '🌍', color: 'var(--green)',  label: 'Mondes' },
  };

  state.spaces.forEach(space => {
    const isActive = state.currentSpaceId === space.id;

    // Nom de l'espace
    const spaceEl = document.createElement('div');
    spaceEl.className = 'space-sidebar-item' + (isActive && state.currentView === 'space' ? ' active' : '');
    spaceEl.onclick = () => { state.currentSpaceId = space.id; showSpaceView(space.id); renderSidebar(); };
    spaceEl.innerHTML = `<span class="space-icon">${space.icon}</span><span class="space-name">${escHtml(space.name)}</span>`;
    container.appendChild(spaceEl);

    // Sous-items si l'espace est actif et qu'on est dans une catégorie ou une page
    if (isActive && ['category','note','character','world'].includes(state.currentView)) {
      const currentType = state.currentView === 'category' ? state.currentCategory : state.currentView;
      const catWrap = document.createElement('div');
      catWrap.className = 'sidebar-cat-wrap';

      ;['note','character','world'].forEach(type => {
        const c = cfg[type];
        const isCurrentCat = currentType === type;

        // Ligne catégorie
        const catEl = document.createElement('div');
        catEl.className = 'sidebar-cat-item' + (isCurrentCat ? ' active' : '');
        catEl.style.setProperty('--cat-color', c.color);
        catEl.onclick = () => showCategoryView(type);
        catEl.innerHTML = `<span class="sidebar-cat-icon">${c.icon}</span><span class="sidebar-cat-label">${c.label}</span>`;
        catWrap.appendChild(catEl);

        // Pages de la catégorie active
        if (isCurrentCat) {
          const sorted = space.pages
            .filter(p => p.type === type)
            .sort((a, b) => {
              if (type === 'note') return 0;
              return a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
            });
          sorted.forEach(p => {
            const isActivePage = state.currentPageId === p.id;
            const pageEl = document.createElement('div');
            pageEl.className = 'sidebar-page-item' + (isActivePage ? ' active' : '');
            pageEl.style.setProperty('--cat-color', c.color);
            pageEl.onclick = () => openPage(space.id, p.id);
            pageEl.innerHTML = `<span class="sidebar-page-dot"></span><span class="sidebar-page-label">${escHtml(p.title)}</span>`;
            catWrap.appendChild(pageEl);
          });

          // Bouton + Nouveau
          const addEl = document.createElement('div');
          addEl.className = 'sidebar-page-add';
          addEl.style.setProperty('--cat-color', c.color);
          addEl.onclick = () => openModalPageType(space.id, type);
          addEl.innerHTML = `<span>＋</span> Nouveau`;
          catWrap.appendChild(addEl);
        }
      });

      container.appendChild(catWrap);
    }
  });

  updateStats();
}