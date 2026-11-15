// ===== GAME MARIO - LAVA RUN =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);
const W = 800, H = 600, GROUND = 500;
const music = $('bgMusic');
 
// ---------- Aset ----------
const img = {};
['idle_left', 'idle_right', 'jump_left', 'jump_right', 'left', 'right'].forEach(n => {
    const i = new Image(); i.src = `./assets/player_${n}.png`; img[n] = i;
});
const bg = new Image(); bg.src = './assets/Lavarja.png';
const ok = i => i.complete && i.naturalWidth > 0;
 
// ---------- Data level ----------
// ground: [x1,x2] | platforms: [x,y,w] | enemies: t 'w' jalan, 'f' terbang
const row = (x, y, n, gap = 40) => Array.from({ length: n }, (_, i) => [x + i * gap, y]);
const LEVELS = [
    { width: 2400, goal: 2300,
      ground: [[0, 900], [1050, 1700], [1850, 2400]],
      platforms: [[300, 400, 120], [520, 340, 120], [1150, 400, 120], [1450, 350, 140], [1950, 400, 120]],
      coins: [...row(300, 360, 3), ...row(520, 300, 3), ...row(950, 380, 3), ...row(1450, 310, 3), ...row(2000, 360, 3)],
      enemies: [{ t: 'w', x: 650, y: GROUND, x0: 560, x1: 880 }, { t: 'w', x: 1300, y: GROUND, x0: 1080, x1: 1680 },
                { t: 'w', x: 2050, y: GROUND, x0: 1880, x1: 2250 }] },
    { width: 3000, goal: 2900,
      ground: [[0, 700], [870, 1400], [1580, 2100], [2260, 3000]],
      platforms: [[250, 410, 100], [450, 340, 100], [780, 400, 80], [1000, 380, 120], [1200, 300, 120], [1650, 400, 120],
                  [1850, 330, 120], [2150, 400, 80], [2400, 380, 130]],
      coins: [...row(250, 370, 3), ...row(450, 300, 3), ...row(1000, 340, 3), ...row(1200, 260, 3), ...row(1850, 290, 3), ...row(2400, 340, 3)],
      enemies: [{ t: 'w', x: 500, y: GROUND, x0: 400, x1: 690 }, { t: 'w', x: 950, y: GROUND, x0: 880, x1: 1390 },
                { t: 'f', x: 1100, y: 330, x0: 900, x1: 1350 }, { t: 'w', x: 1750, y: GROUND, x0: 1600, x1: 2090 },
                { t: 'w', x: 2350, y: GROUND, x0: 2280, x1: 2750 }, { t: 'f', x: 2600, y: 360, x0: 2300, x1: 2800 }] },
    { width: 3600, goal: 3500,
      ground: [[0, 600], [780, 1200], [1390, 1800], [1990, 2500], [2690, 3600]],
      platforms: [[200, 400, 100], [380, 330, 100], [650, 400, 80], [900, 380, 100], [1250, 420, 80], [1450, 350, 100],
                  [1850, 400, 80], [2050, 330, 120], [2300, 300, 100], [2550, 400, 80], [2900, 380, 120], [3150, 320, 120]],
      coins: [...row(380, 290, 3), ...row(900, 340, 3), ...row(1450, 310, 3), ...row(2050, 290, 3), ...row(2300, 260, 3), ...row(3150, 280, 4)],
      enemies: [{ t: 'w', x: 450, y: GROUND, x0: 300, x1: 590 }, { t: 'w', x: 1000, y: GROUND, x0: 800, x1: 1190 },
                { t: 'f', x: 1000, y: 300, x0: 780, x1: 1200 }, { t: 'w', x: 1600, y: GROUND, x0: 1410, x1: 1790 },
                { t: 'f', x: 1650, y: 350, x0: 1400, x1: 1800 }, { t: 'w', x: 2200, y: GROUND, x0: 2010, x1: 2490 },
                { t: 'w', x: 2900, y: GROUND, x0: 2720, x1: 3200 }, { t: 'w', x: 3300, y: GROUND, x0: 3050, x1: 3450 },
                { t: 'f', x: 3000, y: 330, x0: 2750, x1: 3300 }] }
];
 
