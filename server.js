// ================================
// PEACHY - server.js
// Serveur simple avec API GET/POST
// ================================

const http = require('http');

const PORT = 3000;

// Tous les messages stockés en mémoire (tableau simple)
let messages = [];

// ---- Utilitaire : lire le body d'une requête POST ----
function lireBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (morceau) => { body += morceau; });
    req.on('end', () => { resolve(JSON.parse(body)); });
  });
}

// ---- Le serveur ----
const serveur = http.createServer(async (req, res) => {

  // Autorise le frontend à contacter ce serveur (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Le navigateur envoie d'abord une requête OPTIONS avant le POST, on la gère
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // ---- GET /messages ----
  // Le frontend demande : "donne-moi tous les messages du salon X"
  if (req.method === 'GET' && req.url.startsWith('/messages')) {

    // Récupère le salon depuis l'URL : /messages?salon=général
    const url = new URL(req.url, 'http://localhost');
    const salon = url.searchParams.get('salon') || 'général';

    // Filtre les messages du bon salon
    const messagesDuSalon = messages.filter(m => m.salon === salon);

    res.writeHead(200);
    res.end(JSON.stringify(messagesDuSalon));
  }

  // ---- POST /messages ----
  // Le frontend envoie : "voici un nouveau message"
  else if (req.method === 'POST' && req.url === '/messages') {

    const data = await lireBody(req);

    // On crée le message avec un timestamp
    const nouveauMessage = {
      auteur    : data.auteur,
      texte     : data.texte,
      salon     : data.salon,
      timestamp : Date.now()
    };

    messages.push(nouveauMessage);
    console.log(`[${nouveauMessage.salon}] ${nouveauMessage.auteur} : ${nouveauMessage.texte}`);

    res.writeHead(201); // 201 = créé avec succès
    res.end(JSON.stringify({ ok: true }));
  }

  // ---- Route inconnue ----
  else {
    res.writeHead(404);
    res.end(JSON.stringify({ erreur: 'Route inconnue' }));
  }

});

serveur.listen(PORT, () => {
  console.log(`Serveur Peachy démarré sur http://localhost:${PORT}`);
});
