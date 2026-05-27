/* ═══════════════════════════════════════════════
   ORGASTORIES — Vues principales
   Contient : showHome, showSpaceView, showCategoryView,
              openPage, renderRecentCards, renderSpacesGrid
═══════════════════════════════════════════════ */

/* ── Helpers d'affichage ── */
function activateView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
}

function setBreadcrumb(crumbs) {
  const el = document.getElementById('breadcrumb');
  const parts = ['<span style="color:var(--text-faint)">OrgaStories</span>'];
  crumbs.forEach((c, i) => {
    const isLast = i === crumbs.length - 1;
    if (c.action) {
      parts.push(`<span style="cursor:pointer;color:var(--text-faint)" onclick="(${c.action})()">${escHtml(c.label)}</span>`);
    } else {
      parts.push(`<span class="${isLast ? 'crumb-active' : ''}">${escHtml(c.label)}</span>`);
    }
  });
  el.innerHTML = parts.join(' <span style="color:var(--text-faint);margin:0 2px">/</span> ');
}

/* ── Accueil ── */
function showHome() {
  state.currentView = 'home';
  state.currentPageId = null;
  activateView('view-home');
  setBreadcrumb([{ label: 'Accueil' }]);
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('nav-home').classList.add('active');
  renderSpacesGrid();
  renderRecentCards();
  updateStats();
  updateTopbarDeleteBtn();
}

function renderSpacesGrid() {
  const grid = document.getElementById('spaces-grid');
  if (!grid) return;

  if (state.spaces.length === 0) {
    grid.innerHTML = `
      <div class="space-page-card new-card" style="min-height:90px" onclick="openModalSpace()">
        <div style="font-size:22px">＋</div>
        <div>Créer un espace</div>
      </div>`;
    return;
  }

  const typeCount = (space) => {
    const notes  = space.pages.filter(p => p.type === 'note').length;
    const chars  = space.pages.filter(p => p.type === 'character').length;
    const worlds = space.pages.filter(p => p.type === 'world').length;
    const parts  = [];
    if (notes)  parts.push(`${notes} note${notes > 1 ? 's' : ''}`);
    if (chars)  parts.push(`${chars} perso${chars > 1 ? 's' : ''}`);
    if (worlds) parts.push(`${worlds} monde${worlds > 1 ? 's' : ''}`);
    return parts.length ? parts.join(' · ') : 'Espace vide';
  };

  grid.innerHTML = state.spaces.map(s => `
    <div class="recent-card space-card" style="cursor:pointer;position:relative" onclick="showSpaceView('${s.id}')">
      <button class="cat-list-del" style="opacity:0" onclick="event.stopPropagation();deleteSpace('${s.id}')" title="Supprimer l'espace">✕</button>
      <div style="font-size:24px;margin-bottom:8px">${s.icon}</div>
      <div class="recent-name">${escHtml(s.name)}</div>
      <div class="recent-preview">${typeCount(s)}</div>
    </div>
  `).join('') + `
    <div class="recent-card" style="cursor:pointer;border-style:dashed;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:100px" onclick="openModalSpace()">
      <div style="font-size:20px;color:var(--text-faint)">＋</div>
      <div style="font-size:12px;font-family:var(--font-mono);color:var(--text-faint)">Nouvel espace</div>
    </div>
  `;
}

