// -------------------------------------------------
// Config & globals
// -------------------------------------------------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const game = document.getElementById('game');
const pauseBtn = document.getElementById('pauseBtn');
const gameover = document.getElementById('gameover');
const finalScore = document.getElementById('finalScore');
const highScoreEl = document.getElementById('highScore');
const finalBalance = document.getElementById('finalBalance');
const restartBtn2 = document.getElementById('restartBtn2');
const menuBtn2 = document.getElementById('menuBtn2');
const liveScore = document.getElementById('liveScore');
const uiHighScore = document.getElementById('uiHighScore');
const uiBalance = document.getElementById('uiBalance');
const menuHighScore = document.getElementById('menuHighScore');
const menuBalance = document.getElementById('menuBalance');
const countdownEl = document.getElementById('countdown');
const playTab = document.getElementById('playTab');
const shopTab = document.getElementById('shopTab');
const playScreen = document.getElementById('playScreen');
const shopScreen = document.getElementById('shopScreen');

let bird, pipes = [], coins = [], clouds = [], score = 0, highScore = 0, balance = 0, gameRunning = false, isPaused = false;
const gravity = 0.6, jump = -10;
let frames = 0, lastPipe = 0, pipeCount = 0;

// Preload assets
const birdImages = {}, cloudImg = new Image(), coinImg = new Image();
const birdOptions = Array.from({length: 8}, (_, i) => `bird${i+1}.png`);
const birdPrices = { 'bird1.png': 0, 'bird2.png': 50, 'bird3.png': 100, 'bird4.png': 150, 'bird5.png': 200, 'bird6.png': 250, 'bird7.png': 300, 'bird8.png': 350 };
let ownedBirds = ['bird1.png'];

function preload() {
    birdOptions.forEach(src => {
        const img = new Image();
        img.src = 'assets/' + src;
        birdImages[src] = img;
    });
    cloudImg.src = 'assets/cloud.png';
    coinImg.src = 'assets/coin.png';
}
preload();

// Load saves
function loadSaves() {
    highScore = parseInt(localStorage.getItem('flappyHighScore') || '0');
    balance = parseInt(localStorage.getItem('flappyCoins') || '0');
    ownedBirds = JSON.parse(localStorage.getItem('flappyOwnedBirds') || '["bird1.png"]');
    updateAllStats();
    updateShop();
}
function saveSaves() {
    localStorage.setItem('flappyHighScore', highScore);
    localStorage.setItem('flappyCoins', balance);
    localStorage.setItem('flappyOwnedBirds', JSON.stringify(ownedBirds));
}
function updateAllStats() {
    uiHighScore.textContent = `BEST: ${highScore}`;
    uiBalance.textContent = `COINS: ${balance}`;
    menuHighScore.textContent = `HIGH: ${highScore}`;
    menuBalance.textContent = `COINS: ${balance}`;
    highScoreEl.textContent = `High Score: ${highScore}`;
    finalBalance.textContent = `Coins: ${balance}`;
}
loadSaves();

