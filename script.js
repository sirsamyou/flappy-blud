// -------------------------------------------------
// GLOBALS
// -------------------------------------------------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const game = document.getElementById('game');
const uiScore = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScore');
const menuHigh = document.getElementById('menuHigh');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');
const pauseOverlay = document.getElementById('pause');
const gameover = document.getElementById('gameover');
const finalScore = document.getElementById('finalScore');
const newRecord = document.getElementById('newRecord');
const restartBtn2 = document.getElementById('restartBtn2');
const menuBtn2 = document.getElementById('menuBtn2');

let bird, pipes = [], particles = [], clouds = [], score = 0, highScore = 0;
let gameRunning = false, paused = false, biome = 0, biomeTimer = 0;
const BIOME_DURATION = 1800; // 30s at 60fps
const GRAVITY = 0.6, JUMP = -11;
let frames = 0, currentBird = null;

// Load high score
highScore = parseInt(localStorage.getItem('flappyBludHigh') || '0');
bestScoreEl.textContent = highScore;
menuHigh.textContent = highScore;

// Preload birds
const birdImages = {};
['bird1.png', 'bird2.png'].forEach(src => {
    const img = new Image();
    img.src = 'assets/' + src;
    birdImages[src] = img;
});

// -------------------------------------------------
// BIOMES
// -------------------------------------------------
const BIOMES = [
    { name: "DAY", sky: ['#87CEEB', '#E0F7FA'], pipe: '#2d5016', cloud: true },
    { name: "NIGHT", sky: ['#0a1a2e', '#1a3a5e'], pipe: '#1e3a0d', cloud: false, stars: true },
    { name: "DESERT", sky: ['#ff9a6a', '#ffd4a3'], pipe: '#b87333', cloud: false },
    { name: "UNDERWATER", sky: ['#0f4c75', '#3282b8'], pipe: '#1e6091', cloud: false, bubbles: true }
];

// -------------------------------------------------
// RESIZE
// -------------------------------------------------
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initClouds();
}
window.addEventListener('resize', resize);
resize();

// -------------------------------------------------
// PARTICLES
// -------------------------------------------------
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 30;
        this.color = color;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.life--;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 3, 3);
    }
}

// -------------------------------------------------
// CLOUDS
// -------------------------------------------------
function initClouds() {
    clouds = [];
    if (BIOMES[biome].cloud) {
        for (let i = 0; i < 5; i++) {
            clouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * 200 + 50,
                speed: 0.2 + Math.random() * 0.3
            });
        }
    }
}

// -------------------------------------------------
// BIRD
// -------------------------------------------------
class Bird {
    constructor(src) {
        this.img = birdImages[src];
        this.w = 60; this.h = 44;
        this.x = canvas.width * 0.2;
        this.y = canvas.height / 2;
        this.vel = 0;
        this.trail = [];
    }
    update() {
        if (!gameRunning || paused) return;
        this.vel += GRAVITY;
        this.y += this.vel;
        this.trail.push({x: this.x, y: this.y, a: 1});
        this.trail = this.trail.filter(t => t.a > 0).map(t => ({...t, a: t.a - 0.05}));
        if (this.y + this.h > canvas.height || this.y < -50) this.die();
    }
    draw() {
        // Trail
        this.trail.forEach((t, i) => {
            ctx.globalAlpha flow t.a;
            ctx.drawImage(this.img, t.x - this.w/2, t.y - this.h/2, this.w, this.h);
        });
        ctx.globalAlpha = 1;

        // Bird
        ctx.save();
        ctx.translate(this.x, this.y);
        const rot = Math.min(this.vel * 0.05, Math.PI / 3);
        ctx.rotate(rot);
        ctx.drawImage(this.img, -this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
    }
    flap() {
        if (!gameRunning || paused) return;
        this.vel = JUMP;
        for (let i = 0; i < 8; i++) {
            particles.push(new Particle(this.x, this.y, '#0ff'));
        }
    }
    die() { endGame(); }
}

// -------------------------------------------------
// PIPE
// -------------------------------------------------
class Pipe {
    constructor() {
        this.gap = 180;
        this.w = 80;
        this.top = Math.random() * (canvas.height - this.gap - 200) + 100;
        this.bottom = this.top + this.gap;
        this.x = canvas.width;
        this.speed = 4 + score * 0.05;
        this.passed = false;
        this.color = BIOMES[biome].pipe;
    }
    update() {
        this.x -= this.speed;
        if (this.x + this.w < 0) pipes = pipes.filter(p => p !== this);
        if (!this.passed && this.x + this.w < bird.x) {
            this.passed = true;
            score++;
            uiScore.textContent = score;
            popScore();
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('flappyBludHigh', highScore);
                bestScoreEl.textContent = highScore;
            }
        }
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, 0, this.w, this.top);
        ctx.fillRect(this.x, this.bottom, this.w, canvas.height - this.bottom);
        ctx.fillRect(this.x - 10, this.top - 40, this.w + 20, 40);
        ctx.fillRect(this.x - 10, this.bottom, this.w + 20, 40);
    }
    hits(b) {
        return b.x + b.w/2 > this.x && b.x - b.w/2 < this.x + this.w &&
               (b.y - b.h/2 < this.top || b.y + b.h/2 > this.bottom);
    }
}