// ---------- State ----------
let levelIdx = 0, score = 0, lives = 3, state = 'play', cam = 0, frame = 0;
let solids = [], coins = [], enemies = [], L;
const p = { x: 60, y: GROUND - 48, w: 34, h: 48, vx: 0, vy: 0, on: false, dir: 1, inv: 0, coyote: 0 };
const keys = {};
 
function loadLevel(i) {
    L = LEVELS[i];
    solids = [
        ...L.ground.map(([a, b]) => ({ x: a, y: GROUND, w: b - a, h: H - GROUND, g: true })),
        ...L.platforms.map(([x, y, w]) => ({ x, y, w, h: 20 }))
    ];
    coins = L.coins.map(([x, y]) => ({ x, y, got: false }));
    enemies = L.enemies.map(e => ({ ...e, w: e.t === 'w' ? 36 : 40, h: e.t === 'w' ? 32 : 28,
        by: e.y, dir: Math.random() < .5 ? 1 : -1, sp: e.t === 'w' ? 1.1 + i * .2 : 1.6 + i * .2, dead: 0 }));
    enemies.forEach(e => { if (e.t === 'w') e.y = e.by - e.h; });
    respawn(); state = 'play'; updateUI();
}
function respawn() { Object.assign(p, { x: 60, y: GROUND - p.h, vx: 0, vy: 0, inv: 90, dir: 1 }); }
function updateUI() {
    $('level').textContent = `Level: ${levelIdx + 1}`;
    $('score').textContent = `Score: ${score}`;
    $('lives').textContent = `Lives: ${lives}`;
}
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
 
// ---------- Efek suara ----------
// Suara koin dibuat otomatis (tanpa file). Kalau ada assets/coin.mp3, file itu yang dipakai.
let actx;
const coinFile = new Audio('./assets/coin.mp3');
let coinFileOk = false;
coinFile.addEventListener('canplaythrough', () => coinFileOk = true, { once: true });
function playCoin() {
    if (music.muted) return;
    if (coinFileOk) { const a = coinFile.cloneNode(); a.volume = .6; a.play().catch(() => {}); return; }
    try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        const t = actx.currentTime, o = actx.createOscillator(), v = actx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(988, t);        // nada B5
        o.frequency.setValueAtTime(1319, t + .08); // nada E6
        v.gain.setValueAtTime(.12, t);
        v.gain.exponentialRampToValueAtTime(.001, t + .35);
        o.connect(v); v.connect(actx.destination);
        o.start(t); o.stop(t + .35);
    } catch (e) {}
}
 
// ---------- Input ----------
addEventListener('keydown', e => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    keys[e.code] = true; startMusic();
    if (e.code === 'KeyM') music.muted = !music.muted;
});
addEventListener('keyup', e => keys[e.code] = false);
canvas.addEventListener('click', startMusic);
function startMusic() { if (music.paused) { music.volume = .4; music.play().catch(() => {}); } }
const left = () => keys.ArrowLeft || keys.KeyA;
const right = () => keys.ArrowRight || keys.KeyD;
const jump = () => keys.Space || keys.ArrowUp || keys.KeyW;
 
