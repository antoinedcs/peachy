/* ================================================
   PARTIE 1 : DESSIN DU VERGER (Canvas) — inchangé
   ================================================ */

const canvas = document.getElementById('fond');
const ctx    = canvas.getContext('2d');

function redimensionnerCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
redimensionnerCanvas();
window.addEventListener('resize', redimensionnerCanvas);

function dessinerCiel() {
  const W = canvas.width, H = canvas.height;
  const degrade = ctx.createLinearGradient(0, 0, 0, H);
  degrade.addColorStop(0,    '#1A0810');
  degrade.addColorStop(0.3,  '#5C1822');
  degrade.addColorStop(0.6,  '#B83A18');
  degrade.addColorStop(0.85, '#E06020');
  degrade.addColorStop(1,    '#C04010');
  ctx.fillStyle = degrade;
  ctx.fillRect(0, 0, W, H);
}

function dessinerSoleil() {
  const W = canvas.width, H = canvas.height;
  const sx = W * 0.5, sy = H * 0.58;
  const r  = Math.min(W, H) * 0.07;
  const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4);
  halo.addColorStop(0,   'rgba(255,200,80,0.20)');
  halo.addColorStop(0.6, 'rgba(255,130,30,0.08)');
  halo.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(sx, sy, r * 4, 0, Math.PI * 2); ctx.fill();
  const disque = ctx.createRadialGradient(sx - r * 0.2, sy - r * 0.2, 0, sx, sy, r);
  disque.addColorStop(0,   '#FFE880');
  disque.addColorStop(0.5, '#FFB040');
  disque.addColorStop(1,   '#FF7010');
  ctx.fillStyle = disque;
  ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
}

function dessinerSol() {
  const W = canvas.width, H = canvas.height;
  const niveauSol = H * 0.72;
  const terre = ctx.createLinearGradient(0, niveauSol, 0, H);
  terre.addColorStop(0, '#5C2A0C'); terre.addColorStop(1, '#1E0A04');
  ctx.fillStyle = terre;
  ctx.fillRect(0, niveauSol, W, H - niveauSol);
  ctx.fillStyle = '#6A3A10';
  ctx.beginPath(); ctx.moveTo(0, niveauSol + 8);
  for (let x = 0; x <= W; x += 50)
    ctx.quadraticCurveTo(x + 25, niveauSol - 5, x + 50, niveauSol + 8);
  ctx.lineTo(W, niveauSol + 20); ctx.lineTo(0, niveauSol + 20); ctx.fill();
}

