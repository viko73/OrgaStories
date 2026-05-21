/* ═══════════════════════════════════════════════
   ORGASTORIES — Authentification & Persistance
   Stockage : localStorage
   Clés :
     orgastories_users          → { email: { name, passwordHash } }
     orgastories_session        → { email, name }
     orgastories_data_{email}   → { spaces: [...] }
═══════════════════════════════════════════════ */

/* ── Utilitaires ── */

// Hash simple (non cryptographique, suffisant pour usage local)
function hashPassword(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem('orgastories_users') || '{}'); }
  catch { return {}; }
}

function saveUsers(users) {
  localStorage.setItem('orgastories_users', JSON.stringify(users));
}

function getSession() {
  try { return JSON.parse(localStorage.getItem('orgastories_session') || 'null'); }
  catch { return null; }
}

function saveSession(session) {
  localStorage.setItem('orgastories_session', JSON.stringify(session));
}

function loadUserData(email) {
  const key = 'orgastories_data_' + email.replace(/[^a-z0-9]/gi, '_');
  try { return JSON.parse(localStorage.getItem(key) || 'null'); }
  catch { return null; }
}

function saveUserData(email, data) {
  const key = 'orgastories_data_' + email.replace(/[^a-z0-9]/gi, '_');
  localStorage.setItem(key, JSON.stringify(data));
}

/* ── Interface ── */

function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('form-login').style.display    = tab === 'login'    ? '' : 'none';
  document.getElementById('form-register').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('login-error').textContent = '';
  document.getElementById('reg-error').textContent   = '';
}

function showAuthError(formId, msg) {
  document.getElementById(formId).textContent = msg;
}

/* ── Connexion ── */
function login() {
  const email    = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  if (!email || !password) return showAuthError('login-error', 'Remplis tous les champs.');

  const users = getUsers();
  if (!users[email]) return showAuthError('login-error', 'Aucun compte avec cet email.');
  if (users[email].passwordHash !== hashPassword(password))
    return showAuthError('login-error', 'Mot de passe incorrect.');

  const session = { email, name: users[email].name };
  saveSession(session);
  enterApp(session);
}

/* ── Inscription ── */
function register() {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;

  if (!name || !email || !password) return showAuthError('reg-error', 'Remplis tous les champs.');
  if (password.length < 8) return showAuthError('reg-error', 'Mot de passe trop court (8 caractères min).');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAuthError('reg-error', 'Email invalide.');

  const users = getUsers();
  if (users[email]) return showAuthError('reg-error', 'Un compte existe déjà avec cet email.');

  users[email] = { name, passwordHash: hashPassword(password) };
  saveUsers(users);

  const session = { email, name };
  saveSession(session);
  enterApp(session);
}

/* ── Déconnexion ── */
function logout() {
  persistState();
  localStorage.removeItem('orgastories_session');

  const screen = document.getElementById('auth-screen');
  screen.style.display = '';        // retire le display:none
  screen.classList.remove('hidden'); // retire l'opacité 0
  document.getElementById('login-email').value    = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').textContent = '';
  switchAuthTab('login');
}

/* ── Entrée dans l'app ── */
function enterApp(session) {
  document.getElementById('user-name').textContent   = session.name;
  document.getElementById('user-email').textContent  = session.email;
  document.getElementById('user-avatar').textContent = session.name[0].toUpperCase();

  // Mettre à jour le prénom dans le message d'accueil
  const greetEl = document.getElementById('home-greeting');
  if (greetEl) greetEl.textContent = `// Bienvenue, ${session.name} 👋`;

  // Masquer l'écran de connexion avec transition
  const screen = document.getElementById('auth-screen');
  screen.classList.add('hidden');
  setTimeout(() => { screen.style.display = 'none'; }, 300);

  // Charger les données de l'utilisateur
  const saved = loadUserData(session.email);
  if (saved && saved.spaces) {
    state.spaces = saved.spaces;
  } else {
    state.spaces = [];
  }

  state.currentSpaceId  = null;
  state.currentPageId   = null;
  state.currentCategory = null;
  state.currentView     = 'home';

  renderSidebar();
  showHome();
  // Init des listeners modales (une seule fois)
  if (!window._modalsInited) {
    initModals();
    window._modalsInited = true;
  }
}

/* ═══════════════════════════════════════════════
   PERSISTANCE AUTOMATIQUE
═══════════════════════════════════════════════ */

function persistState() {
  const session = getSession();
  if (!session) return;
  saveUserData(session.email, { spaces: state.spaces });
}

// Sauvegarde toutes les 5 secondes
setInterval(() => { if (getSession()) persistState(); }, 5000);

// Sauvegarde à la fermeture
window.addEventListener('beforeunload', () => { if (getSession()) persistState(); });

/* ── Init au chargement ── */
document.addEventListener('DOMContentLoaded', () => {
  const session = getSession();
  if (session) {
    const users = getUsers();
    if (users[session.email]) {
      enterApp(session);
      return;
    }
    localStorage.removeItem('orgastories_session');
  }
  // Aucune session valide → l'écran de connexion reste visible
});