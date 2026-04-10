/* ================================================
   PEACHY v5 — app.js
   Chat local — sans bots automatiques
   ================================================ */

const DB_KEY   = 'peachy_v5_db';
const HIST_KEY = 'peachy_v5_hist';
const MAX_MSG  = 100;

let currentUser    = null;
let currentChannel = 'général';

// ---- LocalStorage ----
function getDB() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || { users: {} }; }
  catch { return { users: {} }; }
}
function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function getHistory(ch) {
  try {
    const all = JSON.parse(localStorage.getItem(HIST_KEY)) || {};
    return all[ch] || [];
  } catch { return []; }
}
function saveMsg(ch, msg) {
  try {
    const all = JSON.parse(localStorage.getItem(HIST_KEY)) || {};
    if (!all[ch]) all[ch] = [];
    all[ch].push(msg);
    if (all[ch].length > MAX_MSG) all[ch] = all[ch].slice(-MAX_MSG);
    localStorage.setItem(HIST_KEY, JSON.stringify(all));
  } catch { console.error('Erreur sauvegarde message'); }
}

// ---- Crypto ----
async function hashPassword(p) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
  return Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, '0')).join('');
}

// ---- Auth UI ----
function switchTab(tab) {
  document.getElementById('tab-login').style.display    = tab === 'login' ? '' : 'none';
  document.getElementById('tab-register').style.display = tab === 'register' ? '' : 'none';
  document.querySelectorAll('.auth-tab').forEach((b, i) =>
    b.classList.toggle('active', (i === 0) === (tab === 'login'))
  );
  showAuthMsg('', '');
}
function showAuthMsg(txt, type) {
  const el = document.getElementById('auth-msg');
  el.textContent = txt;
  el.className = 'auth-msg' + (type ? ' ' + type : '');
}

async function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  if (!u || !p) return showAuthMsg('Remplis tous les champs.', 'error');
  const db = getDB();
  if (!db.users[u]) return showAuthMsg('Aucun compte avec ce pseudo.', 'error');
  if (db.users[u].hash !== await hashPassword(p)) return showAuthMsg('Mot de passe incorrect.', 'error');
  enterChat(u);
}

async function doRegister() {
  const u = document.getElementById('reg-user').value.trim();
  const p = document.getElementById('reg-pass').value;
  if (!u || !p) return showAuthMsg('Remplis tous les champs.', 'error');
  if (u.length < 2) return showAuthMsg('Pseudo trop court.', 'error');
  if (p.length < 4) return showAuthMsg('Mot de passe trop court (min. 4).', 'error');
  const db = getDB();
  if (db.users[u]) return showAuthMsg('Pseudo déjà pris !', 'error');
  db.users[u] = { hash: await hashPassword(p), createdAt: Date.now() };
  saveDB(db);
  showAuthMsg('Compte créé !', 'success');
  setTimeout(() => enterChat(u), 800);
}

// ---- Navigation ----
function enterChat(username) {
  currentUser = username;
  document.getElementById('user-avatar').textContent = username[0].toUpperCase();
  document.getElementById('screen-auth').classList.remove('active');
  document.getElementById('screen-chat').classList.add('active');
  document.getElementById('online-count').textContent =
    Math.max(1, Object.keys(getDB().users).length) + ' en ligne';
  loadChannel('général');
  setTimeout(() => sysMsg('général', `${username} a rejoint Peachy 🍑`), 500);
}

function doLogout() {
  sysMsg(currentChannel, `${currentUser} a quitté le chat`);
  currentUser = null;
  document.getElementById('screen-chat').classList.remove('active');
  document.getElementById('screen-auth').classList.add('active');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  showAuthMsg('', '');
}

// ---- Salons ----
function switchChannel(ch) {
  currentChannel = ch;
  document.querySelectorAll('.ch-tab').forEach(el =>
    el.classList.toggle('active', el.textContent === ch)
  );
  document.getElementById('msg-input').placeholder = `Message dans #${ch}…`;
  loadChannel(ch);
}

