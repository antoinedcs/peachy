/* ================================================
   PEACHY - app.js
   Version simple : API GET / POST
   ================================================ */

const SERVEUR  = 'http://localhost:3000';
const DB_KEY   = 'peachy_db';

let utilisateurActuel = null;
let salonActuel       = 'général';
let dernierTimestamp  = 0; // pour ne pas réafficher les vieux messages

// ==============================
// AUTH (inchangé, localStorage)
// ==============================

function getDB() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || { users: {} }; }
  catch { return { users: {} }; }
}
function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

async function hashPassword(p) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
  return Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, '0')).join('');
}

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

// ==============================
// NAVIGATION
// ==============================

function enterChat(username) {
  utilisateurActuel = username;
  document.getElementById('user-avatar').textContent = username[0].toUpperCase();
  document.getElementById('screen-auth').classList.remove('active');
  document.getElementById('screen-chat').classList.add('active');

  chargerSalon('général');
  demarrerPolling(); // commence à interroger le serveur toutes les 2 sec
}

function doLogout() {
  utilisateurActuel = null;
  arreterPolling();
  document.getElementById('screen-chat').classList.remove('active');
  document.getElementById('screen-auth').classList.add('active');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  showAuthMsg('', '');
}

function switchChannel(ch) {
  salonActuel      = ch;
  dernierTimestamp = 0; // on repart de zéro pour ce salon
  document.querySelectorAll('.ch-tab').forEach(el =>
    el.classList.toggle('active', el.textContent === ch)
  );
  document.getElementById('msg-input').placeholder = `Message dans #${ch}…`;
  document.getElementById('messages').innerHTML = '';
  chargerSalon(ch); // charge immédiatement les messages du nouveau salon
}

function chargerSalon(ch) {
  salonActuel = ch;
  document.querySelectorAll('.ch-tab').forEach(el =>
    el.classList.toggle('active', el.textContent === ch)
  );
  document.getElementById('msg-input').placeholder = `Message dans #${ch}…`;
}

// ==============================
// POLLING (GET toutes les 2 sec)
// ==============================

let intervalPolling = null;

function demarrerPolling() {
  recupererMessages(); // une première fois tout de suite
  intervalPolling = setInterval(recupererMessages, 2000); // puis toutes les 2 sec
}

function arreterPolling() {
  clearInterval(intervalPolling);
}

// Fait un GET /messages?salon=général
async function recupererMessages() {
  try {
    const reponse = await fetch(`${SERVEUR}/messages?salon=${salonActuel}`);
    const messages = await reponse.json();

    // On affiche seulement les messages qu'on n'a pas encore vus
    const nouveaux = messages.filter(m => m.timestamp > dernierTimestamp);

    nouveaux.forEach(msg => afficherMessage(msg));

    if (nouveaux.length > 0) {
      dernierTimestamp = nouveaux[nouveaux.length - 1].timestamp;
    }

  } catch (e) {
    console.error('Impossible de contacter le serveur :', e);
  }
}

// ==============================
// ENVOI D'UN MESSAGE (POST)
// ==============================

async function sendMessage() {
  const input = document.getElementById('msg-input');
  const texte = input.value.trim();
  if (!texte || !utilisateurActuel) return;

  input.value = '';
  updateChargeBar('');
  spawnFlyingPeach();

  // Fait un POST /messages avec le message en JSON dans le body
  await fetch(`${SERVEUR}/messages`, {
    method  : 'POST',
    headers : { 'Content-Type': 'application/json' },
    body    : JSON.stringify({
      auteur : utilisateurActuel,
      texte  : texte,
      salon  : salonActuel
    })
  });

  // On recharge les messages immédiatement après l'envoi
  recupererMessages();
}

// ==============================
// AFFICHAGE DES MESSAGES
// ==============================

function afficherMessage(msg) {
  const container = document.getElementById('messages');
  const vide = container.querySelector('.empty-state');
  if (vide) vide.remove();

  const isSelf   = msg.auteur === utilisateurActuel;
  const g        = document.createElement('div');
  g.className    = 'msg-group' + (isSelf ? ' self' : '');
  const blobIdx  = msg.timestamp % 5;
  const blobClass = isSelf ? `sblob-${blobIdx}` : `blob-${blobIdx}`;

  g.innerHTML = `
    <div class="msg-avatar ${isSelf ? 'self-av' : 'other-av'}">${msg.auteur[0].toUpperCase()}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-author ${isSelf ? 'self-col' : 'other-col'}">${escHTML(msg.auteur)}</span>
        <span class="msg-time">${formatTime(msg.timestamp)}</span>
      </div>
      <div class="bubble ${blobClass}">${escHTML(msg.texte)}</div>
    </div>`;

  container.appendChild(g);
  container.scrollTop = container.scrollHeight;
}

// ==============================
// UTILS (inchangés)
// ==============================

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

function updateChargeBar(val) {
  const pct  = Math.min(100, (val.length / 500) * 100);
  const fill = document.getElementById('charge-fill');
  fill.style.width      = pct + '%';
  fill.style.background = pct > 80 ? '#FF4F6D' : pct > 55 ? '#FFA020' : '#FF6B35';
}

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

// ==============================
// EVENT LISTENERS (inchangés)
// ==============================

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