// -------------------------------------------------
// Resize
// -------------------------------------------------
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// -------------------------------------------------
// Bird
// -------------------------------------------------
class Bird {
    constructor(src) {
        this.img = birdImages[src];
        this.w = 60; this.h = 44;
        this.x = canvas.width * 0.2;
        this.y = canvas.height / 2;
        this.vel = 0;
    }
    update() {
        if (isPaused || !gameRunning) return;
        this.vel += gravity;
        this.y += this.vel;
        if (this.y + this.h > canvas.height - 100 || this.y < -this.h) this.die();
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const rot = Math.min(this.vel * 0.05, Math.PI / 3);
        ctx.rotate(rot);
        ctx.drawImage(this.img, -this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
    }
    flap() { this.vel = jump; }
    die() { endGame(); }
}

// -------------------------------------------------
// Pipe
// -------------------------------------------------
class Pipe {
    constructor() {
        this.gap = 180;
        this.w = 80;
        this.top = Math.random() * (canvas.height - this.gap - 300) + 150;
        this.bottom = this.top + this.gap;
        this.x = canvas.width;
        this.speed = 4;
        this.passed = false;
        pipeCount++;
    }
    update() {
        if (isPaused || !gameRunning) return;
        this.x -= this.speed;
        if (this.x + this.w < 0) pipes = pipes.filter(p => p !== this);
        if (!this.passed && this.x + this.w < bird.x) {
            this.passed = true;
            score++;
            liveScore.textContent = score;
            if (score > highScore) {
                highScore = score;
                saveSaves();
                updateAllStats();
            }
            // Coin every 10-15 pipes
            if (pipeCount % (10 + Math.floor(Math.random() * 6)) === 0) {
                coins.push(new Coin(this.top, this.bottom));
            }
        }
    }
    draw() {
        const pipeColor = '#2d5016', capColor = '#1e3a0d';
        ctx.fillStyle = pipeColor;
        ctx.fillRect(this.x, 0, this.w, this.top);
        ctx.fillStyle = capColor;
        ctx.fillRect(this.x - 10, this.top - 40, this.w + 20, 40);
        ctx.fillStyle = pipeColor;
        ctx.fillRect(this.x, this.bottom, this.w, canvas.height - this.bottom);
        ctx.fillStyle = capColor;
        ctx.fillRect(this.x - 10, this.bottom, this.w + 20, 40);
    }
    hits(b) {
        const bl = b.x - b.w/2, br = b.x + b.w/2;
        const bt = b.y - b.h/2, bb = b.y + b.h/2;
        return br > this.x && bl < this.x + this.w && (bt < this.top || bb > this.bottom);
    }
}

// -------------------------------------------------
// Coin
// -------------------------------------------------
class Coin {
    constructor(top, bottom) {
        this.w = 40; this.h = 40;
        this.x = canvas.width + 100;
        this.y = top + (bottom - top - this.h) / 2;
        this.collected = false;
    }
    update() {
        if (isPaused || !gameRunning) return;
        this.x -= 4;
        if (this.x + this.w < 0) coins = coins.filter(c => c !== this);
        if (!this.collected && this.hits(bird)) {
            this.collected = true;
            balance++;
            updateAllStats();
            saveSaves();
        }
    }
    draw() {
        if (this.collected) return;
        ctx.drawImage(coinImg, this.x, this.y, this.w, this.h);
    }
    hits(b) {
        const bl = b.x - b.w/2, br = b.x + b.w/2;
        const bt = b.y - b.h/2, bb = b.y + b.h/2;
        return br > this.x && bl < this.x + this.w && bb > this.y && bt < this.y + this.h;
    }
}

// -------------------------------------------------
// Cloud
// -------------------------------------------------
function spawnCloud() {
    clouds.push({
        x: canvas.width + 100,
        y: Math.random() * (canvas.height * 0.4),
        speed: 0.5 + Math.random() * 0.5
    });
}
setInterval(spawnCloud, 3000);
spawnCloud();

// -------------------------------------------------
// Game loop
// -------------------------------------------------
function loop() {
    if (!gameRunning || isPaused) {
        if (gameRunning && isPaused) requestAnimationFrame(loop);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clouds
    clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x + 200 < 0) clouds = clouds.filter(cl => cl !== c);
        ctx.drawImage(cloudImg, c.x, c.y, 200, 120);
    });

    // Ground
    ctx.fillStyle = '#567d46';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    ctx.fillStyle = '#6b8e23';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 20);

    bird.update();
    bird.draw();

    if (frames - lastPipe > 90) {
        pipes.push(new Pipe());
        lastPipe = frames;
    }

    pipes.forEach(p => { p.update(); p.draw(); if (p.hits(bird)) bird.die(); });
    coins.forEach(c => { c.update(); c.draw(); });

    frames++;
    requestAnimationFrame(loop);
}

// -------------------------------------------------
// Input
// -------------------------------------------------
function flap(e) {
    if (!gameRunning || isPaused) return;
    if (e.type === 'keydown' && e.code !== 'Space') return;
    if (e.target.closest('.ui-btn')) return;
    bird.flap();
    e.preventDefault();
}
canvas.addEventListener('mousedown', flap);
canvas.addEventListener('touchstart', flap);
document.addEventListener('keydown', flap);

// -------------------------------------------------
// Pause + Resume
// -------------------------------------------------
let pausedOverlay = null, countdownActive = false;

function togglePause() {
    if (!gameRunning || countdownActive) return;
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'RESUME' : 'PAUSE';
    if (isPaused) {
        pausedOverlay = document.createElement('div');
        pausedOverlay.id = 'paused';
        pausedOverlay.innerHTML = 'PAUSED<br><small>Tap to resume</small>';
        document.body.appendChild(pausedOverlay);
    } else {
        startCountdown();
    }
}

