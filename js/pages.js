/* ═══════════════════════════════════════════════
   ORGASTORIES — Éditeurs de pages
   Contient : renderNoteView, renderCharView, renderWorldView
              et leurs fonctions de sauvegarde
═══════════════════════════════════════════════ */

/* ── NOTE ── */
const LINE_HEIGHT_PX = 15 * 1.8; // font-size × line-height = 27px

function renderNoteView(page) {
  activateView('view-note');
  document.getElementById('note-title').value = page.title;
  document.getElementById('note-space-label').textContent = getSpace(state.currentSpaceId).name;

  const body     = document.getElementById('note-body');
  const lineNums = document.getElementById('note-line-numbers');

  // Remplir le textarea
  body.value = page.content.body || '';

  // Ajuster la hauteur et les numéros
  autoResize(body);
  updateLineNumbers(body, lineNums);

  // Titre
  document.getElementById('note-title').oninput = function () {
    page.title = this.value;
    renderSidebar();
    setBreadcrumb([
      { label: getSpace(state.currentSpaceId).name, action: () => showSpaceView(state.currentSpaceId) },
      { label: page.title }
    ]);
  };

  // Saisie
  body.oninput = function () {
    page.content.body = this.value;
    autoResize(this);
    updateLineNumbers(this, lineNums);
    persistState();
  };

  // Sync scroll entre numéros et textarea
  body.onscroll = function () {
    lineNums.scrollTop = this.scrollTop;
  };

  // Ligne active au clic / clavier
  body.onkeyup = body.onclick = function () {
    highlightActiveLine(this, lineNums);
  };
}

function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.max(textarea.scrollHeight, 400) + 'px';
}

function updateLineNumbers(textarea, container) {
  const total = countVisualLines(textarea);

  // Reconstruire seulement si le nombre change
  if (container.children.length === total) return;

  container.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= total; i++) {
    const span = document.createElement('span');
    span.textContent = i;
    frag.appendChild(span);
  }
  container.appendChild(frag);
}

function countVisualLines(textarea) {
  // Méthode : on mesure la hauteur totale du textarea
  // puis on divise par la hauteur d'une ligne
  const cs         = window.getComputedStyle(textarea);
  const lineHeight = parseFloat(cs.lineHeight);
  const paddingTop = parseFloat(cs.paddingTop);
  const paddingBot = parseFloat(cs.paddingBottom);

  // scrollHeight = hauteur totale du contenu (sans padding vertical)
  const contentHeight = textarea.scrollHeight - paddingTop - paddingBot;
  return Math.max(Math.round(contentHeight / lineHeight), 1);
}

function highlightActiveLine(textarea, container) {
  const cs         = window.getComputedStyle(textarea);
  const lineHeight = parseFloat(cs.lineHeight);
  const paddingTop = parseFloat(cs.paddingTop);

  // Position verticale du curseur = lignes avant lui × lineHeight
  const text   = textarea.value.substring(0, textarea.selectionStart);
  const lineIndex = countVisualLinesForText(textarea, text) - 1;

  Array.from(container.children).forEach((span, i) => {
    span.classList.toggle('active-line', i === lineIndex);
  });
}

function countVisualLinesForText(textarea, text) {
  // Crée un clone du textarea avec seulement le texte avant le curseur
  let clone = document.getElementById('_ta_clone');
  if (!clone) {
    clone = document.createElement('textarea');
    clone.id = '_ta_clone';
    clone.style.cssText = [
      'position:absolute', 'top:-9999px', 'left:-9999px',
      'visibility:hidden', 'pointer-events:none',
      'overflow:hidden'
    ].join(';');
    document.body.appendChild(clone);
  }

  const cs = window.getComputedStyle(textarea);
  clone.style.width      = textarea.offsetWidth + 'px';
  clone.style.fontFamily = cs.fontFamily;
  clone.style.fontSize   = cs.fontSize;
  clone.style.lineHeight = cs.lineHeight;
  clone.style.padding    = cs.padding;
  clone.style.whiteSpace = 'pre-wrap';
  clone.style.wordWrap   = 'break-word';
  clone.style.resize     = 'none';
  clone.value = text || ' ';
  clone.style.height = 'auto';

  const lineHeight = parseFloat(cs.lineHeight);
  const paddingTop = parseFloat(cs.paddingTop);
  const paddingBot = parseFloat(cs.paddingBottom);
  const contentH   = clone.scrollHeight - paddingTop - paddingBot;
  return Math.max(Math.round(contentH / lineHeight), 1);
}

function formatDoc(cmd, val) {
  // Inapplicable sur textarea — boutons désactivés silencieusement
}