function dessinerArbre(x, solY, taille) {
  const hauteurTronc = 55 * taille, largeurTronc = 8 * taille, rayonFeuillage = 50 * taille;
  const couleurTronc = ctx.createLinearGradient(x - largeurTronc, 0, x + largeurTronc, 0);
  couleurTronc.addColorStop(0, '#250C04'); couleurTronc.addColorStop(0.5, '#6A3010'); couleurTronc.addColorStop(1, '#250C04');
  ctx.fillStyle = couleurTronc;
  ctx.beginPath();
  ctx.roundRect(x - largeurTronc / 2, solY - hauteurTronc, largeurTronc, hauteurTronc, [largeurTronc / 2, largeurTronc / 2, 0, 0]);
  ctx.fill();
  const cy = solY - hauteurTronc - rayonFeuillage * 0.5;
  ctx.globalAlpha = 0.75; ctx.fillStyle = '#8A2E10';
  ctx.beginPath(); ctx.arc(x + rayonFeuillage * 0.15, cy + rayonFeuillage * 0.1, rayonFeuillage * 0.85, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.92; ctx.fillStyle = '#B84015';
  ctx.beginPath(); ctx.arc(x, cy, rayonFeuillage, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.20; ctx.fillStyle = '#FFD080';
  ctx.beginPath(); ctx.arc(x - rayonFeuillage * 0.25, cy - rayonFeuillage * 0.25, rayonFeuillage * 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  [[-0.5,-0.7],[-0.2,-0.9],[0.15,-0.92],[0.45,-0.72],[0.62,-0.48],[-0.65,-0.4]].forEach(([fx,fy]) => {
    ctx.fillStyle = '#FFB8CC'; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(x + fx * rayonFeuillage, cy + fy * rayonFeuillage, 3 * taille, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  [[-0.35,0.0],[0.28,0.05],[0.0,-0.15],[0.50,-0.2],[-0.52,-0.1]].forEach(([fx,fy]) => {
    const px = x + fx * rayonFeuillage, py = cy + fy * rayonFeuillage, r = 6.5 * taille;
    ctx.strokeStyle = '#3A7A28'; ctx.lineWidth = 1.2 * taille;
    ctx.beginPath(); ctx.moveTo(px, py - r); ctx.lineTo(px + 1, py - r - 5 * taille); ctx.stroke();
    const cf = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r);
    cf.addColorStop(0, '#FFCC80'); cf.addColorStop(0.5, '#FF7830'); cf.addColorStop(1, '#CC3A10');
    ctx.fillStyle = cf; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });
}

const ARBRES = [
  { xRatio: 0.04, solRatio: 0.73, taille: 0.45 }, { xRatio: 0.22, solRatio: 0.72, taille: 0.50 },
  { xRatio: 0.42, solRatio: 0.71, taille: 0.48 }, { xRatio: 0.62, solRatio: 0.72, taille: 0.47 },
  { xRatio: 0.80, solRatio: 0.73, taille: 0.49 }, { xRatio: 0.97, solRatio: 0.74, taille: 0.44 },
  { xRatio: 0.13, solRatio: 0.80, taille: 0.68 }, { xRatio: 0.35, solRatio: 0.79, taille: 0.72 },
  { xRatio: 0.57, solRatio: 0.79, taille: 0.70 }, { xRatio: 0.78, solRatio: 0.80, taille: 0.67 },
  { xRatio: 0.0,  solRatio: 0.88, taille: 0.95 }, { xRatio: 0.22, solRatio: 0.87, taille: 1.00 },
  { xRatio: 0.46, solRatio: 0.86, taille: 0.98 }, { xRatio: 0.70, solRatio: 0.87, taille: 0.96 },
  { xRatio: 0.93, solRatio: 0.88, taille: 0.94 },
];

const petales = [];
for (let i = 0; i < 15; i++) {
  petales.push({
    x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.5, vy: 0.5 + Math.random() * 0.6,
    angle: Math.random() * Math.PI * 2, va: (Math.random() - 0.5) * 0.03,
    rx: 4 + Math.random() * 3, ry: 2 + Math.random() * 1.5,
    alpha: 0.4 + Math.random() * 0.5,
  });
}

function dessinerPetales() {
  petales.forEach(p => {
    p.x += p.vx + Math.sin(p.y * 0.01) * 0.3; p.y += p.vy; p.angle += p.va;
    if (p.y > canvas.height + 10) { p.y = -10; p.x = Math.random() * canvas.width; }
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
    ctx.globalAlpha = p.alpha; ctx.fillStyle = '#FFB8CC';
    ctx.beginPath(); ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });
  ctx.globalAlpha = 1;
}

function dessiner() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  dessinerCiel(); dessinerSoleil(); dessinerSol();
  [...ARBRES].sort((a, b) => a.solRatio - b.solRatio).forEach(arbre =>
    dessinerArbre(arbre.xRatio * W, arbre.solRatio * H, arbre.taille)
  );
  dessinerPetales();
  requestAnimationFrame(dessiner);
}
requestAnimationFrame(dessiner);


/* ================================================
   PARTIE 2 : AUTHENTIFICATION via API REST
   ================================================ */

/* Socket.io — connexion automatique au serveur */
const socket = io();

let utilisateurActuel = null;
let salonActuel       = 'général';


/* ---- Afficher l'un des deux formulaires ---- */
function afficherOnglet(onglet) {
  document.getElementById('form-connexion').style.display  = onglet === 'connexion'  ? 'flex' : 'none';
  document.getElementById('form-inscription').style.display = onglet === 'inscription' ? 'flex' : 'none';
  const boutons = document.querySelectorAll('.onglet');
  boutons[0].classList.toggle('actif', onglet === 'connexion');
  boutons[1].classList.toggle('actif', onglet === 'inscription');
  afficherMessageAuth('', '');
}

function afficherMessageAuth(texte, type) {
  const el = document.getElementById('message-auth');
  el.textContent = texte;
  el.className   = type === 'succes' ? 'succes' : '';
}


/* ---- Connexion ---- */
async function seConnecter() {
  const pseudo = document.getElementById('co-pseudo').value.trim();
  const mdp    = document.getElementById('co-mdp').value;
  if (!pseudo || !mdp) { afficherMessageAuth('Remplis tous les champs !', 'erreur'); return; }

  try {
    const res  = await fetch('/api/connexion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: pseudo, password: mdp }),
    });
    const data = await res.json();
    if (data.erreur) { afficherMessageAuth(data.erreur, 'erreur'); return; }
    entrerDansLeChat(data.pseudo);
  } catch {
    afficherMessageAuth('Impossible de joindre le serveur.', 'erreur');
  }
}


/* ---- Inscription ---- */
async function sInscrire() {
  const pseudo = document.getElementById('in-pseudo').value.trim();
  const mdp    = document.getElementById('in-mdp').value;
  if (!pseudo || !mdp) { afficherMessageAuth('Remplis tous les champs !', 'erreur'); return; }
  if (pseudo.length < 2) { afficherMessageAuth('Pseudo trop court (min. 2 car.).', 'erreur'); return; }
  if (mdp.length < 4)    { afficherMessageAuth('Mot de passe trop court (min. 4 car.).', 'erreur'); return; }

  try {
    const res  = await fetch('/api/inscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: pseudo, password: mdp }),
    });
    const data = await res.json();
    if (data.erreur) { afficherMessageAuth(data.erreur, 'erreur'); return; }
    afficherMessageAuth('Compte créé ! Connexion…', 'succes');
    setTimeout(() => entrerDansLeChat(data.pseudo), 800);
  } catch {
    afficherMessageAuth('Impossible de joindre le serveur.', 'erreur');
  }
}


/* ---- Entrer dans le chat ---- */
function entrerDansLeChat(pseudo) {
  utilisateurActuel = pseudo;
  document.getElementById('bulle-pseudo').textContent = pseudo[0].toUpperCase();
  document.getElementById('page-connexion').style.display = 'none';
  document.getElementById('page-chat').style.display      = 'flex';

  /* On s'identifie auprès du serveur Socket.io */
  socket.emit('rejoindre', { pseudo });

  /* On charge l'historique du salon courant */
  chargerMessages();
}


/* ---- Déconnexion ---- */
function seDeconnecter() {
  socket.emit('deconnexion');
  utilisateurActuel = null;
  document.getElementById('page-chat').style.display      = 'none';
  document.getElementById('page-connexion').style.display = 'flex';
  document.getElementById('co-pseudo').value = '';
  document.getElementById('co-mdp').value    = '';
  afficherMessageAuth('', '');
}


/* ================================================
   PARTIE 3 : CHAT via Socket.io
   ================================================ */

/* ---- Réception des événements serveur ---- */

/* Un message arrive en temps réel */
socket.on('message', function(msg) {
  /* On n'affiche que les messages du salon actif */
  if (msg.salon === salonActuel) afficherMessage(msg, true);
});

/* Message système (connexion/déconnexion d'un autre user) */
socket.on('systeme', function(msg) {
  ajouterMessageSysteme(msg.texte);
});

/* Mise à jour du compteur de connectés */
socket.on('liste_connectes', function(data) {
  document.getElementById('nb-connectes').textContent = data.count + ' en ligne 🟢';
});


/* ---- Changer de salon ---- */
function changerSalon(salon) {
  salonActuel = salon;
  document.querySelectorAll('.salon').forEach(btn =>
    btn.classList.toggle('actif', btn.textContent === salon)
  );
  document.getElementById('champ-message').placeholder = 'Message dans #' + salon + '…';
  chargerMessages();
}


/* ---- Charger l'historique depuis la BDD ---- */
async function chargerMessages() {
  const zone = document.getElementById('zone-messages');
  zone.innerHTML = '';

  try {
    const res      = await fetch('/api/messages/' + encodeURIComponent(salonActuel));
    const messages = await res.json();

    if (!messages.length) {
      zone.innerHTML = `
        <div id="etat-vide">
          <span class="emoji">🍑</span>
          Aucun message ici…<br>Lance la conversation !
        </div>`;
      return;
    }

    messages.forEach(msg => afficherMessage(msg, false));
    zone.scrollTop = zone.scrollHeight;
  } catch {
    zone.innerHTML = `<div id="etat-vide"><span class="emoji">⚠️</span>Erreur de chargement.</div>`;
  }
}


/* ---- Envoyer un message ---- */
function envoyerMessage() {
  const champ = document.getElementById('champ-message');
  const texte = champ.value.trim();
  if (!texte || !utilisateurActuel) return;

  /* On émet via Socket.io — le serveur persiste en BDD et rediffuse */
  socket.emit('message', { salon: salonActuel, texte });
  champ.value = '';
  animerBoutonEnvoi();
}


/* ---- Afficher une bulle de message ---- */
function afficherMessage(msg, scroller) {
  const zone = document.getElementById('zone-messages');
  const vide = document.getElementById('etat-vide');
  if (vide) vide.remove();

  if (msg.type === 'systeme') {
    const el = document.createElement('div');
    el.className   = 'msg-systeme';
    el.textContent = '✦ ' + msg.texte;
    zone.appendChild(el);
    if (scroller) zone.scrollTop = zone.scrollHeight;
    return;
  }

  const estMoi  = msg.auteur === utilisateurActuel;
  const groupe  = document.createElement('div');
  groupe.className = 'msg-groupe' + (estMoi ? ' moi' : '');

  const heure = new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  });

  groupe.innerHTML = `
    <div class="avatar">${msg.auteur[0].toUpperCase()}</div>
    <div class="msg-contenu">
      <div class="msg-meta">${protegerHTML(msg.auteur)} · ${heure}</div>
      <div class="bulle">${protegerHTML(msg.texte)}</div>
    </div>`;

  zone.appendChild(groupe);
  if (scroller) zone.scrollTop = zone.scrollHeight;
}


/* ---- Message système local (sans sauvegarde) ---- */
function ajouterMessageSysteme(texte) {
  afficherMessage({ type: 'systeme', texte, timestamp: Date.now() }, true);
}


/* ---- Animation du bouton Envoyer ---- */
function animerBoutonEnvoi() {
  const btn = document.getElementById('btn-envoyer');
  btn.style.transform = 'scale(0.9)';
  setTimeout(() => { btn.style.transform = 'scale(1)'; }, 120);
}


/* ---- Échappement HTML ---- */
function protegerHTML(texte) {
  return String(texte)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}