// -------------------------------------------------
// GAME LOOP
// -------------------------------------------------
function loop() {
    if (!gameRunning || paused) {
        requestAnimationFrame(loop);
        return;
    }

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Sky
    const sky = BIOMES[biome].sky;
    const grad = ctx.createLinearGradient(0,0,0,canvas.height);
    grad.addColorStop(0, sky[0]);
    grad.addColorStop(1, sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Stars (Night)
    if (BIOMES[biome].stars) {
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
            const x = (frames * 0.1 + i * 200) % canvas.width;
            const y = (i * 73) % 300 + 50;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    // Clouds
    clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -200) c.x = canvas.width;
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#fff';
        ctx.fillRect(c.x, c.y, 120, 40);
        ctx.fillRect(c.x + 30, c.y - 20, 60, 40);
        ctx.globalAlpha = 1;
    });

    // Update
    bird.update();
    bird.draw();
    particles = particles.filter(p => p.life > 0).map(p => { p.update(); p.draw(); return p; });

    // Pipes
    if (frames % 90 === 0) pipes.push(new Pipe());
    pipes.forEach(p => { p.update(); p.draw(); if (p.hits(bird)) bird.die(); });

    // Biome transition
    biomeTimer++;
    if (biomeTimer >= BIOME_DURATION) {
        biome = (biome + 1) % BIOMES.length;
        biomeTimer = 0;
        showBiomeName(BIOMES[biome].name);
        initClouds();
    }

    frames++;
    requestAnimationFrame(loop);
}

// -------------------------------------------------
// UI HELPERS
// -------------------------------------------------
function popScore() {
    uiScore.style.transform = 'scale(1.3)';
    setTimeout(() => uiScore.style.transform = 'scale(1)', 150);
}

function showBiomeName(name) {
    const el = document.createElement('div');
    el.id = 'biomeName';
    el.className = 'show';
    el.textContent = name;
    document.getElementById('ui').appendChild(el);
    setTimeout(() => el.remove(), 2000);
}

function togglePause() {
    if (!gameRunning) return;
    paused = !paused;
    pauseOverlay.classList.toggle('hidden');
    pauseBtn.textContent = paused ? 'RESUME' : 'PAUSE';
    pauseBtn.classList.toggle('pause');
}

// -------------------------------------------------
// INPUT
// -------------------------------------------------
function flap(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    if (paused || !gameRunning) return;
    bird.flap();
}
canvas.addEventListener('mousedown', flap);
canvas.addEventListener('touchstart', flap);
document.addEventListener('keydown', e => {
    if (e.code === 'Space') flap(e);
    if (e.code === 'KeyP') togglePause();
});

// Easter egg: hold UP for rainbow
let upHeld = 0;
document.addEventListener('keydown', e => { if (e.code === 'ArrowUp') upHeld++; });
document.addEventListener('keyup', e => { if (e.code === 'ArrowUp') upHeld = 0; });
setInterval(() => { if (upHeld > 180) document.body.style.filter = 'hue-rotate(360deg)'; }, 100);

// -------------------------------------------------
// GAME FLOW
// -------------------------------------------------
function startGame(birdSrc) {
    currentBird = birdSrc;
    menu.classList.add('hidden');
    game.classList.remove('hidden');
    gameover.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    restartBtn.classList.add('hidden');
    menuBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    pauseBtn.textContent = 'PAUSE';

    bird = new Bird(currentBird);
    pipes = []; particles = []; score = 0; frames = 0; biomeTimer = 0; biome = 0;
    uiScore.textContent = '0';
    paused = false; gameRunning = true;
    initClouds();
    loop();
}

function endGame() {
    gameRunning = false;
    finalScore.textContent = `Score: ${score}`;
    newRecord.classList.toggle('hidden', score <= highScore);
    gameover.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
    menuBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
}

// Buttons
document.querySelectorAll('.bird-select button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.bird-select button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        startGame(btn.dataset.bird);
    });
});
pauseBtn.onclick = togglePause;
restartBtn.onclick = () => startGame(currentBird);
menuBtn.onclick = () => { game.classList.add('hidden'); menu.classList.remove('hidden'); };
restartBtn2.onclick = () => startGame(currentBird);
menuBtn2.onclick = () => { game.classList.add('hidden'); menu.classList.remove('hidden'); };

// -------------------------------------------------
// INIT
// -------------------------------------------------
window.addEventListener('load', () => {
    initClouds();
});
