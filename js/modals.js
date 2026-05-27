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

/* ── Modal : Nouveau dossier ── */
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