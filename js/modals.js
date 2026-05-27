/* ═══════════════════════════════════════════════
   ORGASTORIES — Modales
   Contient : openModal, closeModal, createSpace,
              createPage, openModalPageType, selectPageType
═══════════════════════════════════════════════ */

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

/* ── Modal : Nouvel espace ── */
function openModalSpace() {
  openModal('modal-space');
  document.getElementById('space-name-input').value = '';
  document.getElementById('space-icon-input').value = '📁';
  setTimeout(() => document.getElementById('space-name-input').focus(), 50);
}

function createSpace() {
  const name = document.getElementById('space-name-input').value.trim();
  const icon = document.getElementById('space-icon-input').value.trim() || '📁';
  if (!name) { document.getElementById('space-name-input').focus(); return; }

  const id = 's' + Date.now();
  state.spaces.unshift({ id, name, icon, pages: [] });
  closeModal('modal-space');
  state.currentSpaceId = id;
  renderSidebar();
  showSpaceView(id);
  renderSpacesGrid();
  persistState();
}

let _pendingSpaceId   = null;
let _selectedPageType = 'note';
let _pendingFolderId  = null;

function openModalPage(spaceId) {
  _pendingSpaceId  = spaceId;
  _pendingFolderId = null;
  _selectedPageType = 'note';
  document.getElementById('page-name-input').value = '';
  document.querySelectorAll('.modal-opt').forEach(o => {
    o.className = o.className.replace(/selected-\w+/g, '').trim();
  });
  document.querySelector('.modal-opt.note').classList.add('selected-note');
  openModal('modal-page');
  setTimeout(() => document.getElementById('page-name-input').focus(), 50);
}

function openModalPageType(spaceId, type, folderId) {
  _pendingSpaceId   = spaceId;
  _selectedPageType = type;
  _pendingFolderId  = folderId || null;
  document.getElementById('page-name-input').value = '';
  document.querySelectorAll('.modal-opt').forEach(o => {
    o.className = o.className.replace(/selected-\w+/g, '').trim();
  });
  document.querySelector(`.modal-opt.${type}`).classList.add('selected-' + type);
  openModal('modal-page');
  setTimeout(() => document.getElementById('page-name-input').focus(), 50);
}

function selectPageType(type, el) {
  _selectedPageType = type;
  document.querySelectorAll('.modal-opt').forEach(o => {
    o.className = o.className.replace(/selected-\w+/g, '').trim();
  });
  el.classList.add('selected-' + type);
}

function createPage() {
  const name = document.getElementById('page-name-input').value.trim();
  if (!name) { document.getElementById('page-name-input').focus(); return; }

  const defaultContent = {
    note:      { body: '' },
    character: { role: '', age: '', appearance: '', personality: '', backstory: '', relations: [] },
    world:     { genre: '', description: '', geography: '', magic: '', society: '', history: '', notes: '' }
  };

  const id   = 'p' + Date.now();
  const page = { id, type: _selectedPageType, title: name, content: defaultContent[_selectedPageType] };
  if (_pendingFolderId) page.folderId = _pendingFolderId;

  const space = getSpace(_pendingSpaceId);
  space.pages.push(page);

  closeModal('modal-page');
  renderSidebar();
  openPage(_pendingSpaceId, id);
  updateStats();
  renderSpacesGrid();
  persistState();
}

/* ── Modal : Déplacer une page ── */
let _moveSpaceId = null;
let _movePageId  = null;
let _moveType    = null;

function openModalMove(spaceId, pageId, type) {
  _moveSpaceId = spaceId;
  _movePageId  = pageId;
  _moveType    = type;

  const space   = getSpace(spaceId);
  const page    = (space?.pages || []).find(p => p.id === pageId);
  const folders = (space?.folders || []).filter(f => f.type === type);

  const cfg = {
    note:      { label: 'cette note' },
    character: { label: 'ce personnage' },
    world:     { label: 'ce monde' },
  };

  const list = document.getElementById('move-folder-list');
  list.innerHTML = '';

  // Option : aucun dossier
  const noneEl = document.createElement('div');
  noneEl.className = 'move-folder-opt' + (!page?.folderId ? ' selected' : '');
  noneEl.onclick = () => movePageToFolder(null);
  noneEl.innerHTML = `<span class="move-folder-opt-icon">—</span><span>Aucun dossier</span>`;
  list.appendChild(noneEl);

  // Options : dossiers existants
  folders
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
    .forEach(f => {
      const el = document.createElement('div');
      el.className = 'move-folder-opt' + (page?.folderId === f.id ? ' selected' : '');
      el.onclick = () => movePageToFolder(f.id);
      el.innerHTML = `<span class="move-folder-opt-icon">📁</span><span>${escHtml(f.name)}</span>`;
      list.appendChild(el);
    });

  // Si aucun dossier existe
  if (folders.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.style.cssText = 'padding:16px;text-align:center;font-size:12px;color:var(--text-faint);font-family:var(--font-mono)';
    emptyEl.textContent = 'Aucun dossier créé pour l\'instant';
    list.appendChild(emptyEl);
  }

  document.getElementById('move-modal-sub').textContent =
    `Choisir le dossier pour "${escHtml(page?.title || '')}"`;

  openModal('modal-move');
}

function movePageToFolder(folderId) {
  const space = getSpace(_moveSpaceId);
  const page  = (space?.pages || []).find(p => p.id === _movePageId);
  if (!page) return;

  if (folderId) {
    page.folderId = folderId;
  } else {
    delete page.folderId;
  }

  closeModal('modal-move');
  persistState();
  renderSidebar();
  showCategoryView(_moveType, state.currentFolderId);
}

let _pendingFolderSpaceId = null;
let _pendingFolderType    = null;

function openModalFolder(spaceId, type) {
  _pendingFolderSpaceId = spaceId;
  _pendingFolderType    = type;
  document.getElementById('folder-name-input').value = '';
  openModal('modal-folder');
  setTimeout(() => document.getElementById('folder-name-input').focus(), 50);
}

function createFolder() {
  const name = document.getElementById('folder-name-input').value.trim();
  if (!name) { document.getElementById('folder-name-input').focus(); return; }

  const space = getSpace(_pendingFolderSpaceId);
  if (!space.folders) space.folders = [];
  const id = 'f' + Date.now();
  space.folders.push({ id, name, type: _pendingFolderType });

  closeModal('modal-folder');
  persistState();
  showCategoryView(_pendingFolderType);
}