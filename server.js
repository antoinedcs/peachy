const http = require('http');
const fs   = require('fs');
const path = require('path');
const WebSocket = require('ws');
const crypto = require('crypto');

const PORT = 3000;

const utilisateurs = {};
const historique = { 'général': [], 'random': [], 'aide': [] };
const MAX_HISTORIQUE = 50;
const connexions = {};

const TYPES_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
};

const serveurHTTP = http.createServer(function(req, res) {
  let fichier = req.url === '/' ? '/index.html' : req.url;
  const cheminFichier = path.join(__dirname, 'public', fichier);
  const extension = path.extname(cheminFichier);
  fs.readFile(cheminFichier, function(err, data) {
    if (err) { res.writeHead(404); res.end('Fichier non trouvé'); return; }
    res.writeHead(200, { 'Content-Type': TYPES_MIME[extension] || 'text/plain' });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server: serveurHTTP });

wss.on('connection', function(ws) {
  let pseudoConnecte = null;

  ws.on('message', function(donneesBrutes) {
    let msg;
    try { msg = JSON.parse(donneesBrutes); } catch(e) { return; }

    switch (msg.type) {

      case 'inscription': {
        const { pseudo, mdp } = msg;
        if (!pseudo || !mdp || pseudo.length < 2 || mdp.length < 4) {
          envoyer(ws, { type: 'erreur', texte: 'Pseudo ou mot de passe trop court.' }); return;
        }
        if (utilisateurs[pseudo]) {
          envoyer(ws, { type: 'erreur', texte: 'Ce pseudo est déjà pris !' }); return;
        }
        utilisateurs[pseudo] = { hash: hasher(mdp) };
        connecter(ws, pseudo);
        break;
      }

      case 'connexion': {
        const { pseudo, mdp } = msg;
        if (!utilisateurs[pseudo]) {
          envoyer(ws, { type: 'erreur', texte: 'Aucun compte avec ce pseudo.' }); return;
        }
        if (utilisateurs[pseudo].hash !== hasher(mdp)) {
          envoyer(ws, { type: 'erreur', texte: 'Mot de passe incorrect.' }); return;
        }
        if (connexions[pseudo]) {
          envoyer(ws, { type: 'erreur', texte: 'Pseudo déjà connecté.' }); return;
        }
        connecter(ws, pseudo);
        break;
      }

      case 'message': {
        if (!pseudoConnecte) return;
        const { salon, texte } = msg;
        if (!texte || !texte.trim() || !historique[salon]) return;
        const nouveauMsg = {
          type: 'message', auteur: pseudoConnecte,
          salon, texte: texte.trim().slice(0, 300), timestamp: Date.now(),
        };
        historique[salon].push(nouveauMsg);
        if (historique[salon].length > MAX_HISTORIQUE) historique[salon].shift();
        diffuser(nouveauMsg);
        break;
      }

      case 'deconnexion':
        deconnecter(ws, pseudoConnecte);
        break;
    }
  });

  ws.on('close', function() { if (pseudoConnecte) deconnecter(ws, pseudoConnecte); });
  ws.on('error', function(err) { console.error('Erreur WS:', err.message); });

  function connecter(ws, pseudo) {
    pseudoConnecte = pseudo;
    connexions[pseudo] = ws;
    console.log(pseudo + ' connecté (' + Object.keys(connexions).length + ' en ligne)');
    envoyer(ws, { type: 'connexion_ok', pseudo, connectes: Object.keys(connexions), historique });
    diffuser({ type: 'systeme', texte: pseudo + ' a rejoint le chat 🍑', timestamp: Date.now() });
    diffuserConnectes();
  }

  function deconnecter(ws, pseudo) {
    if (!pseudo || !connexions[pseudo]) return;
    delete connexions[pseudo];
    console.log(pseudo + ' déconnecté (' + Object.keys(connexions).length + ' en ligne)');
    diffuser({ type: 'systeme', texte: pseudo + ' a quitté le chat', timestamp: Date.now() });
    diffuserConnectes();
  }
});

function envoyer(ws, data) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}
function diffuser(data) {
  const json = JSON.stringify(data);
  Object.values(connexions).forEach(function(ws) {
    if (ws.readyState === WebSocket.OPEN) ws.send(json);
  });
}
function diffuserConnectes() {
  diffuser({ type: 'liste_connectes', connectes: Object.keys(connexions) });
}
function hasher(mdp) {
  return crypto.createHash('sha256').update(mdp).digest('hex');
}

serveurHTTP.listen(PORT, function() {
  console.log('');
  console.log('🍑 Peachy démarré !');
  console.log('👉 http://localhost:' + PORT);
  console.log('');
});