/* ── PERSONNAGE ── */
function renderCharView(page) {
  activateView('view-char');
  const c = page.content;

  setVal('char-name',        page.title);
  setVal('char-role',        c.role);
  setVal('char-age',         c.age);
  setVal('char-appearance',  c.appearance);
  setVal('char-personality', c.personality);
  setVal('char-backstory',   c.backstory);
  updateCharInitial(page.title);

  // Relations
  renderRelations(page);

  // Sauvegarde à la saisie
  ['char-name','char-role','char-age','char-appearance','char-personality','char-backstory'].forEach(id => {
    document.getElementById(id).oninput = () => saveCharField(id, page);
  });
}

function saveCharField(fieldId, page) {
  const map = {
    'char-name':        'title',
    'char-role':        'role',
    'char-age':         'age',
    'char-appearance':  'appearance',
    'char-personality': 'personality',
    'char-backstory':   'backstory'
  };
  const val = document.getElementById(fieldId).value;
  if (fieldId === 'char-name') {
    page.title = val;
    updateCharInitial(val);
    renderSidebar();
    setBreadcrumb([
      { label: getSpace(state.currentSpaceId).name, action: () => showSpaceView(state.currentSpaceId) },
      { label: val }
    ]);
  } else {
    page.content[map[fieldId]] = val;
  }
  persistState();
}

function updateCharInitial(name) {
  const el = document.getElementById('char-initial');
  if (el) el.textContent = name ? name[0].toUpperCase() : '?';
}

/* ── RELATIONS ── */
const RELATION_TYPES = ['Ami·e', 'Ennemi·e', 'Famille', 'Allié·e', 'Rival·e', 'Amour', 'Mentor', 'Autre'];

function renderRelations(page) {
  const list = document.getElementById('relations-list');
  if (!list) return;
  const relations = page.content.relations || [];

  list.innerHTML = relations.map((r, i) => `
    <div class="relation-item" id="rel-${i}">
      <input class="relation-name" value="${escHtml(r.name)}" placeholder="Nom…"
             oninput="saveRelationField(${i}, 'name', this.value)">
      <div class="relation-sep"></div>
      <select class="relation-type" onchange="saveRelationField(${i}, 'type', this.value)">
        ${RELATION_TYPES.map(t => `<option value="${t}" ${r.type === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
      <div class="relation-sep"></div>
      <input class="relation-desc" value="${escHtml(r.desc)}" placeholder="Description de la relation…"
             oninput="saveRelationField(${i}, 'desc', this.value)">
      <button class="relation-del" onclick="removeRelation(${i})" title="Supprimer">✕</button>
    </div>
  `).join('');
}

function saveRelationField(index, field, value) {
  const page = getPage(state.currentSpaceId, state.currentPageId);
  if (!page || !page.content.relations) return;
  page.content.relations[index][field] = value;
  persistState();
}

function addRelation() {
  const page = getPage(state.currentSpaceId, state.currentPageId);
  if (!page) return;
  if (!page.content.relations) page.content.relations = [];
  page.content.relations.push({ name: '', type: 'Ami·e', desc: '' });
  renderRelations(page);
  persistState();
  // Focus sur le nouveau champ nom
  const items = document.querySelectorAll('.relation-item');
  if (items.length) items[items.length - 1].querySelector('.relation-name').focus();
}

function removeRelation(index) {
  const page = getPage(state.currentSpaceId, state.currentPageId);
  if (!page || !page.content.relations) return;
  page.content.relations.splice(index, 1);
  renderRelations(page);
  persistState();
}

/* Anciennes fonctions traits conservées pour compatibilité */
function addTrait() {}
function removeTrait() {}

/* ── MONDE ── */
function renderWorldView(page) {
  activateView('view-world');
  const w = page.content;

  setVal('world-name',        page.title);
  setVal('world-type',        w.genre);
  setVal('world-description', w.description);
  setVal('world-geography',   w.geography);
  setVal('world-magic',       w.magic);
  setVal('world-society',     w.society);
  setVal('world-history',     w.history);
  setVal('world-notes',       w.notes);

  ['world-name','world-type','world-description','world-geography',
   'world-magic','world-society','world-history','world-notes'].forEach(id => {
    document.getElementById(id).oninput = () => saveWorldField(id, page);
  });
}

function saveWorldField(fieldId, page) {
  const map = {
    'world-name':        'title',
    'world-type':        'genre',
    'world-description': 'description',
    'world-geography':   'geography',
    'world-magic':       'magic',
    'world-society':     'society',
    'world-history':     'history',
    'world-notes':       'notes'
  };
  const val = document.getElementById(fieldId).value;
  if (fieldId === 'world-name') {
    page.title = val;
    renderSidebar();
    setBreadcrumb([
      { label: getSpace(state.currentSpaceId).name, action: () => showSpaceView(state.currentSpaceId) },
      { label: val }
    ]);
  } else {
    page.content[map[fieldId]] = val;
  }
  persistState();
}