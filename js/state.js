/* ═══════════════════════════════════════════════
   ORGASTORIES — État de l'application
   Contient : state global, données exemple, init
═══════════════════════════════════════════════ */

let state = {
  spaces: [
    { id: 's1', name: 'Roman Aethermoor', icon: '📚', pages: [] }
  ],
  currentSpaceId: null,
  currentPageId: null,
  currentCategory: null, // 'note' | 'character' | 'world'
  currentView: 'home'    // 'home' | 'space' | 'category' | 'note' | 'character' | 'world'
};

const examplePages = {
  s1: [
    {
      id: 'p1', type: 'note', title: 'Brainstorming initial',
      content: { body: 'Premières idées pour le roman.\n\n→ Ambiance steampunk éthérée\n→ Thèmes : mémoire, identité\n→ Références : Studio Ghibli, Moebius' }
    },
    {
      id: 'p2', type: 'character', title: 'Lyara',
      content: {
        role: 'Archiviste des Cieux', age: '28 ans, née à Aethermoor',
        appearance: 'Cheveux argent, yeux violets, cicatrice à la tempe gauche',
        personality: 'Déterminée et méticuleuse, Lyara cache une grande solitude derrière une façade froide. Sa curiosité insatiable la pousse parfois à prendre des risques inconsidérés.',
        backstory: 'Orpheline élevée par les archivistes, Lyara a découvert une anomalie dans les cristaux d\'éther.',
        relations: [
          { name: 'Kael', type: 'Rival·e', desc: 'Ancien camarade de formation, désormais au service du Conclave.' },
          { name: 'Maître Orvyn', type: 'Mentor', desc: 'L\'archiviste en chef qui l\'a formée et lui cache des secrets.' }
        ]
      }
    },
    {
      id: 'p3', type: 'world', title: 'Aethermoor',
      content: {
        genre: 'Fantaisie steampunk éthérée',
        description: 'Un archipel de cités suspendues dans les nuages, alimentées par des cristaux d\'éther.',
        geography: 'Cité haute : les Pinacles\nCité médiane : le Marché des Vents\nCité basse : les Brumes',
        magic: 'Les Cristaux d\'Éther stockent l\'énergie des tempêtes. Rare : la Résonnance.',
        society: 'Gouvernée par le Conclave des Maisons (5 grandes familles).',
        history: 'Le Grand Cataclysme (il y a 300 ans) : cause inconnue.',
        notes: 'Que se passe-t-il vraiment sous l\'Abîsse ?'
      }
    }
  ]
};

state.spaces[0].pages = examplePages.s1;

/* ── Helpers bas niveau ── */
function getSpace(id) { return state.spaces.find(s => s.id === id); }

function getPage(spaceId, pageId) {
  const s = getSpace(spaceId);
  return s ? s.pages.find(p => p.id === pageId) : null;
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function setTextContent(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function updateStats() {
  let notes = 0, chars = 0, worlds = 0;
  state.spaces.forEach(s => s.pages.forEach(p => {
    if (p.type === 'note') notes++;
    else if (p.type === 'character') chars++;
    else if (p.type === 'world') worlds++;
  }));
  setTextContent('stat-notes', notes);
  setTextContent('stat-chars', chars);
  setTextContent('stat-worlds', worlds);
  setTextContent('stat-spaces', state.spaces.length);
}

/* ── Init des modales (appelé par auth.js après connexion) ── */
function initModals() {
  document.getElementById('modal-space').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('modal-space');
  });
  document.getElementById('modal-folder').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('modal-folder');
  });
}