function renderRecentCards() {
  const grid = document.getElementById('recent-grid');
  const all = [];
  state.spaces.forEach(s => s.pages.forEach(p => all.push({ space: s, page: p })));
  const recent = all.slice(0, 6);

  if (recent.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">✦</div>
      <div class="empty-title">Tout commence ici</div>
      <div class="empty-sub">Crée un espace pour organiser tes notes, personnages et mondes.</div>
    </div>`;
    return;
  }

  const labels      = { note: 'Note', character: 'Personnage', world: 'Monde' };
  const previewField = { note: 'body', character: 'backstory', world: 'description' };

  grid.innerHTML = recent.map(({ space, page }) => {
    const raw = (page.content[previewField[page.type]] || '').replace(/<[^>]+>/g, '');
    return `
      <div class="recent-card ${page.type}" onclick="openPage('${space.id}','${page.id}')">
        <div class="recent-type">${labels[page.type]}</div>
        <div class="recent-name">${escHtml(page.title)}</div>
        <div class="recent-preview">${escHtml(raw.slice(0, 90))}</div>
      </div>
    `;
  }).join('');
}

/* ── Espace (hub 3 tuiles) ── */
function showSpaceView(spaceId) {
  const space = getSpace(spaceId);
  if (!space) return;

  state.currentView = 'space';
  state.currentSpaceId = spaceId;
  state.currentPageId = null;
  activateView('view-space');
  setBreadcrumb([{ label: space.name, action: () => showSpaceView(spaceId) }]);

  const titleInput = document.getElementById('space-view-title');
  titleInput.value = space.name;
  titleInput.oninput = function () {
    space.name = this.value;
    renderSidebar();
    renderSpacesGrid();
    persistState();
  };
  document.getElementById('space-view-icon').textContent  = space.icon;

  const total = space.pages.length;
  document.getElementById('space-view-meta').textContent =
    total === 0 ? 'Espace vide' : `${total} page${total > 1 ? 's' : ''}`;

  const cfg = {
    note:      { label: 'note',       plural: 'notes' },
    character: { label: 'personnage', plural: 'personnages' },
    world:     { label: 'monde',      plural: 'mondes' },
  };
  ['note','character','world'].forEach(type => {
    const n  = space.pages.filter(p => p.type === type).length;
    const el = document.getElementById('hub-count-' + type);
    if (el) el.textContent = n === 0
      ? `Aucun ${cfg[type].label}`
      : `${n} ${n > 1 ? cfg[type].plural : cfg[type].label}`;
  });
  updateTopbarDeleteBtn();
}

/* ── Vue catégorie (liste de pages + dossiers) ── */
function showCategoryView(type, openFolderId) {
  const space = getSpace(state.currentSpaceId);
  if (!space) return;
  if (!space.folders) space.folders = [];

  const cfg = {
    note:      { label: 'Notes',       icon: '📝', single: 'note',       newLabel: '+ Nouvelle note',      cls: 'note' },
    character: { label: 'Personnages', icon: '👤', single: 'personnage', newLabel: '+ Nouveau personnage',  cls: 'char' },
    world:     { label: 'Mondes',      icon: '🌍', single: 'monde',      newLabel: '+ Nouveau monde',       cls: 'world' },
  };
  const c = cfg[type];

  state.currentView     = 'category';
  state.currentCategory = type;
  state.currentPageId   = null;
  state.currentFolderId = openFolderId || null;
  activateView('view-category');
  renderSidebar();

  // Breadcrumb
  const crumbs = [{ label: space.name, action: () => showSpaceView(state.currentSpaceId) }];
  if (openFolderId) {
    const folder = space.folders.find(f => f.id === openFolderId);
    crumbs.push({ label: c.label, action: () => showCategoryView(type) });
    crumbs.push({ label: folder ? folder.name : '…' });
  } else {
    crumbs.push({ label: c.label });
  }
  setBreadcrumb(crumbs);

  document.getElementById('cat-icon').textContent = c.icon;

  const grid = document.getElementById('cat-list-grid');

  if (openFolderId) {
    // ── VUE DOSSIER : pages du dossier ──
    const folder = space.folders.find(f => f.id === openFolderId);
    document.getElementById('cat-title').textContent = folder ? folder.name : 'Dossier';

    const pagesInFolder = space.pages
      .filter(p => p.type === type && p.folderId === openFolderId)
      .sort((a, b) => type === 'note' ? 0 : a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }));

    document.getElementById('cat-meta').textContent =
      pagesInFolder.length === 0 ? `Vide` : `${pagesInFolder.length} ${pagesInFolder.length > 1 ? c.label.toLowerCase() : c.single}`;

    document.getElementById('cat-back-btn').onclick = () => showCategoryView(type);

    const addBtn = document.getElementById('cat-add-btn');
    addBtn.textContent = c.newLabel;
    addBtn.className   = `cat-add-btn ${c.cls}-add`;
    addBtn.onclick     = () => openModalPageType(state.currentSpaceId, type, openFolderId);

    const previewField = { note: 'body', character: 'backstory', world: 'description' };
    let html = pagesInFolder.length === 0
      ? `<div class="cat-empty-state"><div class="cat-empty-icon">${c.icon}</div><div class="cat-empty-label">Aucun ${c.single} dans ce dossier</div></div>`
      : pagesInFolder.map(p => renderPageCard(p, space, type, c, previewField)).join('');

    html += `<div class="cat-list-new ${c.cls}-new" onclick="openModalPageType('${space.id}','${type}','${openFolderId}')">
      <div class="cat-list-new-plus">＋</div><div>${c.newLabel.replace('+ ','')}</div></div>`;
    grid.innerHTML = html;

  } else {
    // ── VUE CATÉGORIE : dossiers + pages sans dossier ──
    document.getElementById('cat-title').textContent = c.label;

    const allPages   = space.pages.filter(p => p.type === type);
    const rootPages  = allPages
      .filter(p => !p.folderId)
      .sort((a, b) => type === 'note' ? 0 : a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }));
    const typeFolders = space.folders
      .filter(f => f.type === type)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));

    document.getElementById('cat-meta').textContent =
      allPages.length === 0 ? `Aucun ${c.single}` : `${allPages.length} ${allPages.length > 1 ? c.label.toLowerCase() : c.single}`;

    document.getElementById('cat-back-btn').onclick = () => showSpaceView(state.currentSpaceId);

    const addBtn = document.getElementById('cat-add-btn');
    addBtn.textContent = c.newLabel;
    addBtn.className   = `cat-add-btn ${c.cls}-add`;
    addBtn.onclick     = () => openModalPageType(state.currentSpaceId, type);

    const previewField = { note: 'body', character: 'backstory', world: 'description' };
    let html = '';

    // Dossiers
    html += typeFolders.map(f => {
      const count = space.pages.filter(p => p.type === type && p.folderId === f.id).length;
      return `
        <div class="folder-card ${c.cls}-folder" onclick="showCategoryView('${type}','${f.id}')">
          <button class="cat-list-del" onclick="event.stopPropagation();deleteFolder('${space.id}','${f.id}','${type}')" title="Supprimer le dossier">✕</button>
          <div class="folder-card-icon">📁</div>
          <div class="cat-list-card-title">${escHtml(f.name)}</div>
          <div class="cat-list-card-preview">${count} ${count > 1 ? c.label.toLowerCase() : c.single}</div>
        </div>`;
    }).join('');

    // Pages sans dossier
    if (rootPages.length === 0 && typeFolders.length === 0) {
      html += `<div class="cat-empty-state"><div class="cat-empty-icon">${c.icon}</div><div class="cat-empty-label">Aucun ${c.single} pour l'instant</div></div>`;
    } else {
      html += rootPages.map(p => renderPageCard(p, space, type, c, previewField)).join('');
    }

    // Boutons + nouveau et + dossier
    html += `
      <div class="cat-list-new ${c.cls}-new" onclick="openModalPageType('${space.id}','${type}')">
        <div class="cat-list-new-plus">＋</div><div>${c.newLabel.replace('+ ','')}</div>
      </div>
      <div class="cat-list-new folder-new" onclick="openModalFolder('${space.id}','${type}')">
        <div class="cat-list-new-plus">📁</div><div>Nouveau dossier</div>
      </div>`;

    grid.innerHTML = html;
  }
}