function startCountdown() {
    if (!pausedOverlay) return;
    countdownActive = true;
    isPaused = false;
    pauseBtn.textContent = 'PAUSE';
    pausedOverlay.remove();
    pausedOverlay = null;

    let count = 3;
    countdownEl.classList.remove('hidden');
    countdownEl.textContent = count;

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.textContent = count;
        } else {
            countdownEl.classList.add('hidden');
            countdownActive = false;
            requestAnimationFrame(loop);
            clearInterval(interval);
        }
    }, 800);
}

canvas.addEventListener('mousedown', e => {
    if (isPaused && !countdownActive && !e.target.closest('#pauseBtn')) startCountdown();
});
canvas.addEventListener('touchstart', e => {
    if (isPaused && !countdownActive && !e.target.closest('#pauseBtn')) startCountdown();
});

pauseBtn.addEventListener('click', togglePause);

// -------------------------------------------------
// Game Flow
// -------------------------------------------------
let currentBird = 'bird1.png';

function startGame(birdSrc) {
    currentBird = birdSrc;
    menu.classList.add('hidden');
    game.classList.remove('hidden');
    gameover.classList.add('hidden');

    isPaused = false; countdownActive = false;
    pauseBtn.textContent = 'PAUSE';
    countdownEl.classList.add('hidden');
    if (pausedOverlay) { pausedOverlay.remove(); pausedOverlay = null; }

    bird = new Bird(currentBird);
    pipes = []; coins = []; clouds = [];
    score = 0; liveScore.textContent = '0';
    frames = 0; lastPipe = 0; pipeCount = 0;
    gameRunning = true;
    requestAnimationFrame(loop);
}

function endGame() {
    gameRunning = false;
    finalScore.textContent = `Score: ${score}`;
    updateAllStats();
    gameover.classList.remove('hidden');
}

function goToMenu() {
    game.classList.add('hidden');
    menu.classList.remove('hidden');
    gameover.classList.add('hidden');
    gameRunning = false; isPaused = false; countdownActive = false;
    if (pausedOverlay) { pausedOverlay.remove(); pausedOverlay = null; }
    countdownEl.classList.add('hidden');
    showPlayTab();
}

// -------------------------------------------------
// Menu Tabs
// -------------------------------------------------
function showPlayTab() {
    playTab.classList.add('active');
    shopTab.classList.remove('active');
    playScreen.classList.remove('hidden');
    shopScreen.classList.add('hidden');
}

function showShopTab() {
    playTab.classList.remove('active');
    shopTab.classList.add('active');
    playScreen.classList.add('hidden');
    shopScreen.classList.remove('hidden');
    updateShop();
}

playTab.addEventListener('click', showPlayTab);
shopTab.addEventListener('click', showShopTab);

// -------------------------------------------------
// Bird selection
// -------------------------------------------------
document.querySelectorAll('.bird-select button').forEach(btn => {
    btn.addEventListener('click', () => {
        const src = btn.dataset.bird;
        if (!ownedBirds.includes(src)) return;
        document.querySelectorAll('.bird-select button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        startGame(src);
    });
});

// Shop
function updateShop() {
    document.querySelectorAll('.shop-item').forEach(item => {
        const src = item.dataset.bird;
        const btn = item.querySelector('.buy-btn');
        if (ownedBirds.includes(src)) {
            if (btn) btn.classList.add('owned');
            document.querySelector(`.bird-select button[data-bird="${src}"]`).classList.remove('locked');
        } else {
            if (btn) btn.classList.remove('owned');
            document.querySelector(`.bird-select button[data-bird="${src}"]`).classList.add('locked');
        }
    });
}

document.querySelectorAll('.shop-item .buy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const src = item.dataset.bird;
        const price = birdPrices[src];
        if (ownedBirds.includes(src) || balance < price) return;
        balance -= price;
        ownedBirds.push(src);
        saveSaves();
        updateAllStats();
        updateShop();
    });
});

restartBtn2.onclick = () => startGame(currentBird);
menuBtn2.onclick = goToMenu;

// -------------------------------------------------
// Init
// -------------------------------------------------
window.addEventListener('load', () => {
    updateAllStats();
    updateShop();
});