// ---------- Update ----------
function hurt() {
    if (p.inv > 0) return;
    lives--; updateUI();
    if (lives <= 0) return endGame(false);
    p.inv = 120; p.vy = -8; p.vx = -p.dir * 6;
}
function update(dt) {
    frame += dt;
    // gerak horizontal
    const target = ((right() ? 1 : 0) - (left() ? 1 : 0)) * 4.6;
    p.vx += (target - p.vx) * .25 * dt;
    if (target) p.dir = Math.sign(target);
    p.x += p.vx * dt;
    for (const s of solids) if (hit(p, s)) { p.x = p.vx > 0 ? s.x - p.w : s.x + s.w; p.vx = 0; }
    p.x = Math.max(0, Math.min(L.width - p.w, p.x));
 
    // lompat & gravitasi
    p.coyote = p.on ? 8 : p.coyote - dt;
    if (jump() && p.coyote > 0) { p.vy = -13.2; p.coyote = 0; p.on = false; }
    p.vy += (jump() || p.vy > 0 ? .6 : 1.3) * dt;
    p.vy = Math.min(p.vy, 16);
    p.y += p.vy * dt; p.on = false;
    for (const s of solids) if (hit(p, s)) {
        if (p.vy > 0) { p.y = s.y - p.h; p.on = true; } else p.y = s.y + s.h;
        p.vy = 0;
    }
    if (p.inv > 0) p.inv -= dt;
 
    // jatuh ke jurang
    if (p.y > H + 80) { lives--; updateUI(); if (lives <= 0) return endGame(false); respawn(); }
 
    // koin
    for (const c of coins) if (!c.got && hit(p, { x: c.x - 10, y: c.y - 10, w: 20, h: 20 })) { c.got = true; score += 10; updateUI(); playCoin(); }
 
    // musuh
    for (const e of enemies) {
        if (e.dead) { e.dead += dt; continue; }
        e.x += e.dir * e.sp * dt;
        if (e.x < e.x0) { e.x = e.x0; e.dir = 1; } else if (e.x + e.w > e.x1) { e.x = e.x1 - e.w; e.dir = -1; }
        if (e.t === 'f') e.y = e.by + Math.sin(frame * .05 + e.x0) * 35;
        if (hit(p, e)) {
            const prevBottom = p.y + p.h - p.vy * dt;
            if (p.vy > 0 && prevBottom <= e.y + 14) { e.dead = 1; p.vy = jump() ? -12 : -8; score += 100; updateUI(); }
            else hurt();
        }
    }
    enemies = enemies.filter(e => e.dead < 20);
 
    // bendera finish
    if (state === 'play' && hit(p, { x: L.goal, y: GROUND - 170, w: 14, h: 170 })) { score += 200; updateUI(); endGame(true); }
 
    cam = Math.max(0, Math.min(L.width - W, p.x - 300));
}
 
function endGame(won) {
    state = won ? 'complete' : 'over';
    const last = levelIdx === LEVELS.length - 1;
    $('levelComplete').style.display = 'flex';
    $('levelComplete').querySelector('h1').textContent = won ? (last ? 'Kamu Menang!' : 'Level Complete!') : 'Game Over';
    $('levelCompleteMessage').textContent = won ? `Level ${levelIdx + 1} selesai! Score: ${score}` : `Score akhir: ${score}`;
    $('levelComplete').style.visibility = 'visible'; $('levelComplete').style.opacity = '1';
    $('continueButton').style.display = won && !last ? '' : 'none';
}
$('continueButton').onclick = () => { $('levelComplete').style.display = 'none'; levelIdx++; loadLevel(levelIdx); canvas.focus(); };
$('restartButton').onclick = () => { $('levelComplete').style.display = 'none'; levelIdx = 0; score = 0; lives = 3; loadLevel(0); canvas.focus(); };
 