function renderPageCard(p, space, type, c, previewField) {
  const raw        = (p.content[previewField[type]] || '').replace(/<[^>]+>/g, '').slice(0, 100);
  const folderName = p.folderId
    ? escHtml((space.folders || []).find(f => f.id === p.folderId)?.name || '')
    : '';
  return `
    <div class="cat-list-card ${c.cls}-card" onclick="openPage('${space.id}','${p.id}')">
      <button class="cat-list-del" onclick="event.stopPropagation();deletePageAndRefresh('${space.id}','${p.id}','${type}')" title="Supprimer">✕</button>
      <button class="cat-list-move" onclick="event.stopPropagation();openModalMove('${space.id}','${p.id}','${type}')" title="Déplacer">↪</button>
      <div class="cat-list-card-icon">${c.icon}</div>
      <div class="cat-list-card-title">${escHtml(p.title)}</div>
      <div class="cat-list-card-preview">${escHtml(raw)}${raw.length === 100 ? '…' : ''}</div>
      ${folderName ? `<div class="cat-list-card-folder">📁 ${folderName}</div>` : ''}
    </div>`;
}


/* ── Ouverture d'une page ── */
function openPage(spaceId, pageId) {
  const space = getSpace(spaceId);
  const page  = getPage(spaceId, pageId);
  if (!space || !page) return;

  state.currentSpaceId  = spaceId;
  state.currentPageId   = pageId;
  state.currentCategory = page.type;
  state.currentView     = page.type;
  renderSidebar();

  setBreadcrumb([
    { label: space.name, action: () => showSpaceView(spaceId) },
    { label: page.title }
  ]);

  if (page.type === 'note')           renderNoteView(page);
  else if (page.type === 'character') renderCharView(page);
  else if (page.type === 'world')     renderWorldView(page);
  updateTopbarDeleteBtn();
}