// ---- Messages ----
function loadChannel(ch) {
  const el = document.getElementById('messages');
  el.innerHTML = '';
  const hist = getHistory(ch);
  if (!hist.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"></div>
        <div class="empty-title">Rien ici encore</div>
        <div class="empty-sub">Lance la conversation dans #${ch} !</div>
      </div>`;
    return;
  }
  let lastDate = '';
  hist.forEach(msg => {
    const d = new Date(msg.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    if (d !== lastDate) {
      const sep = document.createElement('div');
      sep.className = 'date-sep';
      sep.textContent = d;
      el.appendChild(sep);
      lastDate = d;
    }
    renderMsg(msg, false);
  });
  el.scrollTop = el.scrollHeight;
}

function renderMsg(msg, scroll = true) {
  const container = document.getElementById('messages');
  const empty = container.querySelector('.empty-state');
  if (empty) empty.remove();

  const g = document.createElement('div');

  if (msg.type === 'system') {
    g.style.cssText = 'text-align:center;margin:6px 0;';
    g.innerHTML = `<span class="system-msg">✦ ${escHTML(msg.text)}</span>`;
  } else {
    const isSelf   = msg.author === currentUser;
    g.className    = 'msg-group' + (isSelf ? ' self' : '');
    const blobIdx  = msg.timestamp % 5;
    const blobClass = isSelf ? `sblob-${blobIdx}` : `blob-${blobIdx}`;

    g.innerHTML = `
      <div class="msg-avatar ${isSelf ? 'self-av' : 'other-av'}">${msg.author[0].toUpperCase()}</div>
      <div class="msg-body">
        <div class="msg-meta">
          <span class="msg-author ${isSelf ? 'self-col' : 'other-col'}">${escHTML(msg.author)}</span>
          <span class="msg-time">${formatTime(msg.timestamp)}</span>
        </div>
        <div class="bubble ${blobClass}">${escHTML(msg.text)}</div>
      </div>`;
  }

  container.appendChild(g);
  if (scroll) container.scrollTop = container.scrollHeight;
}

// ---- Envoi ----
function sendMessage() {
  const input = document.getElementById('msg-input');
  const text  = input.value.trim();
  if (!text || !currentUser) return;
  input.value = '';
  updateChargeBar('');
  spawnFlyingPeach();
  const msg = { type: 'text', author: currentUser, text, timestamp: Date.now(), channel: currentChannel };
  saveMsg(currentChannel, msg);
  renderMsg(msg);
}

function sysMsg(ch, text) {
  const msg = { type: 'system', author: 'system', text, timestamp: Date.now(), channel: ch };
  saveMsg(ch, msg);
  if (ch === currentChannel) renderMsg(msg);
}

// ---- Pêche qui s'envole ----
function spawnFlyingPeach() {
  const btn  = document.getElementById('btn-send');
  const rect = btn.getBoundingClientRect();
  const p    = document.createElement('div');
  p.className = 'flying-peach';
  p.textContent = '🍑';
  p.style.left   = (rect.left + rect.width / 2 - 10) + 'px';
  p.style.bottom = (window.innerHeight - rect.bottom + rect.height / 2) + 'px';
  document.getElementById('peach-container').appendChild(p);
  setTimeout(() => p.remove(), 950);
}

// ---- Barre de charge ----
function updateChargeBar(val) {
  const pct  = Math.min(100, (val.length / 500) * 100);
  const fill = document.getElementById('charge-fill');
  fill.style.width      = pct + '%';
  fill.style.background = pct > 80 ? '#FF4F6D' : pct > 55 ? '#FFA020' : '#FF6B35';
}

// ---- Utils ----
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function escHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- Event Listeners ----
document.getElementById('msg-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
document.getElementById('msg-input').addEventListener('input', e => updateChargeBar(e.target.value));
['login-pass', 'login-user'].forEach(id =>
  document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); })
);
['reg-pass', 'reg-user'].forEach(id =>
  document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); })
);
