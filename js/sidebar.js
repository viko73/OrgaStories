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
    if (!space.folders) space.folders = [];

    // ── Nom de l'espace ──
    const spaceEl = document.createElement('div');
    spaceEl.className = 'space-sidebar-item' + (isActive && state.currentView === 'space' ? ' active' : '');
    spaceEl.onclick = () => { state.currentSpaceId = space.id; showSpaceView(space.id); renderSidebar(); };
    spaceEl.innerHTML = `<span class="space-icon">${space.icon}</span><span class="space-name">${escHtml(space.name)}</span>`;
    container.appendChild(spaceEl);

    if (!isActive || !['category','note','character','world'].includes(state.currentView)) return;

    const currentType = state.currentView === 'category' ? state.currentCategory : state.currentView;
    const catWrap = document.createElement('div');
    catWrap.className = 'sidebar-cat-wrap';

    ;['note','character','world'].forEach(type => {
      const c           = cfg[type];
      const isCurrentCat = currentType === type;

      // ── Ligne catégorie ──
      const catEl = document.createElement('div');
      catEl.className = 'sidebar-cat-item' + (isCurrentCat ? ' active' : '');
      catEl.style.setProperty('--cat-color', c.color);
      catEl.onclick = () => showCategoryView(type);
      catEl.innerHTML = `<span class="sidebar-cat-icon">${c.icon}</span><span class="sidebar-cat-label">${c.label}</span>`;
      catWrap.appendChild(catEl);

      if (!isCurrentCat) return;

      // ── Contenu de la catégorie active ──
      const currentFolderId = state.currentFolderId || null;
      const typeFolders     = space.folders
        .filter(f => f.type === type)
        .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));

      typeFolders.forEach(folder => {
        const isFolderOpen = currentFolderId === folder.id;

        // Ligne dossier
        const folderEl = document.createElement('div');
        folderEl.className = 'sidebar-folder-item' + (isFolderOpen ? ' active' : '');
        folderEl.style.setProperty('--cat-color', c.color);
        folderEl.onclick = () => showCategoryView(type, folder.id);
        folderEl.innerHTML = `
          <span class="sidebar-folder-chevron">${isFolderOpen ? '▾' : '▸'}</span>
          <span class="sidebar-folder-icon">📁</span>
          <span class="sidebar-page-label">${escHtml(folder.name)}</span>`;
        catWrap.appendChild(folderEl);

        // Pages dans ce dossier (si dossier ouvert)
        if (isFolderOpen) {
          const folderPages = space.pages
            .filter(p => p.type === type && p.folderId === folder.id)
            .sort((a, b) => type === 'note' ? 0 : a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }));

          folderPages.forEach(p => {
            const pageEl = document.createElement('div');
            pageEl.className = 'sidebar-page-item' + (state.currentPageId === p.id ? ' active' : '');
            pageEl.style.setProperty('--cat-color', c.color);
            pageEl.style.paddingLeft = '52px';
            pageEl.onclick = () => openPage(space.id, p.id);
            pageEl.innerHTML = `<span class="sidebar-page-dot"></span><span class="sidebar-page-label">${escHtml(p.title)}</span>`;
            catWrap.appendChild(pageEl);
          });

          // + Nouveau dans ce dossier
          const addInFolder = document.createElement('div');
          addInFolder.className = 'sidebar-page-add';
          addInFolder.style.setProperty('--cat-color', c.color);
          addInFolder.style.paddingLeft = '52px';
          addInFolder.onclick = () => openModalPageType(space.id, type, folder.id);
          addInFolder.innerHTML = `<span>＋</span> Nouveau`;
          catWrap.appendChild(addInFolder);
        }
      });

      // Pages sans dossier
      const rootPages = space.pages
        .filter(p => p.type === type && !p.folderId)
        .sort((a, b) => type === 'note' ? 0 : a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }));

      rootPages.forEach(p => {
        const pageEl = document.createElement('div');
        pageEl.className = 'sidebar-page-item' + (state.currentPageId === p.id ? ' active' : '');
        pageEl.style.setProperty('--cat-color', c.color);
        pageEl.onclick = () => openPage(space.id, p.id);
        pageEl.innerHTML = `<span class="sidebar-page-dot"></span><span class="sidebar-page-label">${escHtml(p.title)}</span>`;
        catWrap.appendChild(pageEl);
      });

      // + Nouveau (racine)
      const addEl = document.createElement('div');
      addEl.className = 'sidebar-page-add';
      addEl.style.setProperty('--cat-color', c.color);
      addEl.onclick = () => openModalPageType(space.id, type);
      addEl.innerHTML = `<span>＋</span> Nouveau`;
      catWrap.appendChild(addEl);
    });

    container.appendChild(catWrap);
  });

  updateStats();
}