// ---------- Gambar ----------
function drawEnemy(e) {
    const x = e.x, y = e.y, w = e.w, h = e.h;
    if (e.dead) { ctx.fillStyle = '#7a1f1f'; ctx.fillRect(x, y + h - 8, w, 8); return; }
    if (e.t === 'w') { // musuh jalan (jamur marah)
        const step = Math.floor(frame / 8) % 2 ? 3 : 0;
        ctx.fillStyle = '#3b1d0c'; ctx.fillRect(x + 2 + step, y + h - 7, 12, 7); ctx.fillRect(x + w - 14 - step, y + h - 7, 12, 7);
        ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 14, w / 2, 15, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#f2d2a5'; ctx.fillRect(x + 6, y + 14, w - 12, h - 20);
        ctx.fillStyle = '#fff'; ctx.fillRect(x + 8, y + 15, 8, 8); ctx.fillRect(x + w - 16, y + 15, 8, 8);
        ctx.fillStyle = '#000'; ctx.fillRect(x + 11 + e.dir * 2, y + 17, 3, 4); ctx.fillRect(x + w - 13 + e.dir * 2, y + 17, 3, 4);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(x + 6, y + 12); ctx.lineTo(x + 16, y + 17); ctx.moveTo(x + w - 6, y + 12); ctx.lineTo(x + w - 16, y + 17); ctx.stroke();
    } else { // musuh terbang (kelelawar)
        const flap = Math.sin(frame * .3) * 10;
        ctx.fillStyle = '#4b2a7a';
        ctx.beginPath(); ctx.moveTo(x + w / 2, y + 12); ctx.lineTo(x - 6, y + 4 - flap); ctx.lineTo(x + 8, y + 20); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + w / 2, y + 12); ctx.lineTo(x + w + 6, y + 4 - flap); ctx.lineTo(x + w - 8, y + 20); ctx.fill();
        ctx.fillStyle = '#6a3fa8'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 15, 12, 12, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#ff3b3b'; ctx.fillRect(x + w / 2 - 7, y + 11, 4, 4); ctx.fillRect(x + w / 2 + 3, y + 11, 4, 4);
        ctx.fillStyle = '#fff'; ctx.fillRect(x + w / 2 - 4, y + 19, 2, 4); ctx.fillRect(x + w / 2 + 2, y + 19, 2, 4);
    }
}
function drawPlayer() {
    if (p.inv > 0 && Math.floor(p.inv / 5) % 2) return; // berkedip saat kebal
    const d = p.dir > 0 ? 'right' : 'left';
    const key = !p.on ? `jump_${d}` : Math.abs(p.vx) > .8 ? d : `idle_${d}`;
    if (ok(img[key])) ctx.drawImage(img[key], p.x, p.y, p.w, p.h);
    else { ctx.fillStyle = '#d62828'; ctx.fillRect(p.x, p.y, p.w, p.h); }
}
function draw() {
    if (ok(bg)) { ctx.drawImage(bg, -(cam / L.width) * 200, 0, W + 200, H); }
    else { ctx.fillStyle = '#0b3a4a'; ctx.fillRect(0, 0, W, H); }
    ctx.save(); ctx.translate(-Math.round(cam), 0);
 
    for (const s of solids) {
        if (s.x + s.w < cam || s.x > cam + W) continue;
        if (s.g) { ctx.fillStyle = '#006400'; ctx.fillRect(s.x, s.y, s.w, s.h); ctx.fillStyle = '#2e9b2e'; ctx.fillRect(s.x, s.y, s.w, 8); }
        else {
            ctx.fillStyle = '#8b4513'; ctx.fillRect(s.x, s.y, s.w, s.h);
            ctx.fillStyle = '#5c2e0b'; ctx.fillRect(s.x, s.y + s.h - 4, s.w, 4);
            for (let bx = s.x + 20; bx < s.x + s.w; bx += 20) ctx.fillRect(bx, s.y, 2, s.h);
        }
    }
    // koin
    for (const c of coins) if (!c.got) {
        const sw = Math.abs(Math.cos(frame * .08 + c.x)) * 8 + 2;
        ctx.fillStyle = '#ffd400'; ctx.beginPath(); ctx.ellipse(c.x, c.y, sw, 9, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2; ctx.stroke();
    }
    // bendera finish
    ctx.fillStyle = '#ddd'; ctx.fillRect(L.goal, GROUND - 170, 6, 170);
    ctx.fillStyle = '#ffd400'; ctx.beginPath(); ctx.arc(L.goal + 3, GROUND - 172, 6, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8452c'; ctx.beginPath();
    ctx.moveTo(L.goal + 6, GROUND - 160); ctx.lineTo(L.goal + 56, GROUND - 140 + Math.sin(frame * .1) * 4); ctx.lineTo(L.goal + 6, GROUND - 120); ctx.fill();
 
    enemies.forEach(drawEnemy);
    drawPlayer();
    ctx.restore();
}
 
// ---------- Loop ----------
let last = performance.now();
function loop(t) {
    const dt = Math.min(2.5, (t - last) / 16.667); last = t;
    if (state === 'play') update(dt);
    draw();
    requestAnimationFrame(loop);
}
loadLevel(0);
state = 'menu';
$('startButton').onclick = () => {
    $('startScreen').style.display = 'none';
    state = 'play'; startMusic(); canvas.focus();
};
requestAnimationFrame(loop);
 