/* ── Suppression avec retour sur catégorie ── */
function deletePageAndRefresh(spaceId, pageId, type) {
  const space = getSpace(spaceId);
  if (!space) return;
  if (!confirm('Supprimer cette page ?')) return;
  const folderId = (space.pages.find(p => p.id === pageId) || {}).folderId;
  space.pages = space.pages.filter(p => p.id !== pageId);
  renderSidebar();
  updateStats();
  renderSpacesGrid();
  persistState();
  showCategoryView(type, folderId || null);
}

function deleteFolder(spaceId, folderId, type) {
  const space = getSpace(spaceId);
  if (!space) return;
  const folder = (space.folders || []).find(f => f.id === folderId);
  const count  = space.pages.filter(p => p.folderId === folderId).length;
  const msg    = count > 0
    ? `Supprimer le dossier "${folder?.name}" et déplacer ses ${count} page(s) hors du dossier ?`
    : `Supprimer le dossier "${folder?.name}" ?`;
  if (!confirm(msg)) return;
  // Retirer le folderId des pages du dossier
  space.pages.forEach(p => { if (p.folderId === folderId) delete p.folderId; });
  space.folders = space.folders.filter(f => f.id !== folderId);
  persistState();
  showCategoryView(type);
}

function deletePage(spaceId, pageId) {
  const space = getSpace(spaceId);
  if (!space) return;
  if (!confirm('Supprimer cette page ?')) return;
  space.pages = space.pages.filter(p => p.id !== pageId);
  if (state.currentPageId === pageId) {
    state.currentPageId = null;
    showSpaceView(spaceId);
  }
  renderSidebar();
  persistState();
}

/* ── Suppression de l'espace ── */
function deleteSpace(spaceId) {
  const space = getSpace(spaceId);
  if (!space) return;
  if (!confirm(`Supprimer l'espace "${space.name}" et toutes ses pages ?`)) return;
  state.spaces = state.spaces.filter(s => s.id !== spaceId);
  state.currentSpaceId  = null;
  state.currentPageId   = null;
  state.currentCategory = null;
  renderSidebar();
  updateStats();
  persistState();
  showHome();
}

/* ── Suppression contextuelle (bouton topbar) ── */
function deleteCurrentContext() {
  const v = state.currentView;
  if (v === 'space') {
    deleteSpace(state.currentSpaceId);
  } else if (['note','character','world'].includes(v)) {
    const type = state.currentPageId ? v : null;
    if (!type) return;
    const space = getSpace(state.currentSpaceId);
    if (!space) return;
    const page = getPage(state.currentSpaceId, state.currentPageId);
    if (!confirm(`Supprimer "${page?.title || 'cette page'}" ?`)) return;
    space.pages = space.pages.filter(p => p.id !== state.currentPageId);
    renderSidebar();
    updateStats();
    renderSpacesGrid();
    persistState();
    showCategoryView(type);
  }
}

/* ── Affichage/masquage du bouton supprimer dans le topbar ── */
function updateTopbarDeleteBtn() {
  const btn = document.getElementById('topbar-delete-btn');
  if (!btn) return;
  const show = ['note','character','world'].includes(state.currentView) && state.currentPageId;
  btn.style.display = show ? '' : 'none';
}