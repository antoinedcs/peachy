/* ================================================
   PEACHY v5 — orchard.js
   Verger de pêchers dessiné sur Canvas 2D
   Tous les arbres sont ancrés au sol, pas de SVG flottant
   ================================================ */

(function () {
  const canvas = document.getElementById('orchard-canvas');
  const ctx    = canvas.getContext('2d');

  // Pétales
  const petals = [];
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', () => { resize(); });
  resize();

  /* ── Ciel dégradé coucher de soleil ── */
  function drawSky() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,    '#1A0810');
    sky.addColorStop(0.28, '#5C1822');
    sky.addColorStop(0.55, '#B83A18');
    sky.addColorStop(0.78, '#E06020');
    sky.addColorStop(1,    '#D04A10');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── Soleil ── */
  function drawSun() {
    const sx = W * 0.5;
    const sy = H * 0.62;
    const r  = Math.min(W, H) * 0.09;

    // Halo diffus
    const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3.5);
    halo.addColorStop(0,   'rgba(255, 200, 80, 0.22)');
    halo.addColorStop(0.5, 'rgba(255, 130, 30, 0.10)');
    halo.addColorStop(1,   'rgba(255, 80,  10, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Disque solaire
    const disc = ctx.createRadialGradient(sx - r * 0.2, sy - r * 0.2, 0, sx, sy, r);
    disc.addColorStop(0,   '#FFE880');
    disc.addColorStop(0.5, '#FFB040');
    disc.addColorStop(1,   '#FF7010');
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ── Brume horizon ── */
  function drawHaze() {
    const groundY = H * 0.72;

    // Brume chaude basse
    const haze = ctx.createLinearGradient(0, groundY - H * 0.08, 0, groundY + H * 0.06);
    haze.addColorStop(0,   'rgba(220, 80, 20, 0)');
    haze.addColorStop(0.4, 'rgba(220, 80, 20, 0.14)');
    haze.addColorStop(1,   'rgba(180, 50, 10, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, groundY - H * 0.08, W, H * 0.14);
  }

  /* ── Collines lointaines ── */
  function drawHills() {
    const groundY = H * 0.72;

    // Colline 1 — très reculée
    ctx.fillStyle = '#3A1208';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.bezierCurveTo(W * 0.15, groundY - H * 0.10,
                      W * 0.35, groundY - H * 0.14,
                      W * 0.55, groundY - H * 0.08);
    ctx.bezierCurveTo(W * 0.72, groundY - H * 0.03,
                      W * 0.88, groundY - H * 0.11,
                      W,        groundY - H * 0.06);
    ctx.lineTo(W, groundY); ctx.lineTo(0, groundY);
    ctx.fill();

    // Colline 2 — un peu moins reculée
    ctx.fillStyle = '#2E0E06';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.bezierCurveTo(W * 0.1,  groundY - H * 0.07,
                      W * 0.28, groundY - H * 0.12,
                      W * 0.50, groundY - H * 0.06);
    ctx.bezierCurveTo(W * 0.68, groundY,
                      W * 0.82, groundY - H * 0.09,
                      W,        groundY - H * 0.04);
    ctx.lineTo(W, groundY); ctx.lineTo(0, groundY);
    ctx.fill();
  }

  /* ── Sol ── */
  function drawGround() {
    const groundY = H * 0.72;

    const g = ctx.createLinearGradient(0, groundY, 0, H);
    g.addColorStop(0,   '#5C2A0C');
    g.addColorStop(0.3, '#3A1608');
    g.addColorStop(1,   '#1E0A04');
    ctx.fillStyle = g;
    ctx.fillRect(0, groundY, W, H - groundY);

    // Ligne d'herbe ondulée
    const grassG = ctx.createLinearGradient(0, groundY - 6, 0, groundY + 14);
    grassG.addColorStop(0,   '#7A4A1A');
    grassG.addColorStop(1,   '#4A2008');
    ctx.fillStyle = grassG;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 6);
    for (let x = 0; x <= W; x += 40) {
      ctx.quadraticCurveTo(x + 20, groundY - 4 + Math.sin(x * 0.04) * 5, x + 40, groundY + 6);
    }
    ctx.lineTo(W, groundY + 18);
    ctx.lineTo(0, groundY + 18);
    ctx.fill();
  }

  /* ── Ombres portées des arbres sur le sol ── */
  function drawTreeShadow(x, groundY, trunkW, canopyR) {
    const sx = x + canopyR * 0.4;
    const sy = groundY + 4;
    ctx.save();
    ctx.scale(1, 0.18);
    const sg = ctx.createRadialGradient(sx, sy / 0.18, 0, sx, sy / 0.18, canopyR * 0.9);
    sg.addColorStop(0,   'rgba(0,0,0,0.35)');
    sg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.ellipse(sx, sy / 0.18, canopyR * 0.9, canopyR * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* ── Dessin d'un pêcher ── */
  function drawPeachTree(x, groundY, scale, variant) {
    const trunkH  = 55 * scale;
    const trunkW  = 9 * scale;
    const canopyR = 52 * scale;
    const tx      = x;
    const ty      = groundY; // base du tronc = niveau du sol

    // Ombre au sol
    drawTreeShadow(tx, ty, trunkW, canopyR);

    // Tronc
    const trunkGrad = ctx.createLinearGradient(tx - trunkW, 0, tx + trunkW, 0);
    trunkGrad.addColorStop(0,    '#2A0E04');
    trunkGrad.addColorStop(0.45, '#6A3010');
    trunkGrad.addColorStop(1,    '#2A0E04');
    ctx.fillStyle = trunkGrad;
    ctx.beginPath();
    // Tronc légèrement évasé en bas
    ctx.moveTo(tx - trunkW * 0.7, ty);
    ctx.bezierCurveTo(tx - trunkW * 0.9, ty - trunkH * 0.3,
                      tx - trunkW * 0.6, ty - trunkH * 0.6,
                      tx - trunkW * 0.4, ty - trunkH);
    ctx.lineTo(tx + trunkW * 0.4, ty - trunkH);
    ctx.bezierCurveTo(tx + trunkW * 0.6, ty - trunkH * 0.6,
                      tx + trunkW * 0.9, ty - trunkH * 0.3,
                      tx + trunkW * 0.7, ty);
    ctx.closePath();
    ctx.fill();

    // Centre du feuillage
    const cy = ty - trunkH - canopyR * 0.6;

    // Palettes de couleurs du feuillage selon variante
    const foliageColors = [
      ['#B84015', '#D05020', '#8A2E10'],
      ['#C04818', '#D85828', '#9A3A14'],
      ['#A83A12', '#C04A1C', '#803010'],
    ];
    const fc = foliageColors[variant % 3];

    // Feuillage — 3 couches de profondeur
    // Couche arrière (ombre)
    ctx.fillStyle = fc[2];
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(tx + canopyR * 0.18, cy + canopyR * 0.12, canopyR * 0.85, canopyR * 0.78, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Couche principale
    ctx.fillStyle = fc[0];
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.ellipse(tx, cy, canopyR, canopyR * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sous-boules gauche/droite pour donner du volume
    ctx.fillStyle = fc[1];
    ctx.globalAlpha = 0.78;
    ctx.beginPath();
    ctx.ellipse(tx - canopyR * 0.48, cy + canopyR * 0.08, canopyR * 0.62, canopyR * 0.55, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(tx + canopyR * 0.48, cy + canopyR * 0.06, canopyR * 0.62, canopyR * 0.55, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Reflet lumineux (lumière du soleil côté centre)
    const lit = ctx.createRadialGradient(tx - canopyR * 0.2, cy - canopyR * 0.28, 0, tx, cy, canopyR);
    lit.addColorStop(0,   'rgba(255, 180, 80, 0.18)');
    lit.addColorStop(0.5, 'rgba(255, 120, 40, 0.07)');
    lit.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = lit;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.ellipse(tx, cy, canopyR, canopyR * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;

    // Fleurs
    const flowerPositions = [
      [-0.48,  -0.72], [-0.22, -0.88], [0.08, -0.95],
      [0.36,   -0.80], [0.58,  -0.58], [-0.68, -0.44],
    ];
    flowerPositions.forEach(([fx, fy]) => {
      const fpx = tx + fx * canopyR;
      const fpy = cy + fy * canopyR * 0.88;
      const fr  = 3.2 * scale;
      ctx.fillStyle = '#FFB8CC';
      ctx.globalAlpha = 0.88;
      ctx.beginPath();
      ctx.arc(fpx, fpy, fr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFE0EA';
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(fpx - fr * 0.3, fpy - fr * 0.3, fr * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Fruits (pêches)
    const fruitPos = [
      [-0.32, 0.02], [0.28, 0.08], [-0.04, -0.10],
      [0.52, -0.18], [-0.56, -0.08],
    ];
    fruitPos.forEach(([fx, fy]) => {
      const fpx = tx + fx * canopyR;
      const fpy = cy + fy * canopyR;
      const fr  = 7 * scale;

      // Tige de la pêche
      ctx.strokeStyle = '#3A7A28';
      ctx.lineWidth   = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(fpx, fpy - fr);
      ctx.lineTo(fpx + 1 * scale, fpy - fr - 5 * scale);
      ctx.stroke();

      // Fruit
      const pg = ctx.createRadialGradient(fpx - fr * 0.25, fpy - fr * 0.25, 0, fpx, fpy, fr);
      pg.addColorStop(0,   '#FFCC80');
      pg.addColorStop(0.45, '#FF7830');
      pg.addColorStop(1,   '#CC3A10');
      ctx.fillStyle = pg;
      ctx.globalAlpha = 0.92;
      ctx.beginPath();
      ctx.arc(fpx, fpy, fr, 0, Math.PI * 2);
      ctx.fill();

      // Ligne médiane du fruit
      ctx.strokeStyle = 'rgba(180, 50, 10, 0.35)';
      ctx.lineWidth = 0.8 * scale;
      ctx.beginPath();
      ctx.moveTo(fpx, fpy - fr * 0.85);
      ctx.quadraticCurveTo(fpx + fr * 0.18, fpy, fpx, fpy + fr * 0.85);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Tige + feuille en haut du tronc
    ctx.fillStyle = '#3A8028';
    ctx.beginPath();
    ctx.moveTo(tx - 2 * scale, ty - trunkH);
    ctx.bezierCurveTo(tx - 2 * scale, ty - trunkH - 14 * scale,
                      tx + 12 * scale, ty - trunkH - 14 * scale,
                      tx + 14 * scale, ty - trunkH - 8 * scale);
    ctx.bezierCurveTo(tx + 4 * scale, ty - trunkH - 6 * scale,
                      tx + 2 * scale, ty - trunkH - 2 * scale,
                      tx - 2 * scale, ty - trunkH);
    ctx.fill();
  }

  /* ── Pétales ── */
  function initPetals() {
    petals.length = 0;
    for (let i = 0; i < 18; i++) {
      petals.push({
        x:     Math.random() * W,
        y:     Math.random() * H,
        vx:    (Math.random() - 0.5) * 0.6,
        vy:    0.4 + Math.random() * 0.7,
        angle: Math.random() * Math.PI * 2,
        va:    (Math.random() - 0.5) * 0.04,
        rx:    4 + Math.random() * 3,
        ry:    2 + Math.random() * 2,
        alpha: 0.4 + Math.random() * 0.5,
        color: ['#FFB8CC','#FFD0DC','#FFC4D4','#FFE0EA'][Math.floor(Math.random() * 4)],
      });
    }
  }
  initPetals();

  function updatePetals() {
    petals.forEach(p => {
      p.x     += p.vx + Math.sin(p.y * 0.012) * 0.4;
      p.y     += p.vy;
      p.angle += p.va;
      if (p.y > H + 10) {
        p.y = -10;
        p.x = Math.random() * W;
      }
    });
  }

  function drawPetals() {
    petals.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  /* ── Étoiles ── */
  const stars = Array.from({ length: 28 }, () => ({
    x: Math.random(),
    y: Math.random() * 0.45,
    r: 0.6 + Math.random() * 1.0,
    a: 0.3 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
  }));

  function drawStars(t) {
    stars.forEach(s => {
      const twinkle = 0.6 + 0.4 * Math.sin(t * 0.001 + s.phase);
      ctx.globalAlpha = s.a * twinkle;
      ctx.fillStyle = '#FFF8E8';
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  /* ── Disposition des arbres ── */
  // Chaque arbre : { xRatio, groundYRatio, scale, variant }
  // groundYRatio = position verticale du pied de l'arbre (0..1)
  // Les arbres plus haut dans l'image = plus lointains = plus petits
  const treeData = [
    // --- Rangée très lointaine (petite, haute dans l'écran) ---
    { xR: 0.05,  gR: 0.74, s: 0.48, v: 0 },
    { xR: 0.22,  gR: 0.73, s: 0.52, v: 1 },
    { xR: 0.40,  gR: 0.72, s: 0.50, v: 2 },
    { xR: 0.60,  gR: 0.72, s: 0.49, v: 0 },
    { xR: 0.78,  gR: 0.73, s: 0.51, v: 1 },
    { xR: 0.94,  gR: 0.74, s: 0.47, v: 2 },

    // --- Rangée intermédiaire ---
    { xR: 0.12,  gR: 0.80, s: 0.68, v: 2 },
    { xR: 0.30,  gR: 0.79, s: 0.72, v: 0 },
    { xR: 0.50,  gR: 0.79, s: 0.70, v: 1 },
    { xR: 0.70,  gR: 0.80, s: 0.69, v: 2 },
    { xR: 0.88,  gR: 0.79, s: 0.71, v: 0 },

    // --- Rangée avant (grandes, basses) ---
    { xR: -0.02, gR: 0.88, s: 0.96, v: 1 },
    { xR: 0.20,  gR: 0.87, s: 1.00, v: 0 },
    { xR: 0.44,  gR: 0.86, s: 0.98, v: 2 },
    { xR: 0.68,  gR: 0.87, s: 0.97, v: 1 },
    { xR: 0.92,  gR: 0.88, s: 0.95, v: 0 },
  ];

  /* ── Boucle de rendu ── */
  let lastT = 0;
  function render(t) {
    if (W !== window.innerWidth || H !== window.innerHeight) {
      resize();
      initPetals();
    }

    ctx.clearRect(0, 0, W, H);

    drawSky();
    drawStars(t);
    drawSun();
    drawHaze();
    drawHills();
    drawGround();

    // Trier arbres par profondeur (gR croissant = plus lointain d'abord)
    const sorted = [...treeData].sort((a, b) => a.gR - b.gR);

    sorted.forEach(tr => {
      const x  = tr.xR  * W;
      const gy = tr.gR  * H;
      drawPeachTree(x, gy, tr.s, tr.v);
    });

    updatePetals();
    drawPetals();

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
